import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/** Page de connexion : email + mot de passe + "se souvenir de moi". */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [seSouvenir, setSeSouvenir] = useState(false);
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  /** Soumet le formulaire puis redirige (?redirect= ou accueil). */
  async function soumettre(e) {
    e.preventDefault();
    setErreur('');
    setEnCours(true);
    try {
      await login(email, motDePasse, seSouvenir);
      navigate(params.get('redirect') || '/');
    } catch (err) {
      setErreur(err.response?.data?.error || 'Email ou mot de passe incorrect');
      setEnCours(false);
    }
  }

  return (
    <div className="conteneur">
      <div className="carte-auth">
        <h1>Connexion</h1>
        {erreur && <p className="message-erreur">{erreur}</p>}
        <form onSubmit={soumettre}>
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
