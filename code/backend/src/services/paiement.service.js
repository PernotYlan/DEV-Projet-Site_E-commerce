const db = require('../config/db');
const { getStripe } = require('../config/stripe');
const { httpError } = require('../middlewares/errorHandler');

/** Colonnes de carte renvoyées au client (jamais le token Stripe complet). */
const COLONNES_CARTE =
  'id, derniers_quatre_chiffres, nom_sur_carte, mois_expiration, annee_expiration, est_defaut, cree_le';

/**
 * Récupère (ou crée) le client Stripe associé à l'utilisateur et mémorise
 * son identifiant en BDD.
 * @param {string} userId - UUID de l'utilisateur
 * @returns {Promise<string>} stripe_customer_id
 */
async function assurerClientStripe(userId) {
  const stripe = getStripe();
  const resultat = await db.query(
    'SELECT email, nom, prenom, stripe_customer_id FROM Utilisateurs WHERE id = $1',
    [userId]
  );
  const user = resultat.rows[0];
  if (!user) throw httpError(404, 'Utilisateur introuvable');
  if (user.stripe_customer_id) return user.stripe_customer_id;

  const client = await stripe.customers.create({
    email: user.email,
    name: `${user.prenom} ${user.nom}`,
    metadata: { utilisateur_id: userId },
  });
  await db.query('UPDATE Utilisateurs SET stripe_customer_id = $1 WHERE id = $2', [client.id, userId]);
  return client.id;
}

/** Liste les cartes enregistrées de l'utilisateur (défaut en premier). */
async function listerPaiements(userId) {
  const resultat = await db.query(
    `SELECT ${COLONNES_CARTE} FROM Methodes_Paiement
     WHERE utilisateur_id = $1 ORDER BY est_defaut DESC, cree_le DESC`,
    [userId]
  );
  return resultat.rows;
}

/**
 * Enregistre une carte : rattache le payment method Stripe (tokenisé côté
 * front) au client Stripe puis stocke uniquement les métadonnées d'affichage.
 * @param {string} userId - UUID de l'utilisateur
 * @param {string} paymentMethodId - ID du PaymentMethod Stripe (pm_...)
 */
async function ajouterPaiement(userId, paymentMethodId) {
  const stripe = getStripe();
  const customerId = await assurerClientStripe(userId);

  // Rattache la carte au client puis lit ses métadonnées (4 derniers chiffres, expiration)
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (!pm.card) throw httpError(400, 'Moyen de paiement invalide');

  // Première carte => carte par défaut
  const nb = await db.query('SELECT COUNT(*)::int AS nb FROM Methodes_Paiement WHERE utilisateur_id = $1', [userId]);
  const estDefaut = nb.rows[0].nb === 0;
  if (estDefaut) {
    await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
  }

  const resultat = await db.query(
    `INSERT INTO Methodes_Paiement
       (utilisateur_id, stripe_payment_method_id, derniers_quatre_chiffres,
        nom_sur_carte, mois_expiration, annee_expiration, est_defaut)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${COLONNES_CARTE}`,
    [
      userId,
      pm.id,
      pm.card.last4,
      pm.billing_details?.name || null,
      pm.card.exp_month,
      pm.card.exp_year,
      estDefaut,
    ]
  );
  return resultat.rows[0];
}

/** Supprime une carte (détache de Stripe puis supprime la ligne). */
async function supprimerPaiement(userId, id) {
  const resultat = await db.query(
    'SELECT stripe_payment_method_id FROM Methodes_Paiement WHERE id = $1 AND utilisateur_id = $2',
    [id, userId]
  );
  if (resultat.rowCount === 0) throw httpError(404, 'Carte introuvable');

  try {
    await getStripe().paymentMethods.detach(resultat.rows[0].stripe_payment_method_id);
  } catch {
    // La carte peut déjà être détachée côté Stripe : on continue.
  }
  await db.query('DELETE FROM Methodes_Paiement WHERE id = $1 AND utilisateur_id = $2', [id, userId]);
}

/** Définit la carte par défaut (désactive les autres + met à jour Stripe). */
async function definirDefaut(userId, id) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE Methodes_Paiement SET est_defaut = FALSE WHERE utilisateur_id = $1', [userId]);
    const resultat = await client.query(
      `UPDATE Methodes_Paiement SET est_defaut = TRUE
       WHERE id = $1 AND utilisateur_id = $2 RETURNING stripe_payment_method_id`,
      [id, userId]
    );
    if (resultat.rowCount === 0) throw httpError(404, 'Carte introuvable');
    await client.query('COMMIT');

    // Met à jour la carte par défaut côté Stripe
    const customer = await db.query('SELECT stripe_customer_id FROM Utilisateurs WHERE id = $1', [userId]);
    if (customer.rows[0]?.stripe_customer_id) {
      await getStripe().customers.update(customer.rows[0].stripe_customer_id, {
        invoice_settings: { default_payment_method: resultat.rows[0].stripe_payment_method_id },
      });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  assurerClientStripe,
  listerPaiements,
  ajouterPaiement,
  supprimerPaiement,
  definirDefaut,
};
