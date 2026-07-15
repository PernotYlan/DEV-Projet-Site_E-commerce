import { useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { api } from '../../api';
import Button from './Button';

/** Style du CardElement Stripe aligné sur la charte. */
const STYLE_CARTE = {
  hidePostalCode: true,
  style: {
    base: { fontSize: '16px', color: '#1a2226', fontFamily: 'Roboto, sans-serif', '::placeholder': { color: '#6b7a82' } },
    invalid: { color: '#c62828' },
  },
};

/**
 * Formulaire d'ajout de carte via Stripe Elements : tokenise la carte côté
 * client puis l'enregistre via l'API (le backend la rattache au client Stripe).
 * À utiliser uniquement dans un contexte <Elements> (mode API réelle).
 * @param {{onAjoute: Function, onAnnuler?: Function}} props
 */
export default function AjoutCarte({ onAjoute, onAnnuler }) {
  const stripe = useStripe();
  const elements = useElements();
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  /** Crée le PaymentMethod Stripe puis l'enregistre côté serveur. */
  async function soumettre(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setEnCours(true);
    setErreur('');

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });
    if (error) {
      setErreur(error.message);
      setEnCours(false);
      return;
    }

    try {
      const carte = await api.ajouterPaiement(paymentMethod.id);
      onAjoute(carte);
    } catch (err) {
      setErreur(err.response?.data?.error || 'Erreur lors de l’enregistrement de la carte.');
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre}>
      <div className="champ">
        <label>Carte bancaire</label>
        <div style={{ padding: '12px 14px', border: '1.5px solid var(--gris-clair)', borderRadius: '10px', background: '#fff' }}>
          <CardElement options={STYLE_CARTE} />
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--gris)', marginTop: 6 }}>
          Test : 4242 4242 4242 4242 — date future — CVC quelconque.
        </p>
      </div>
      {erreur && <p className="message-erreur">{erreur}</p>}
      <div className="modal-actions">
        {onAnnuler && (
          <Button type="button" variante="contour" onClick={onAnnuler}>Annuler</Button>
        )}
        <Button type="submit" variante="rose" disabled={!stripe || enCours}>
          {enCours ? 'Enregistrement…' : 'Enregistrer la carte'}
        </Button>
      </div>
    </form>
  );
}
