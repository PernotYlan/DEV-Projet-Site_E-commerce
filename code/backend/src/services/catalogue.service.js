const db = require('../config/db');
const { httpError } = require('../middlewares/errorHandler');

/** Couleur/icône d'affichage dérivées du nom de catégorie (pour les visuels front). */
const STYLE_CATEGORIE = {
  SOC: { couleur: '#5D737E', icone: '🛡️' },
  EDR: { couleur: '#E49AB0', icone: '💻' },
  XDR: { couleur: '#1f2d33', icone: '🌐' },
};
const STYLE_DEFAUT = { couleur: '#5D737E', icone: '🛡️' };

/** Ajoute couleur + icône à une catégorie selon son nom. */
function styliserCategorie(categorie) {
  const style = STYLE_CATEGORIE[categorie.nom] || STYLE_DEFAUT;
  return { ...categorie, ...style };
}

/** Récupère les prix actifs d'un produit. */
async function prixDuProduit(produitId) {
  const res = await db.query(
    `SELECT id, type_abonnement, montant::float8 AS montant, monnaie, is_active
     FROM Prix WHERE produit_id = $1 AND is_active = TRUE
     ORDER BY CASE type_abonnement
       WHEN 'MENSUEL' THEN 1 WHEN 'SEMESTRIEL' THEN 2 WHEN 'ANNUEL' THEN 3 END`,
    [produitId]
  );
  return res.rows;
}

/** Attache prix + couleur (de la catégorie) à une liste de produits. */
async function enrichirProduits(produits) {
  for (const produit of produits) {
    produit.prix = await prixDuProduit(produit.id);
    const style = STYLE_CATEGORIE[produit.categorie_nom] || STYLE_DEFAUT;
    produit.couleur = style.couleur;
  }
  return produits;
}

/**
 * Tri du catalogue : disponibles prioritaires d'abord, puis disponibles sans
 * priorité, puis indisponibles/maintenance en dernier.
 */
const ORDRE_CATALOGUE = `
  ORDER BY
    CASE WHEN p.is_active AND NOT p.en_maintenance THEN 0 ELSE 1 END,
    p.priorite DESC,
    p.cree_le DESC`;

/** Données de la page d'accueil. */
async function accueil() {
  const carrouselRes = await db.query(
    'SELECT * FROM Carrousel WHERE is_active = TRUE ORDER BY ordre_affichage'
  );
  // Couleur d'affichage cyclique pour les slides (en l'absence d'image)
  const palette = ['#1f2d33', '#E49AB0', '#5D737E'];
  const carrousel = carrouselRes.rows.map((slide, i) => ({ ...slide, couleur: palette[i % palette.length] }));

  const contenuRes = await db.query('SELECT cle, valeur FROM Contenu_Accueil');
  const contenu = {};
  contenuRes.rows.forEach((row) => {
    contenu[row.cle] = row.valeur;
  });

  const categoriesRes = await db.query(
    'SELECT * FROM Categories WHERE is_active = TRUE ORDER BY ordre_affichage'
  );
  const categories = categoriesRes.rows.map(styliserCategorie);

  const topRes = await db.query(
    `SELECT p.*, c.nom AS categorie_nom
     FROM Produits p JOIN Categories c ON c.id = p.categorie_id
     WHERE p.est_top_produit = TRUE AND p.is_active = TRUE
     ORDER BY p.priorite DESC`
  );
  const top_produits = await enrichirProduits(topRes.rows);

  return { carrousel, contenu, categories, top_produits };
}

/** Liste des catégories actives. */
async function categories() {
  const res = await db.query('SELECT * FROM Categories WHERE is_active = TRUE ORDER BY ordre_affichage');
  return res.rows.map(styliserCategorie);
}

/** Catégorie + ses produits triés. */
async function categorieProduits(id) {
  const catRes = await db.query('SELECT * FROM Categories WHERE id = $1', [id]);
  const categorie = catRes.rows[0];
  if (!categorie) throw httpError(404, 'Catégorie introuvable');

  const produitsRes = await db.query(
    `SELECT p.*, c.nom AS categorie_nom
     FROM Produits p JOIN Categories c ON c.id = p.categorie_id
     WHERE p.categorie_id = $1 ${ORDRE_CATALOGUE}`,
    [id]
  );
  return {
    categorie: styliserCategorie(categorie),
    produits: await enrichirProduits(produitsRes.rows),
  };
}

/** Détail d'un produit + images + prix + 6 produits similaires. */
async function produit(id) {
  const res = await db.query(
    `SELECT p.*, c.nom AS categorie_nom
     FROM Produits p JOIN Categories c ON c.id = p.categorie_id
     WHERE p.id = $1`,
    [id]
  );
  const produit = res.rows[0];
  if (!produit) throw httpError(404, 'Produit introuvable');

  produit.prix = await prixDuProduit(produit.id);
  produit.couleur = (STYLE_CATEGORIE[produit.categorie_nom] || STYLE_DEFAUT).couleur;

  const imagesRes = await db.query(
    'SELECT id, image_url, ordre_affichage FROM Produits_Images WHERE produit_id = $1 ORDER BY ordre_affichage',
    [id]
  );
  produit.images = imagesRes.rows;

  const similairesRes = await db.query(
    `SELECT p.*, c.nom AS categorie_nom
     FROM Produits p JOIN Categories c ON c.id = p.categorie_id
     WHERE p.categorie_id = $1 AND p.id <> $2 AND p.is_active = TRUE
     ORDER BY RANDOM() LIMIT 6`,
    [produit.categorie_id, id]
  );
  produit.similaires = await enrichirProduits(similairesRes.rows);

  return produit;
}

/** Recherche full-text paginée avec facettes et tri. */
async function recherche(params) {
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit, 10) || 12));
  const offset = (page - 1) * limit;

  const conditions = [];
  const valeurs = [];
  let i = 1;

  if (params.q) {
    conditions.push(`to_tsvector('french', p.nom || ' ' || COALESCE(p.description, '')) @@ plainto_tsquery('french', $${i})`);
    valeurs.push(params.q);
    i++;
  }
  if (params.categorie_id) {
    conditions.push(`p.categorie_id = $${i}`);
    valeurs.push(parseInt(params.categorie_id, 10));
    i++;
  }
  if (params.disponible_seulement === 'true' || params.disponible_seulement === true) {
    conditions.push('p.is_active = TRUE AND p.en_maintenance = FALSE');
  }
  if (params.type_abonnement) {
    conditions.push(`EXISTS (SELECT 1 FROM Prix pr WHERE pr.produit_id = p.id AND pr.is_active AND pr.type_abonnement = $${i})`);
    valeurs.push(params.type_abonnement);
    i++;
  }
  if (params.prix_min) {
    conditions.push(`(SELECT MIN(montant) FROM Prix pr WHERE pr.produit_id = p.id AND pr.is_active) >= $${i}`);
    valeurs.push(parseFloat(params.prix_min));
    i++;
  }
  if (params.prix_max) {
    conditions.push(`(SELECT MIN(montant) FROM Prix pr WHERE pr.produit_id = p.id AND pr.is_active) <= $${i}`);
    valeurs.push(parseFloat(params.prix_max));
    i++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy;
  switch (params.tri) {
    case 'prix_asc':
      orderBy = 'ORDER BY (SELECT MIN(montant) FROM Prix pr WHERE pr.produit_id = p.id AND pr.is_active) ASC NULLS LAST';
      break;
    case 'prix_desc':
      orderBy = 'ORDER BY (SELECT MIN(montant) FROM Prix pr WHERE pr.produit_id = p.id AND pr.is_active) DESC NULLS LAST';
      break;
    case 'date_asc':
      orderBy = 'ORDER BY p.cree_le ASC';
      break;
    case 'date_desc':
      orderBy = 'ORDER BY p.cree_le DESC';
      break;
    case 'disponibilite':
      orderBy = 'ORDER BY CASE WHEN p.is_active AND NOT p.en_maintenance THEN 0 ELSE 1 END, p.priorite DESC';
      break;
    default:
      orderBy = 'ORDER BY CASE WHEN p.is_active AND NOT p.en_maintenance THEN 0 ELSE 1 END, p.priorite DESC, p.cree_le DESC';
  }

  const totalRes = await db.query(`SELECT COUNT(*)::int AS total FROM Produits p ${where}`, valeurs);
  const total = totalRes.rows[0].total;

  const produitsRes = await db.query(
    `SELECT p.*, c.nom AS categorie_nom
     FROM Produits p JOIN Categories c ON c.id = p.categorie_id
     ${where} ${orderBy} LIMIT $${i} OFFSET $${i + 1}`,
    [...valeurs, limit, offset]
  );

  return {
    data: await enrichirProduits(produitsRes.rows),
    pagination: { page, limit, total },
  };
}

module.exports = { accueil, categories, categorieProduits, produit, recherche };
