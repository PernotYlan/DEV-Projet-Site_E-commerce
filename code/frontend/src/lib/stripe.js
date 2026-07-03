import { loadStripe } from '@stripe/stripe-js';
import { MOCK } from '../api';

/**
 * Promesse Stripe.js initialisée avec la clé publique.
 * Vaut null en mode démo (VITE_MOCK=1) ou si aucune clé n'est fournie :
 * dans ce cas, aucune fonctionnalité Stripe n'est chargée.
 */
const cle = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
export const stripePromise = !MOCK && cle && cle.startsWith('pk_') ? loadStripe(cle) : null;
