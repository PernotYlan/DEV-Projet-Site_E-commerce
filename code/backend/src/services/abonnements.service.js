const db = require('../config/db');
const { httpError } = require('../middlewares/errorHandler');
const { getStripe } = require('../config/stripe');

/**
 * Liste les abonnements de l'utilisateur, avec le nom du produit.
 * @param {string} userId - UUID de l'utilisateur
 */
async function listerAbonnements(userId) {
  const res = await db.query(
    `SELECT a.*, p.nom AS produit_nom
     FROM Abonnements a JOIN Produits p ON p.id = a.produit_id
     WHERE a.utilisateur_id = $1
     ORDER BY a.cree_le DESC`,
    [userId]
  );
  return res.rows;
}

/** Détail d'un abonnement (vérifie l'appartenance). */
async function getAbonnement(userId, id) {
  const res = await db.query(
    `SELECT a.*, p.nom AS produit_nom
     FROM Abonnements a JOIN Produits p ON p.id = a.produit_id
     WHERE a.id = $1 AND a.utilisateur_id = $2`,
    [id, userId]
  );
  if (res.rowCount === 0) throw httpError(404, 'Abonnement introuvable');
  return res.rows[0];
}

/**
 * Demande la résiliation : coupe le renouvellement (effective en fin de période).
 * Si un abonnement Stripe existe, demande l'annulation en fin de période.
 * @param {string} userId - UUID de l'utilisateur
 * @param {string} id - UUID de l'abonnement
 */
async function resilier(userId, id) {
  const abonnement = await getAbonnement(userId, id);
  if (abonnement.resiliation_demandee_le) {
    return abonnement; // déjà demandé
  }

  if (abonnement.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.update(abonnement.stripe_subscription_id, { cancel_at_period_end: true });
    } catch (err) {
      console.error('Annulation Stripe impossible :', err.message);
    }
  }

  const res = await db.query(
    `UPDATE Abonnements
     SET renouvellement_auto = FALSE, resiliation_demandee_le = NOW()
     WHERE id = $1 AND utilisateur_id = $2
     RETURNING *`,
    [id, userId]
  );
  return res.rows[0];
}

module.exports = { listerAbonnements, getAbonnement, resilier };
