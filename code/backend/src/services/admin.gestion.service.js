const db = require('../config/db');
const { httpError } = require('../middlewares/errorHandler');
const { anonymiser } = require('./utilisateurs.service');
const { genererFacturePdf } = require('./facture.service');

/* ============================================================
   ADMIN — Dashboard + gestion clients
   Statistiques, utilisateurs, commandes, abonnements, messages
   ============================================================ */

// ---------- DASHBOARD ----------

/**
 * Statistiques du tableau de bord.
 * @param {'7j'|'5s'} periode - 7 jours (défaut) ou 5 semaines
 */
async function dashboardStats(periode = '7j') {
  const parSemaine = periode === '5s';

  // Histogramme des ventes (revenu TTC des commandes payées)
  const ventes = parSemaine
    ? await db.query(
        `SELECT to_char(d, 'YYYY-MM-DD') AS label, COALESCE(SUM(c.total_ttc), 0)::float8 AS total
         FROM generate_series(date_trunc('week', CURRENT_DATE) - INTERVAL '4 weeks',
                              date_trunc('week', CURRENT_DATE), INTERVAL '1 week') d
         LEFT JOIN Commandes c ON date_trunc('week', c.cree_le) = d AND c.statut = 'PAIEMENT_ACCEPTE'
         GROUP BY d ORDER BY d`
      )
    : await db.query(
        `SELECT to_char(d, 'YYYY-MM-DD') AS label, COALESCE(SUM(c.total_ttc), 0)::float8 AS total
         FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') d
         LEFT JOIN Commandes c ON c.cree_le::date = d::date AND c.statut = 'PAIEMENT_ACCEPTE'
         GROUP BY d ORDER BY d`
      );

  // Répartition des ventes par catégorie (camembert) sur la période.
  // Les lignes de commandes sont pré-filtrées (statut + date) dans un CTE
  // AVANT la jointure vers Catégories : un simple LEFT JOIN Commandes avec le
  // filtre dans le ON (comme avant) laisse passer les lignes de commandes
  // non payées/hors période, puisque SUM(cl.prix_total_ht) porte sur une
  // colonne de la table jointe plus tôt dans la chaîne, non filtrée elle-même.
  const intervalle = parSemaine ? "INTERVAL '5 weeks'" : "INTERVAL '7 days'";
  const parCategorie = await db.query(
    `WITH lignes_payees AS (
       SELECT cl.prix_total_ht, p.categorie_id
       FROM Commandes_Lignes cl
       JOIN Produits p ON p.id = cl.produit_id
       JOIN Commandes c ON c.id = cl.commande_id
       WHERE c.statut = 'PAIEMENT_ACCEPTE' AND c.cree_le >= NOW() - ${intervalle}
     )
     SELECT cat.nom AS label, COALESCE(SUM(l.prix_total_ht), 0)::float8 AS total
     FROM Categories cat
     LEFT JOIN lignes_payees l ON l.categorie_id = cat.id
     GROUP BY cat.nom ORDER BY total DESC`
  );

  // Histogramme multi-couches : panier moyen par catégorie, jour par jour (ou semaine par semaine)
  const parCategorieParPeriode = parSemaine
    ? await db.query(
        `WITH lignes_payees AS (
           SELECT cl.prix_total_ht, cl.commande_id, p.categorie_id, c.cree_le
           FROM Commandes_Lignes cl
           JOIN Produits p ON p.id = cl.produit_id
           JOIN Commandes c ON c.id = cl.commande_id
           WHERE c.statut = 'PAIEMENT_ACCEPTE'
         )
         SELECT to_char(d, 'YYYY-MM-DD') AS label, cat.nom AS categorie,
                CASE WHEN COUNT(DISTINCT l.commande_id) = 0 THEN 0
                     ELSE (SUM(l.prix_total_ht) / COUNT(DISTINCT l.commande_id))::float8 END AS panier_moyen
         FROM generate_series(date_trunc('week', CURRENT_DATE) - INTERVAL '4 weeks',
                              date_trunc('week', CURRENT_DATE), INTERVAL '1 week') d
         CROSS JOIN Categories cat
         LEFT JOIN lignes_payees l ON l.categorie_id = cat.id AND date_trunc('week', l.cree_le) = d
         GROUP BY d, cat.nom ORDER BY d, cat.nom`
      )
    : await db.query(
        `WITH lignes_payees AS (
           SELECT cl.prix_total_ht, cl.commande_id, p.categorie_id, c.cree_le
           FROM Commandes_Lignes cl
           JOIN Produits p ON p.id = cl.produit_id
           JOIN Commandes c ON c.id = cl.commande_id
           WHERE c.statut = 'PAIEMENT_ACCEPTE'
         )
         SELECT to_char(d, 'YYYY-MM-DD') AS label, cat.nom AS categorie,
                CASE WHEN COUNT(DISTINCT l.commande_id) = 0 THEN 0
                     ELSE (SUM(l.prix_total_ht) / COUNT(DISTINCT l.commande_id))::float8 END AS panier_moyen
         FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') d
         CROSS JOIN Categories cat
         LEFT JOIN lignes_payees l ON l.categorie_id = cat.id AND l.cree_le::date = d::date
         GROUP BY d, cat.nom ORDER BY d, cat.nom`
      );

  // Pivote [{label, categorie, panier_moyen}] -> {categories: [...], data: [{label, [categorie]: valeur}]}
  const categoriesNoms = [...new Set(parCategorieParPeriode.rows.map((r) => r.categorie))];
  const parLabel = new Map();
  for (const r of parCategorieParPeriode.rows) {
    if (!parLabel.has(r.label)) parLabel.set(r.label, { label: r.label });
    parLabel.get(r.label)[r.categorie] = r.panier_moyen;
  }
  const paniersParCategorie = { categories: categoriesNoms, data: [...parLabel.values()] };

  // Cartes KPI
  const abosActifs = await db.query("SELECT COUNT(*)::int AS nb FROM Abonnements WHERE statut = 'ACTIF'");
  const nouveauxUsers = await db.query(
    "SELECT COUNT(*)::int AS nb FROM Utilisateurs WHERE cree_le >= NOW() - INTERVAL '7 days'"
  );
  const revenu = await db.query(
    `SELECT COALESCE(SUM(total_ttc), 0)::float8 AS total FROM Commandes
     WHERE statut = 'PAIEMENT_ACCEPTE' AND cree_le >= NOW() - ${intervalle}`
  );
  const nbCommandes = await db.query(
    `SELECT COUNT(*)::int AS nb FROM Commandes
     WHERE statut = 'PAIEMENT_ACCEPTE' AND cree_le >= NOW() - ${intervalle}`
  );

  return {
    periode,
    ventes: ventes.rows,
    ventes_par_categorie: parCategorie.rows,
    paniers_par_categorie: paniersParCategorie,
    kpi: {
      abonnements_actifs: abosActifs.rows[0].nb,
      nouveaux_utilisateurs_7j: nouveauxUsers.rows[0].nb,
      revenu_periode: revenu.rows[0].total,
      commandes_periode: nbCommandes.rows[0].nb,
    },
  };
}

// ---------- UTILISATEURS ----------

/** Liste paginée des utilisateurs avec recherche par nom/email. */
async function listerUtilisateurs(q) {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const valeurs = [];
  let i = 1;
  if (q.search) {
    conditions.push(`(email ILIKE $${i} OR nom ILIKE $${i} OR prenom ILIKE $${i})`);
    valeurs.push(`%${q.search}%`);
    i++;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = (await db.query(`SELECT COUNT(*)::int AS total FROM Utilisateurs ${where}`, valeurs)).rows[0].total;
  const res = await db.query(
    `SELECT id, nom, prenom, email, role, email_verifie, cree_le
     FROM Utilisateurs ${where} ORDER BY cree_le DESC LIMIT $${i} OFFSET $${i + 1}`,
    [...valeurs, limit, offset]
  );
  return { data: res.rows, pagination: { page, limit, total } };
}

/** Détail d'un utilisateur avec ses commandes et abonnements. */
async function getUtilisateur(id) {
  const res = await db.query(
    'SELECT id, nom, prenom, email, telephone, role, email_verifie, cree_le FROM Utilisateurs WHERE id = $1',
    [id]
  );
  const user = res.rows[0];
  if (!user) throw httpError(404, 'Utilisateur introuvable');
  user.commandes = (await db.query(
    'SELECT id, total_ttc, statut, cree_le FROM Commandes WHERE utilisateur_id = $1 ORDER BY cree_le DESC',
    [id]
  )).rows;
  user.abonnements = (await db.query(
    `SELECT a.id, p.nom AS produit_nom, a.statut, a.type_abonnement
     FROM Abonnements a JOIN Produits p ON p.id = a.produit_id
     WHERE a.utilisateur_id = $1 ORDER BY a.cree_le DESC`,
    [id]
  )).rows;
  return user;
}

/** Modifie un utilisateur (rôle, nom, prénom, téléphone). */
async function modifierUtilisateur(id, u) {
  if (u.role && !['CLIENT', 'ADMIN'].includes(u.role)) {
    throw httpError(400, 'Rôle invalide');
  }
  const res = await db.query(
    `UPDATE Utilisateurs SET
       role = COALESCE($1, role), nom = COALESCE($2, nom),
       prenom = COALESCE($3, prenom), telephone = COALESCE($4, telephone)
     WHERE id = $5
     RETURNING id, nom, prenom, email, telephone, role, email_verifie, cree_le`,
    [u.role, u.nom, u.prenom, u.telephone, id]
  );
  if (res.rowCount === 0) throw httpError(404, 'Utilisateur introuvable');
  return res.rows[0];
}

/** Anonymise un utilisateur (RGPD) — réutilise la logique du compte client. */
async function anonymiserUtilisateur(id) {
  const exists = await db.query('SELECT id FROM Utilisateurs WHERE id = $1', [id]);
  if (exists.rowCount === 0) throw httpError(404, 'Utilisateur introuvable');
  await anonymiser(id);
}

// ---------- COMMANDES ----------

/** Liste paginée des commandes avec filtres statut et plage de dates. */
async function listerCommandes(q) {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const valeurs = [];
  let i = 1;
  if (q.statut) {
    conditions.push(`c.statut = $${i}`);
    valeurs.push(q.statut);
    i++;
  }
  if (q.date_min) {
    conditions.push(`c.cree_le >= $${i}`);
    valeurs.push(q.date_min);
    i++;
  }
  if (q.date_max) {
    conditions.push(`c.cree_le <= $${i}`);
    valeurs.push(q.date_max);
    i++;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = (await db.query(`SELECT COUNT(*)::int AS total FROM Commandes c ${where}`, valeurs)).rows[0].total;
  const res = await db.query(
    `SELECT c.id, c.total_ttc, c.statut, c.cree_le, u.email, u.nom, u.prenom
     FROM Commandes c JOIN Utilisateurs u ON u.id = c.utilisateur_id
     ${where} ORDER BY c.cree_le DESC LIMIT $${i} OFFSET $${i + 1}`,
    [...valeurs, limit, offset]
  );
  return { data: res.rows, pagination: { page, limit, total } };
}

/** Détail d'une commande (lignes, client, facture). */
async function getCommande(id) {
  const res = await db.query(
    `SELECT c.*, u.email, u.nom, u.prenom
     FROM Commandes c JOIN Utilisateurs u ON u.id = c.utilisateur_id WHERE c.id = $1`,
    [id]
  );
  const commande = res.rows[0];
  if (!commande) throw httpError(404, 'Commande introuvable');
  commande.lignes = (await db.query('SELECT * FROM Commandes_Lignes WHERE commande_id = $1', [id])).rows;
  commande.facture = (await db.query('SELECT numero_facture, pdf_url FROM Factures WHERE commande_id = $1', [id])).rows[0] || null;
  return commande;
}

/**
 * Génère le PDF de la facture d'une commande (accès admin, aucune vérification de propriétaire).
 * @param {string} commandeId - UUID de la commande
 * @returns {Promise<{buffer: Buffer, numeroFacture: string}>}
 */
async function telechargerFacture(commandeId) {
  const commande = await getCommande(commandeId);
  if (!commande.facture) {
    throw httpError(404, 'Aucune facture disponible pour cette commande (paiement non confirmé)');
  }
  commande.numero_facture = commande.facture.numero_facture;
  const utilisateur = { nom: commande.nom, prenom: commande.prenom, email: commande.email };
  const buffer = await genererFacturePdf(commande, utilisateur);
  return { buffer, numeroFacture: commande.numero_facture };
}

// ---------- ABONNEMENTS ----------

/** Liste paginée des abonnements avec filtre statut. */
async function listerAbonnements(q) {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const valeurs = [];
  let i = 1;
  if (q.statut) {
    conditions.push(`a.statut = $${i}`);
    valeurs.push(q.statut);
    i++;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = (await db.query(`SELECT COUNT(*)::int AS total FROM Abonnements a ${where}`, valeurs)).rows[0].total;
  const res = await db.query(
    `SELECT a.id, a.statut, a.type_abonnement, a.periode_debut, a.periode_fin,
            p.nom AS produit_nom, u.email
     FROM Abonnements a JOIN Produits p ON p.id = a.produit_id
       JOIN Utilisateurs u ON u.id = a.utilisateur_id
     ${where} ORDER BY a.cree_le DESC LIMIT $${i} OFFSET $${i + 1}`,
    [...valeurs, limit, offset]
  );
  return { data: res.rows, pagination: { page, limit, total } };
}

/** Détail d'un abonnement (avec produit et client). */
async function getAbonnement(id) {
  const res = await db.query(
    `SELECT a.*, p.nom AS produit_nom, u.email
     FROM Abonnements a JOIN Produits p ON p.id = a.produit_id
       JOIN Utilisateurs u ON u.id = a.utilisateur_id
     WHERE a.id = $1`,
    [id]
  );
  if (res.rowCount === 0) throw httpError(404, 'Abonnement introuvable');
  return res.rows[0];
}

/** Force le statut d'un abonnement. */
async function changerStatutAbonnement(id, statut) {
  if (!['ACTIF', 'SUSPENDU', 'RESILIE', 'PAST_DUE'].includes(statut)) {
    throw httpError(400, 'Statut invalide');
  }
  const res = await db.query('UPDATE Abonnements SET statut = $1 WHERE id = $2 RETURNING *', [statut, id]);
  if (res.rowCount === 0) throw httpError(404, 'Abonnement introuvable');
  return res.rows[0];
}

// ---------- MESSAGES ----------

/** Liste paginée des messages de contact avec filtres statut/source. */
async function listerMessages(q) {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const valeurs = [];
  let i = 1;
  if (q.statut) {
    conditions.push(`statut = $${i}`);
    valeurs.push(q.statut);
    i++;
  }
  if (q.source) {
    conditions.push(`source = $${i}`);
    valeurs.push(q.source);
    i++;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = (await db.query(`SELECT COUNT(*)::int AS total FROM Messages_Contact ${where}`, valeurs)).rows[0].total;
  const res = await db.query(
    `SELECT id, email, sujet, source, statut, cree_le FROM Messages_Contact
     ${where} ORDER BY cree_le DESC LIMIT $${i} OFFSET $${i + 1}`,
    [...valeurs, limit, offset]
  );
  return { data: res.rows, pagination: { page, limit, total } };
}

/** Détail d'un message. */
async function getMessage(id) {
  const res = await db.query('SELECT * FROM Messages_Contact WHERE id = $1', [id]);
  if (res.rowCount === 0) throw httpError(404, 'Message introuvable');
  return res.rows[0];
}

/** Change le statut d'un message et enregistre l'admin traitant. */
async function changerStatutMessage(id, statut, adminId) {
  if (!['NOUVEAU', 'EN_COURS', 'TRAITE', 'FERME'].includes(statut)) {
    throw httpError(400, 'Statut invalide');
  }
  const res = await db.query(
    'UPDATE Messages_Contact SET statut = $1, traite_par = $2 WHERE id = $3 RETURNING *',
    [statut, adminId, id]
  );
  if (res.rowCount === 0) throw httpError(404, 'Message introuvable');
  return res.rows[0];
}

module.exports = {
  dashboardStats,
  listerUtilisateurs, getUtilisateur, modifierUtilisateur, anonymiserUtilisateur,
  listerCommandes, getCommande, telechargerFacture,
  listerAbonnements, getAbonnement, changerStatutAbonnement,
  listerMessages, getMessage, changerStatutMessage,
};
