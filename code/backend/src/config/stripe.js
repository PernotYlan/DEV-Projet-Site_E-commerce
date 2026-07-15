const Stripe = require('stripe');
const env = require('./env');

/**
 * Client Stripe partagé. Initialisé uniquement si une clé secrète est fournie ;
 * sinon les fonctionnalités de paiement renverront une erreur explicite.
 */
const stripe = env.stripeSecretKey && env.stripeSecretKey.startsWith('sk_')
  ? new Stripe(env.stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    })
  : null;

/** Renvoie le client Stripe ou lève une erreur si non configuré. */
function getStripe() {
  if (!stripe) {
    const err = new Error('Stripe n’est pas configuré (STRIPE_SECRET_KEY manquante)');
    err.status = 500;
    throw err;
  }
  return stripe;
}

module.exports = { getStripe, stripeActif: Boolean(stripe) };
