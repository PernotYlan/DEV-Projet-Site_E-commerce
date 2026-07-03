import { useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { api } from '../../api';
import Button from '../ui/Button';

const STYLE_CARTE = {
  style: {
    base: { fontSize: '16px', color: '#1a2226', fontFamily: 'Roboto, sans-serif', '::placeholder': { color: '#6b7a82' } },
    invalid: { color: '#c62828' },
  },
};

/**
 * Étape de paiement Stripe au checkout (mode API réelle uniquement) :
 * crée la commande (PaymentIntent) puis confirme le paiement avec la carte
 * saisie via stripe.confirmCardPayment.
 * @param {{construireCommande: Function, titulaire: string, onSucces: Function, onRetour: Function}} props
 */
export default function PaiementStripe({ construireCommande, titulaire, onSucces, onRetour }) {
  const stripe = useStripe();
  const elements = useElements();
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  /** Crée la commande puis confirme le paiement avec la carte. */
  async function payer() {
    if (!stripe || !elements) return;
    setEnCours(true);
    setErreur('');
    try {
      const { commande_id, client_secret } = await api.creerCommande(construireCommande());
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: titulaire },
        },
      });
      if (error) {
        setErreur(error.message);
        setEnCours(false);
        return;
      }
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSucces(commande_id);
      } else {
        setErreur('Le paiement n’a pas pu être confirmé.');
        setEnCours(false);
      }
    } catch (err) {
      setErreur(err.response?.data?.error || 'Le paiement a échoué. Veuillez réessayer.');
      setEnCours(false);
    }
  }

  return (
    <>
      <h3>Carte bancaire</h3>
      <div style={{ padding: '12px 14px', border: '1.5px solid var(--gris-clair)', borderRadius: '10px', background: '#fff' }}>
        <CardElement options={STYLE_CARTE} />
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--gris)', marginTop: 6 }}>
        Test : 4242 4242 4242 4242 — date future — CVC quelconque.
      </p>
      {erreur && <p className="message-erreur" style={{ marginTop: 12 }}>{erreur}</p>}
      <div className="modal-actions">
        <Button variante="contour" onClick={onRetour} disabled={enCours}>Retour</Button>
        <Button variante="rose" onClick={payer} disabled={!stripe || enCours}>
          {enCours ? 'Paiement en cours…' : 'Confirmer l’achat'}
        </Button>
      </div>
    </>
  );
}
