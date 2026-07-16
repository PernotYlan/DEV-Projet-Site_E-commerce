const db = require('../config/db');
const { httpError } = require('../middlewares/errorHandler');

/* ============================================================
   ADMIN — Gestion du catalogue
   Produits, prix, images, catégories, carrousel, contenu accueil
   ============================================================ */

/** Colonnes triables autorisées pour la liste des produits (anti-injection). */
const TRI_PRODUITS = {
  nom: 'p.nom',
  priorite: 'p.priorite',
  is_active: 'p.is_active',
  cree_le: 'p.cree_le',
  categorie: 'c.nom',
  prix: 'prix_min',
};

// ---------- PRODUITS ----------

/**
 * Liste paginée, triable et filtrable des produits.
 * @param {object} q - page, limit, sort, order, search, categorie_id, is_active
 */
async function listerProduits(q) {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const valeurs = [];
  let i = 1;
  if (q.search) {
    conditions.push(`p.nom ILIKE $${i}`);
    valeurs.push(`%${q.search}%`);
    i++;
  }
  if (q.categorie_id) {
    conditions.push(`p.categorie_id = $${i}`);
    valeurs.push(parseInt(q.categorie_id, 10));
    i++;
  }
  if (q.is_active === 'true' || q.is_active === 'false') {
    conditions.push(`p.is_active = $${i}`);
    valeurs.push(q.is_active === 'true');
    i++;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const colonne = TRI_PRODUITS[q.sort] || 'p.priorite';
  const sens = q.order === 'asc' ? 'ASC' : 'DESC';

  const totalRes = await db.query(`SELECT COUNT(*)::int AS total FROM Produits p ${where}`, valeurs);
  const total = totalRes.rows[0].total;

  const res = await db.query(
    `SELECT p.id, p.nom, p.is_active, p.en_maintenance, p.priorite, p.est_top_produit,
            p.categorie_id, c.nom AS categorie_nom,
            (SELECT MIN(montant) FROM Prix WHERE produit_id = p.id AND is_active)::float8 AS prix_min
     FROM Produits p JOIN Categories c ON c.id = p.categorie_id
     ${where} ORDER BY ${colonne} ${sens} NULLS LAST LIMIT $${i} OFFSET $${i + 1}`,
    [...valeurs, limit, offset]
  );
  return { data: res.rows, pagination: { page, limit, total } };
}

/** Détail complet d'un produit (prix + images) pour l'admin. */
async function getProduit(id) {
  const res = await db.query(
    `SELECT p.*, c.nom AS categorie_nom
     FROM Produits p JOIN Categories c ON c.id = p.categorie_id
     WHERE p.id = $1`,
    [id]
  );
  const produit = res.rows[0];
  if (!produit) throw httpError(404, 'Produit introuvable');
  produit.prix = (await db.query('SELECT * FROM Prix WHERE produit_id = $1 ORDER BY type_abonnement', [id])).rows;
  produit.images = (await db.query('SELECT * FROM Produits_Images WHERE produit_id = $1 ORDER BY ordre_affichage', [id])).rows;
  return produit;
}

/**
 * Crée un produit avec ses prix éventuels.
 * @param {object} p - champs produit + prix: [{ type_abonnement, montant }]
 */
async function creerProduit(p) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(
      `INSERT INTO Produits (categorie_id, nom, description, specs_technique, image_url,
                             is_active, en_maintenance, priorite, est_top_produit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        p.categorie_id, p.nom, p.description || null,
        p.specs_technique ? JSON.stringify(p.specs_technique) : null,
        p.image_url || null,
        p.is_active ?? true, p.en_maintenance ?? false,
        p.priorite ?? 0, p.est_top_produit ?? false,
      ]
    );
    const id = res.rows[0].id;
    for (const prix of p.prix || []) {
      await client.query(
        'INSERT INTO Prix (produit_id, type_abonnement, montant) VALUES ($1, $2, $3)',
        [id, prix.type_abonnement, prix.montant]
      );
    }
    await client.query('COMMIT');
    return getProduit(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Met à jour les champs d'un produit (hors prix/images). */
async function modifierProduit(id, p) {
  const res = await db.query(
    `UPDATE Produits SET
       categorie_id = COALESCE($1, categorie_id),
       nom = COALESCE($2, nom),
       description = $3,
       specs_technique = $4,
       image_url = $5,
       is_active = COALESCE($6, is_active),
       en_maintenance = COALESCE($7, en_maintenance),
       priorite = COALESCE($8, priorite),
       est_top_produit = COALESCE($9, est_top_produit)
     WHERE id = $10 RETURNING id`,
    [
      p.categorie_id, p.nom, p.description || null,
      p.specs_technique ? JSON.stringify(p.specs_technique) : null,
      p.image_url || null,
      p.is_active, p.en_maintenance, p.priorite, p.est_top_produit, id,
    ]
  );
  if (res.rowCount === 0) throw httpError(404, 'Produit introuvable');
  return getProduit(id);
}

/** Supprime un produit (refus si abonnements actifs ou déjà commandé). */
async function supprimerProduit(id) {
  const actifs = await db.query(
    "SELECT COUNT(*)::int AS nb FROM Abonnements WHERE produit_id = $1 AND statut = 'ACTIF'",
    [id]
  );
  if (actifs.rows[0].nb > 0) {
    throw httpError(409, 'Impossible : des abonnements actifs sont liés à ce produit');
  }
  try {
    const res = await db.query('DELETE FROM Produits WHERE id = $1', [id]);
    if (res.rowCount === 0) throw httpError(404, 'Produit introuvable');
  } catch (err) {
    if (err.code === '23503') {
      throw httpError(409, 'Impossible : ce produit est lié à des commandes ou abonnements');
    }
    throw err;
  }
}

/**
 * Supprime plusieurs produits en une fois (sélection multiple back-office).
 * Chaque suppression respecte les mêmes règles que supprimerProduit ; les
 * échecs individuels (ex: abonnements actifs) n'interrompent pas le lot.
 * @param {Array<number|string>} ids
 * @returns {Promise<{supprimes: number[], echecs: {id: number, raison: string}[]}>}
 */
async function supprimerProduits(ids) {
  const supprimes = [];
  const echecs = [];
  for (const id of ids) {
    try {
      await supprimerProduit(id);
      supprimes.push(Number(id));
    } catch (err) {
      echecs.push({ id: Number(id), raison: err.message || 'Suppression impossible' });
    }
  }
  return { supprimes, echecs };
}

// ---------- PRIX ----------

/** Ajoute un prix à un produit. */
async function ajouterPrix(produitId, { type_abonnement, montant }) {
  try {
    const res = await db.query(
      'INSERT INTO Prix (produit_id, type_abonnement, montant) VALUES ($1, $2, $3) RETURNING *',
      [produitId, type_abonnement, montant]
    );
    return res.rows[0];
  } catch (err) {
    if (err.code === '23505') throw httpError(409, 'Un prix existe déjà pour ce type d’abonnement');
    throw err;
  }
}

/** Modifie un prix (montant et/ou activation). */
async function modifierPrix(id, { montant, is_active }) {
  const res = await db.query(
    `UPDATE Prix SET montant = COALESCE($1, montant), is_active = COALESCE($2, is_active)
     WHERE id = $3 RETURNING *`,
    [montant, is_active, id]
  );
  if (res.rowCount === 0) throw httpError(404, 'Prix introuvable');
  return res.rows[0];
}

/** Supprime un prix. */
async function supprimerPrix(id) {
  const res = await db.query('DELETE FROM Prix WHERE id = $1', [id]);
  if (res.rowCount === 0) throw httpError(404, 'Prix introuvable');
}

// ---------- IMAGES ----------

/** Ajoute une image supplémentaire à un produit. */
async function ajouterImage(produitId, { image_url, ordre_affichage }) {
  const res = await db.query(
    'INSERT INTO Produits_Images (produit_id, image_url, ordre_affichage) VALUES ($1, $2, $3) RETURNING *',
    [produitId, image_url, ordre_affichage ?? 0]
  );
  return res.rows[0];
}

/** Supprime une image d'un produit. */
async function supprimerImage(produitId, imageId) {
  const res = await db.query('DELETE FROM Produits_Images WHERE id = $1 AND produit_id = $2', [imageId, produitId]);
  if (res.rowCount === 0) throw httpError(404, 'Image introuvable');
}

/** Réordonne les images d'un produit. */
async function reordonnerImages(produitId, ordres) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    for (const { id, ordre_affichage } of ordres) {
      await client.query(
        'UPDATE Produits_Images SET ordre_affichage = $1 WHERE id = $2 AND produit_id = $3',
        [ordre_affichage, id, produitId]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------- CATÉGORIES ----------

/** Liste toutes les catégories (avec nombre de produits). */
async function listerCategories() {
  const res = await db.query(
    `SELECT c.*, (SELECT COUNT(*)::int FROM Produits WHERE categorie_id = c.id) AS nb_produits
     FROM Categories c ORDER BY c.ordre_affichage`
  );
  return res.rows;
}

/** Détail d'une catégorie. */
async function getCategorie(id) {
  const res = await db.query('SELECT * FROM Categories WHERE id = $1', [id]);
  if (res.rowCount === 0) throw httpError(404, 'Catégorie introuvable');
  return res.rows[0];
}

/** Crée une catégorie. */
async function creerCategorie(c) {
  const res = await db.query(
    `INSERT INTO Categories (nom, description, image_url, ordre_affichage, is_active)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [c.nom, c.description || null, c.image_url || null, c.ordre_affichage ?? 0, c.is_active ?? true]
  );
  return res.rows[0];
}

/** Modifie une catégorie. */
async function modifierCategorie(id, c) {
  const res = await db.query(
    `UPDATE Categories SET
       nom = COALESCE($1, nom), description = $2, image_url = $3,
       ordre_affichage = COALESCE($4, ordre_affichage), is_active = COALESCE($5, is_active)
     WHERE id = $6 RETURNING *`,
    [c.nom, c.description || null, c.image_url || null, c.ordre_affichage, c.is_active, id]
  );
  if (res.rowCount === 0) throw httpError(404, 'Catégorie introuvable');
  return res.rows[0];
}

/** Supprime une catégorie (refus si des produits y sont rattachés). */
async function supprimerCategorie(id) {
  try {
    const res = await db.query('DELETE FROM Categories WHERE id = $1', [id]);
    if (res.rowCount === 0) throw httpError(404, 'Catégorie introuvable');
  } catch (err) {
    if (err.code === '23503') throw httpError(409, 'Impossible : des produits sont rattachés à cette catégorie');
    throw err;
  }
}

/** Réordonne les catégories. */
async function reordonnerCategories(ordres) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    for (const { id, ordre_affichage } of ordres) {
      await client.query('UPDATE Categories SET ordre_affichage = $1 WHERE id = $2', [ordre_affichage, id]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------- CARROUSEL ----------

/** Liste toutes les slides du carrousel. */
async function listerCarrousel() {
  return (await db.query('SELECT * FROM Carrousel ORDER BY ordre_affichage')).rows;
}

/** Crée une slide. */
async function creerSlide(s) {
  const res = await db.query(
    `INSERT INTO Carrousel (titre, description, img_url, lien_url, ordre_affichage, is_active)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [s.titre || null, s.description || null, s.img_url, s.lien_url || null, s.ordre_affichage ?? 0, s.is_active ?? true]
  );
  return res.rows[0];
}

/** Modifie une slide. */
async function modifierSlide(id, s) {
  const res = await db.query(
    `UPDATE Carrousel SET
       titre = $1, description = $2, img_url = COALESCE($3, img_url),
       lien_url = $4, ordre_affichage = COALESCE($5, ordre_affichage), is_active = COALESCE($6, is_active)
     WHERE id = $7 RETURNING *`,
    [s.titre || null, s.description || null, s.img_url, s.lien_url || null, s.ordre_affichage, s.is_active, id]
  );
  if (res.rowCount === 0) throw httpError(404, 'Slide introuvable');
  return res.rows[0];
}

/** Supprime une slide. */
async function supprimerSlide(id) {
  const res = await db.query('DELETE FROM Carrousel WHERE id = $1', [id]);
  if (res.rowCount === 0) throw httpError(404, 'Slide introuvable');
}

/** Réordonne les slides. */
async function reordonnerCarrousel(ordres) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    for (const { id, ordre_affichage } of ordres) {
      await client.query('UPDATE Carrousel SET ordre_affichage = $1 WHERE id = $2', [ordre_affichage, id]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------- CONTENU ACCUEIL ----------

/** Liste les clés/valeurs du contenu d'accueil. */
async function listerContenuAccueil() {
  return (await db.query('SELECT cle, valeur, modifie_le FROM Contenu_Accueil ORDER BY cle')).rows;
}

/** Met à jour (ou crée) une clé de contenu d'accueil. */
async function modifierContenuAccueil(cle, valeur) {
  const res = await db.query(
    `INSERT INTO Contenu_Accueil (cle, valeur) VALUES ($1, $2)
     ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, modifie_le = NOW()
     RETURNING *`,
    [cle, valeur]
  );
  return res.rows[0];
}

module.exports = {
  listerProduits, getProduit, creerProduit, modifierProduit, supprimerProduit, supprimerProduits,
  ajouterPrix, modifierPrix, supprimerPrix,
  ajouterImage, supprimerImage, reordonnerImages,
  listerCategories, getCategorie, creerCategorie, modifierCategorie, supprimerCategorie, reordonnerCategories,
  listerCarrousel, creerSlide, modifierSlide, supprimerSlide, reordonnerCarrousel,
  listerContenuAccueil, modifierContenuAccueil,
};
