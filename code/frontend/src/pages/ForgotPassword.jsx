import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/** Page "mot de passe oublié" : envoie le lien de réinitialisation. */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [enCours, setEnCours] = useState(false);

  /** Soumet la demande (la réponse est toujours positive : anti-énumération). */
  async function soumettre(e) {
    e.preventDefault();
    setEnCours(true);
    try {
      await api.forgotPassword(email);
    } finally {
      setEnvoye(true);
    }
  }

  return (
    <div className="conteneur">
      <div className="carte-auth">
        <h1>Mot de passe oublié</h1>
        {envoye ? (
          <p className="message-succes">
            Si cet email existe, vous recevrez un lien de réinitialisation valable 24 heures.
          </p>
        ) : (
          <form onSubmit={soumettre}>
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" variante="rose" bloc disabled={enCours}>
              {enCours ? 'Envoi…' : 'Envoyer le lien'}
            </Button>
          </form>
        )}
        <p className="lien-bas">
          <Link to="/login">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
