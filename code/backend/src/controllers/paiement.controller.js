const { getStripe } = require('../config/stripe');
const env = require('../config/env');
const webhookService = require('../services/webhook.service');

/**
 * POST /api/paiement/webhook — reçoit les événements Stripe.
 * Le corps est brut (express.raw) pour permettre la vérification de signature.
 */
async function webhook(req, res) {
  let event;
  try {
    const signature = req.headers['stripe-signature'];
    event = getStripe().webhooks.constructEvent(req.body, signature, env.stripeWebhookSecret);
  } catch (err) {
    console.error('Signature webhook invalide :', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await webhookService.paiementReussi(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await webhookService.paiementEchoue(event.data.object);
        break;
      case 'customer.subscription.updated':
        await webhookService.abonnementMisAJour(event.data.object, 'ACTIF');
        break;
      case 'customer.subscription.deleted':
        await webhookService.abonnementMisAJour(event.data.object, 'RESILIE');
        break;
      default:
        break; // événements non gérés ignorés
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Erreur de traitement du webhook :', err);
    res.status(500).json({ error: 'Erreur de traitement' });
  }
}

module.exports = { webhook };
