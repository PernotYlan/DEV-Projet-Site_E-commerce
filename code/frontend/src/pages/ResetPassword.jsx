import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/** Page de réinitialisation du mot de passe via le token reçu par email. */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  /** Vérifie la correspondance des deux champs puis soumet. */
  async function soumettre(e) {
    e.preventDefault();
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setErreur('');
    setEnCours(true);
    try {
      await api.resetPassword(token, motDePasse);
      navigate('/login');
    } catch (err) {
      setErreur(err.response?.data?.error || 'Lien invalide ou expiré.');
      setEnCours(false);
    }
  }

  if (!token) {
    return (
      <div className="conteneur">
        <div className="carte-auth">
          <p className="message-erreur">Lien invalide.</p>
          <p className="lien-bas"><Link to="/forgot-password">Demander un nouveau lien</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="conteneur">
      <div className="carte-auth">
        <h1>Nouveau mot de passe</h1>
        {erreur && <p className="message-erreur">{erreur}</p>}
        <form onSubmit={soumettre}>
          <Input label="Nouveau mot de passe" type="password" required value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)} autoComplete="new-password" />
          <Input label="Confirmer le mot de passe" type="password" required value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" />
          <Button type="submit" variante="rose" bloc disabled={enCours}>
            {enCours ? 'Enregistrement…' : 'Réinitialiser'}
          </Button>
        </form>
      </div>
    </div>
  );
}
