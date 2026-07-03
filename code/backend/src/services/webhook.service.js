const db = require('../config/db');
const emailService = require('./email.service');

/** Durée d'abonnement (intervalle SQL) selon le type. */
const DUREE = {
  MENSUEL: "INTERVAL '1 month'",
  SEMESTRIEL: "INTERVAL '6 months'",
  ANNUEL: "INTERVAL '1 year'",
};

/**
 * Génère le prochain numéro de facture au format FACT-{ANNEE}-{NNNNN}.
 * @param {object} client - Client PG (dans une transaction)
 * @returns {Promise<string>}
 */
async function genererNumeroFacture(client) {
  const annee = new Date().getFullYear();
  const res = await client.query(
    `SELECT COUNT(*)::int AS nb FROM Factures WHERE numero_facture LIKE $1`,
    [`FACT-${annee}-%`]
  );
  const numero = String(res.rows[0].nb + 1).padStart(5, '0');
  return `FACT-${annee}-${numero}`;
}

/**
 * Traite un paiement réussi : passe la commande en PAIEMENT_ACCEPTE,
 * crée les abonnements, génère la facture et envoie l'email de confirmation.
 * Idempotent : ne fait rien si la commande est déjà acceptée.
 * @param {object} paymentIntent - Objet PaymentIntent Stripe
 */
async function paiementReussi(paymentIntent) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const cmdRes = await client.query(
      `SELECT * FROM Commandes WHERE stripe_payment_intent_id = $1 FOR UPDATE`,
      [paymentIntent.id]
    );
    const commande = cmdRes.rows[0];
    if (!commande || commande.statut === 'PAIEMENT_ACCEPTE') {
      await client.query('COMMIT');
      return;
    }

    await client.query(`UPDATE Commandes SET statut = 'PAIEMENT_ACCEPTE' WHERE id = $1`, [commande.id]);

    // Crée un abonnement actif par ligne de commande
    const lignes = await client.query('SELECT * FROM Commandes_Lignes WHERE commande_id = $1', [commande.id]);
    for (const ligne of lignes.rows) {
      const intervalle = DUREE[ligne.type_abonnement] || DUREE.MENSUEL;
      await client.query(
        `INSERT INTO Abonnements
           (utilisateur_id, produit_id, prix_id, commande_id, statut, type_abonnement,
            periode_debut, periode_fin)
         VALUES ($1, $2, $3, $4, 'ACTIF', $5, NOW(), NOW() + ${intervalle})`,
        [commande.utilisateur_id, ligne.produit_id, ligne.prix_id, commande.id, ligne.type_abonnement]
      );
    }

    // Génère la facture
    const numeroFacture = await genererNumeroFacture(client);
    await client.query(
      'INSERT INTO Factures (commande_id, numero_facture) VALUES ($1, $2)',
      [commande.id, numeroFacture]
    );

    await client.query('COMMIT');

    // Email de confirmation (hors transaction)
    const userRes = await db.query('SELECT email, prenom FROM Utilisateurs WHERE id = $1', [commande.utilisateur_id]);
    const user = userRes.rows[0];
    if (user) {
      await emailService
        .envoyerEmail(
          user.email,
          `Confirmation de commande ${numeroFacture} — CYNA`,
          `<h1 style="font-family:sans-serif">Merci ${user.prenom} !</h1>
           <p style="font-family:sans-serif">Votre commande a bien été confirmée.</p>
           <p style="font-family:sans-serif">Numéro de facture : <strong>${numeroFacture}</strong><br>
           Montant total : <strong>${Number(commande.total_ttc).toFixed(2)} € TTC</strong></p>
           <p style="font-family:sans-serif">Vos abonnements sont désormais actifs depuis votre espace client.</p>`
        )
        .catch((err) => console.error('Email de confirmation non envoyé :', err.message));
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Passe la commande en PAIEMENT_REFUSE suite à un échec de paiement. */
async function paiementEchoue(paymentIntent) {
  await db.query(
    `UPDATE Commandes SET statut = 'PAIEMENT_REFUSE'
     WHERE stripe_payment_intent_id = $1 AND statut = 'PAIEMENT_ATTENTE'`,
    [paymentIntent.id]
  );
}

/** Met à jour le statut d'un abonnement Stripe (subscription.updated/deleted). */
async function abonnementMisAJour(subscription, statut) {
  await db.query('UPDATE Abonnements SET statut = $1 WHERE stripe_subscription_id = $2', [
    statut,
    subscription.id,
  ]);
}

module.exports = { paiementReussi, paiementEchoue, abonnementMisAJour };
