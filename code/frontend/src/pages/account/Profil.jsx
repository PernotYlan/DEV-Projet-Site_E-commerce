import { useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

/**
 * Page profil : modification des informations personnelles,
 * changement d'email (avec mot de passe) et changement de mot de passe.
 */
export default function Profil() {
  const { user, rafraichirUser } = useAuth();

  const [infos, setInfos] = useState({ prenom: user.prenom, nom: user.nom, telephone: user.telephone || '' });
  const [messageInfos, setMessageInfos] = useState(null);

  const [email, setEmail] = useState({ nouvel_email: '', mot_de_passe: '' });
  const [messageEmail, setMessageEmail] = useState(null);

  const [mdp, setMdp] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const [messageMdp, setMessageMdp] = useState(null);

  /** Enregistre prénom / nom / téléphone. */
  async function enregistrerInfos(e) {
    e.preventDefault();
    try {
      const maj = await api.updateMe(infos);
      rafraichirUser(maj);
      setMessageInfos({ type: 'succes', texte: 'Profil mis à jour.' });
    } catch (err) {
      setMessageInfos({ type: 'erreur', texte: err.response?.data?.error || 'Erreur lors de la mise à jour.' });
    }
  }

  /** Demande le changement d'adresse email. */
  async function changerEmail(e) {
    e.preventDefault();
    try {
      const { message } = await api.changerEmail(email.nouvel_email, email.mot_de_passe);
      setMessageEmail({ type: 'succes', texte: message });
      setEmail({ nouvel_email: '', mot_de_passe: '' });
    } catch (err) {
      setMessageEmail({ type: 'erreur', texte: err.response?.data?.error || 'Erreur lors de la demande.' });
    }
  }

  /** Change le mot de passe (ancien requis). */
  async function changerMotDePasse(e) {
    e.preventDefault();
    if (mdp.nouveau !== mdp.confirmation) {
      setMessageMdp({ type: 'erreur', texte: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    try {
      await api.changerMotDePasse(mdp.actuel, mdp.nouveau);
      setMessageMdp({ type: 'succes', texte: 'Mot de passe modifié.' });
      setMdp({ actuel: '', nouveau: '', confirmation: '' });
    } catch (err) {
      setMessageMdp({ type: 'erreur', texte: err.response?.data?.error || 'Erreur lors du changement.' });
    }
  }

  /** Affiche un message de formulaire. */
  const Message = ({ message }) =>
    message ? <p className={message.type === 'succes' ? 'message-succes' : 'message-erreur'}>{message.texte}</p> : null;

  return (
    <>
      <div className="carte-bloc">
        <h2>Informations personnelles</h2>
        <Message message={messageInfos} />
        <form onSubmit={enregistrerInfos}>
          <div className="groupe-2">
            <Input label="Prénom" required value={infos.prenom}
              onChange={(e) => setInfos({ ...infos, prenom: e.target.value })} />
            <Input label="Nom" required value={infos.nom}
              onChange={(e) => setInfos({ ...infos, nom: e.target.value })} />
          </div>
          <Input label="Téléphone" value={infos.telephone}
            onChange={(e) => setInfos({ ...infos, telephone: e.target.value })} />
          <Button type="submit" petit>Enregistrer</Button>
        </form>
      </div>

      <div className="carte-bloc">
        <h2>Changer l’email</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--gris)', marginBottom: 12 }}>
          Adresse actuelle : <strong>{user.email}</strong>. Un lien de confirmation sera envoyé à la nouvelle adresse.
        </p>
        <Message message={messageEmail} />
        <form onSubmit={changerEmail}>
          <Input label="Nouvel email" type="email" required value={email.nouvel_email}
            onChange={(e) => setEmail({ ...email, nouvel_email: e.target.value })} />
          <Input label="Mot de passe (confirmation)" type="password" required value={email.mot_de_passe}
            onChange={(e) => setEmail({ ...email, mot_de_passe: e.target.value })} autoComplete="current-password" />
          <Button type="submit" petit>Demander le changement</Button>
        </form>
      </div>

      <div className="carte-bloc">
        <h2>Changer le mot de passe</h2>
        <Message message={messageMdp} />
        <form onSubmit={changerMotDePasse}>
          <Input label="Mot de passe actuel" type="password" required value={mdp.actuel}
            onChange={(e) => setMdp({ ...mdp, actuel: e.target.value })} autoComplete="current-password" />
          <div className="groupe-2">
            <Input label="Nouveau mot de passe" type="password" required value={mdp.nouveau}
              onChange={(e) => setMdp({ ...mdp, nouveau: e.target.value })} autoComplete="new-password" />
            <Input label="Confirmation" type="password" required value={mdp.confirmation}
              onChange={(e) => setMdp({ ...mdp, confirmation: e.target.value })} autoComplete="new-password" />
          </div>
          <Button type="submit" petit>Changer le mot de passe</Button>
        </form>
      </div>
    </>
  );
}
