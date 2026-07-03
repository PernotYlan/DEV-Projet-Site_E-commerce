/**
 * Test de bout en bout du paiement (sans navigateur) :
 * login → adresse → commande (PaymentIntent) → confirmation carte test →
 * vérifie que le webhook a marqué la commande payée et créé l'abonnement.
 * Nécessite : backend lancé + `stripe listen` en cours.
 */
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const BASE = 'http://localhost:3000/api';

const json = (r) => r.json();

async function main() {
  // 1. Connexion admin
  let r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cyna-it.fr', mot_de_passe: 'AdminCyna2026!' }),
  });
  const token = (await json(r)).data.access_token;
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // 2. Adresse de facturation
  r = await fetch(`${BASE}/utilisateurs/me/adresses`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ prenom: 'Admin', nom: 'Cyna', adresse_ligne1: '10 rue de Penthievre', ville: 'Paris', code_postal: '75008', pays: 'France' }),
  });
  const adresse = (await json(r)).data;

  // 3. Récupère un prix (produit 4 = Cyna EDR Protect)
  r = await fetch(`${BASE}/produits/4`);
  const produit = (await json(r)).data;
  const prixId = produit.prix[0].id;

  // 4. Création de la commande (PaymentIntent)
  r = await fetch(`${BASE}/commandes`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ adresse_id: adresse.id, items: [{ produit_id: 4, prix_id: prixId, quantite: 1 }] }),
  });
  const cmd = (await json(r)).data;
  if (!cmd.commande_id) throw new Error('Commande non créée: ' + JSON.stringify(cmd));
  console.log('1. Commande créée :', cmd.commande_id);

  // 5. Confirmation du paiement avec une carte de test (côté serveur ici)
  const piId = cmd.client_secret.split('_secret_')[0];
  const confirmed = await stripe.paymentIntents.confirm(piId, { payment_method: 'pm_card_visa' });
  console.log('2. Paiement confirmé, statut PaymentIntent :', confirmed.status);

  // 6. Attente de la livraison du webhook
  console.log('3. Attente du webhook (8 s)...');
  await new Promise((res) => setTimeout(res, 8000));

  // 7. Vérifications
  r = await fetch(`${BASE}/commandes/${cmd.commande_id}`, { headers: H });
  const detail = (await json(r)).data;
  console.log('4. Statut commande après webhook :', detail.statut);

  r = await fetch(`${BASE}/abonnements`, { headers: H });
  const abos = (await json(r)).data;
  console.log('5. Abonnements :', abos.map((a) => `${a.produit_nom} [${a.statut}]`).join(', ') || 'aucun');

  console.log(detail.statut === 'PAIEMENT_ACCEPTE' ? '\n✅ FLUX COMPLET OK' : '\n⚠️ Webhook non appliqué (vérifier stripe listen)');
}

main().catch((e) => { console.error('ERREUR:', e.message); process.exit(1); });
