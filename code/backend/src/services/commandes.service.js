const db = require('../config/db');
const { getStripe } = require('../config/stripe');
const { httpError } = require('../middlewares/errorHandler');
const { assurerClientStripe } = require('./paiement.service');

/** Taux de TVA appliqué (20%). */
const TAUX_TVA = 20;

/**
 * Crée une commande : vérifie les produits, calcule les totaux, crée un
 * PaymentIntent Stripe et insère la commande (PAIEMENT_ATTENTE) avec ses lignes.
 * @param {string} userId - UUID de l'utilisateur
 * @param {{adresse_id: string, methode_paiement_id?: string, items: Array}} donnees
 * @returns {Promise<{commande_id: string, client_secret: string}>}
 */
async function creerCommande(userId, { adresse_id, methode_paiement_id, items }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'Le panier est vide');
  }

  // Adresse de facturation (doit appartenir à l'utilisateur)
  const adresseRes = await db.query('SELECT * FROM Adresses WHERE id = $1 AND utilisateur_id = $2', [
    adresse_id,
    userId,
  ]);
  const adresse = adresseRes.rows[0];
  if (!adresse) throw httpError(404, 'Adresse de facturation introuvable');

  // Carte (4 derniers chiffres pour le snapshot) si fournie
  let carteDerniers = null;
  if (methode_paiement_id) {
    const carteRes = await db.query(
      'SELECT derniers_quatre_chiffres FROM Methodes_Paiement WHERE id = $1 AND utilisateur_id = $2',
      [methode_paiement_id, userId]
    );
    if (carteRes.rowCount === 0) throw httpError(404, 'Moyen de paiement introuvable');
    carteDerniers = carteRes.rows[0].derniers_quatre_chiffres;
  }

  // Construit les lignes à partir des prix réels en BDD (jamais ceux du client)
  const lignes = [];
  let totalHt = 0;
  for (const item of items) {
    const prixRes = await db.query(
      `SELECT pr.id AS prix_id, pr.montant, pr.type_abonnement, pr.produit_id,
              p.nom, p.is_active, p.en_maintenance
       FROM Prix pr JOIN Produits p ON p.id = pr.produit_id
       WHERE pr.id = $1 AND pr.produit_id = $2 AND pr.is_active = TRUE`,
      [item.prix_id, item.produit_id]
    );
    const prix = prixRes.rows[0];
    if (!prix) throw httpError(400, 'Un service du panier est introuvable ou indisponible');
    if (!prix.is_active || prix.en_maintenance) {
      throw httpError(400, `Le service « ${prix.nom} » est momentanément indisponible`);
    }
    const quantite = Math.max(1, parseInt(item.quantite, 10) || 1);
    const montant = Number(prix.montant);
    const ligneTotal = Math.round(montant * quantite * 100) / 100;
    totalHt += ligneTotal;
    lignes.push({
      produit_id: prix.produit_id,
      prix_id: prix.prix_id,
      produit_nom: prix.nom,
      type_abonnement: prix.type_abonnement,
      prix_unitaire_ht: montant,
      quantite,
      prix_total_ht: ligneTotal,
    });
  }

  totalHt = Math.round(totalHt * 100) / 100;
  const totalTtc = Math.round(totalHt * (1 + TAUX_TVA / 100) * 100) / 100;

  // PaymentIntent Stripe (montant en centimes)
  const stripe = getStripe();
  const customerId = await assurerClientStripe(userId);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalTtc * 100),
    currency: 'eur',
    customer: customerId,
    payment_method_types: ['card'],
    metadata: { utilisateur_id: userId },
  });

  // Insertion transactionnelle de la commande + lignes
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const commandeRes = await client.query(
      `INSERT INTO Commandes
         (utilisateur_id, adresse_facturation_id, methode_paiement_id, adresse_snapshot,
          carte_derniers_chiffres, total_ht, taux_tva, total_ttc, statut, stripe_payment_intent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PAIEMENT_ATTENTE', $9)
       RETURNING id`,
      [
        userId,
        adresse_id,
        methode_paiement_id || null,
        JSON.stringify(adresse),
        carteDerniers,
        totalHt,
        TAUX_TVA,
        totalTtc,
        paymentIntent.id,
      ]
    );
    const commandeId = commandeRes.rows[0].id;

    for (const ligne of lignes) {
      await client.query(
        `INSERT INTO Commandes_Lignes
           (commande_id, produit_id, prix_id, produit_nom, type_abonnement,
            prix_unitaire_ht, quantite, prix_total_ht)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          commandeId,
          ligne.produit_id,
          ligne.prix_id,
          ligne.produit_nom,
          ligne.type_abonnement,
          ligne.prix_unitaire_ht,
          ligne.quantite,
          ligne.prix_total_ht,
        ]
      );
    }

    // Rattache l'id de commande au PaymentIntent (utile au webhook)
    await stripe.paymentIntents.update(paymentIntent.id, { metadata: { commande_id: commandeId, utilisateur_id: userId } });

    await client.query('COMMIT');
    return { commande_id: commandeId, client_secret: paymentIntent.client_secret };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Charge les lignes d'une commande. */
async function chargerLignes(commandeId) {
  const res = await db.query('SELECT * FROM Commandes_Lignes WHERE commande_id = $1', [commandeId]);
  return res.rows;
}

/** Historique des commandes de l'utilisateur (récentes d'abord), avec lignes. */
async function listerCommandes(userId) {
  const res = await db.query('SELECT * FROM Commandes WHERE utilisateur_id = $1 ORDER BY cree_le DESC', [userId]);
  const commandes = res.rows;
  for (const commande of commandes) {
    commande.lignes = await chargerLignes(commande.id);
  }
  return commandes;
}

/** Détail d'une commande (vérifie l'appartenance à l'utilisateur). */
async function getCommande(userId, commandeId) {
  const res = await db.query('SELECT * FROM Commandes WHERE id = $1 AND utilisateur_id = $2', [commandeId, userId]);
  const commande = res.rows[0];
  if (!commande) throw httpError(404, 'Commande introuvable');
  commande.lignes = await chargerLignes(commandeId);
  return commande;
}

module.exports = { creerCommande, listerCommandes, getCommande, TAUX_TVA };
