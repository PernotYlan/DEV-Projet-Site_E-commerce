import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/** Page de connexion : email + mot de passe, puis code 2FA par email pour les comptes admin. */
export default function Login() {
  const { login, verifier2FA } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [etape, setEtape] = useState('mdp'); // 'mdp' | 'code'
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [seSouvenir, setSeSouvenir] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState('');
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  /** Étape 1 : email + mot de passe. Bascule vers la saisie du code pour un compte admin. */
  async function soumettreMdp(e) {
    e.preventDefault();
    setErreur('');
    setEnCours(true);
    try {
      const resultat = await login(email, motDePasse, seSouvenir);
      if (resultat.requiert2FA) {
        setPreAuthToken(resultat.preAuthToken);
        setEtape('code');
        setEnCours(false);
      } else {
        navigate(params.get('redirect') || '/');
      }
    } catch (err) {
      setErreur(err.response?.data?.error || 'Email ou mot de passe incorrect');
      setEnCours(false);
    }
  }

  /** Étape 2 (admin uniquement) : code à 6 chiffres reçu par email. */
  async function soumettreCode(e) {
    e.preventDefault();
    setErreur('');
    setEnCours(true);
    try {
      await verifier2FA(preAuthToken, code);
      navigate(params.get('redirect') || '/admin');
    } catch (err) {
      setErreur(err.response?.data?.error || 'Code invalide ou expiré');
      setEnCours(false);
    }
  }

  if (etape === 'code') {
    return (
      <div className="conteneur">
        <div className="carte-auth">
          <h1>Vérification en 2 étapes</h1>
          <p style={{ color: 'var(--gris)', marginBottom: 16 }}>
            Un code à 6 chiffres vient d'être envoyé à <strong>{email}</strong>. Il est valable 10 minutes.
          </p>
          {erreur && <p className="message-erreur">{erreur}</p>}
          <form onSubmit={soumettreCode}>
            <Input
              label="Code de vérification"
              type="text"
              name="code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              style={{ letterSpacing: 6, fontSize: '1.3rem', textAlign: 'center' }}
            />
            <Button type="submit" variante="rose" bloc disabled={enCours || code.length !== 6}>
              {enCours ? 'Vérification…' : 'Valider'}
            </Button>
          </form>
          <p className="lien-bas">
            <button type="button" className="lien-bouton" onClick={() => { setEtape('mdp'); setCode(''); setErreur(''); }}>
              ← Revenir à la connexion
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="conteneur">
      <div className="carte-auth">
        <h1>Connexion</h1>
        {erreur && <p className="message-erreur">{erreur}</p>}
        <form onSubmit={soumettreMdp}>
          <Input label="Email" type="email" name="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Input label="Mot de passe" type="password" name="mot_de_passe" required value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)} autoComplete="current-password" />
          <div className="champ" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 0 }}>
              <input type="checkbox" checked={seSouvenir} onChange={(e) => setSeSouvenir(e.target.checked)} />
              Se souvenir de moi
            </label>
            <Link to="/forgot-password" style={{ fontSize: '0.9rem' }}>Mot de passe oublié ?</Link>
          </div>
          <Button type="submit" variante="rose" bloc disabled={enCours}>
            {enCours ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
        <p className="lien-bas">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
