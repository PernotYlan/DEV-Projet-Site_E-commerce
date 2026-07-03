import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/** Critères de robustesse du mot de passe (affichés en temps réel). */
const CRITERES = [
  { cle: 'longueur', libelle: '8 caractères min.', test: (v) => v.length >= 8 },
  { cle: 'majuscule', libelle: 'une majuscule', test: (v) => /[A-Z]/.test(v) },
  { cle: 'minuscule', libelle: 'une minuscule', test: (v) => /[a-z]/.test(v) },
  { cle: 'chiffre', libelle: 'un chiffre', test: (v) => /\d/.test(v) },
  { cle: 'special', libelle: 'un caractère spécial', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

/** Page d'inscription avec indicateur de force du mot de passe. */
export default function Register() {
  const { register } = useAuth();
  const [formulaire, setFormulaire] = useState({ prenom: '', nom: '', email: '', mot_de_passe: '' });
  const [erreur, setErreur] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const criteresOk = CRITERES.map((c) => c.test(formulaire.mot_de_passe));
  const motDePasseValide = criteresOk.every(Boolean);

  /** Met à jour un champ du formulaire. */
  const champ = (cle) => (e) => setFormulaire({ ...formulaire, [cle]: e.target.value });

  /** Soumet l'inscription puis affiche l'écran "vérifiez vos emails". */
  async function soumettre(e) {
    e.preventDefault();
    if (!motDePasseValide) {
      setErreur('Le mot de passe ne respecte pas tous les critères.');
      return;
    }
    setErreur('');
    setEnCours(true);
    try {
      await register(formulaire);
      setEnvoye(true);
    } catch (err) {
      setErreur(err.response?.data?.error || 'Erreur lors de la création du compte.');
      setEnCours(false);
    }
  }

  if (envoye) {
    return (
      <div className="conteneur">
        <div className="carte-auth" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>📬</span>
          <h1>Vérifiez vos emails</h1>
          <p>
            Un lien de confirmation a été envoyé à <strong>{formulaire.email}</strong>.
            Cliquez dessus pour activer votre compte (valable 24 heures).
          </p>
          <p className="lien-bas">
            <Link to="/login">Retour à la connexion</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="conteneur">
      <div className="carte-auth">
        <h1>Créer un compte</h1>
        {erreur && <p className="message-erreur">{erreur}</p>}
        <form onSubmit={soumettre}>
          <div className="groupe-2">
            <Input label="Prénom" name="prenom" required value={formulaire.prenom} onChange={champ('prenom')} />
            <Input label="Nom" name="nom" required value={formulaire.nom} onChange={champ('nom')} />
          </div>
          <Input label="Email" type="email" name="email" required value={formulaire.email}
            onChange={champ('email')} autoComplete="email" />
          <div className="champ">
            <label htmlFor="mot_de_passe">Mot de passe</label>
            <input id="mot_de_passe" type="password" required value={formulaire.mot_de_passe}
              onChange={champ('mot_de_passe')} autoComplete="new-password" />
            {/* Indicateur de force */}
            <div className="force-mdp" aria-hidden="true">
              {CRITERES.map((c, i) => (
                <span key={c.cle} className={criteresOk[i] ? 'ok' : ''} />
              ))}
            </div>
            <p className="criteres-mdp">
              {CRITERES.map((c, i) => (
                <span key={c.cle} className={criteresOk[i] ? 'ok' : ''}>
                  {criteresOk[i] ? '✓' : '·'} {c.libelle}{i < CRITERES.length - 1 ? ' — ' : ''}
                </span>
              ))}
            </p>
          </div>
          <Button type="submit" variante="rose" bloc disabled={enCours}>
            {enCours ? 'Création…' : 'Créer mon compte'}
          </Button>
        </form>
        <p className="lien-bas">
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
