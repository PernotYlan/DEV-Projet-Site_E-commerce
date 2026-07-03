import { useEffect, useState } from 'react';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const ADRESSE_VIDE = {
  prenom: '', nom: '', adresse_ligne1: '', adresse_ligne2: '',
  ville: '', region: '', code_postal: '', pays: 'France',
};

/** Carnet d'adresses : liste, ajout/modification (modale), suppression, défaut. */
export default function Adresses() {
  const [adresses, setAdresses] = useState(null);
  const [enEdition, setEnEdition] = useState(null); // null | objet adresse (id absent = création)
  const [erreur, setErreur] = useState('');

  /** Recharge la liste depuis l'API. */
  function recharger() {
    api.adresses().then(setAdresses).catch(() => setErreur('Impossible de charger vos adresses.'));
  }

  useEffect(recharger, []);

  /** Crée ou modifie l'adresse en cours d'édition. */
  async function enregistrer(e) {
    e.preventDefault();
    try {
      if (enEdition.id) {
        await api.modifierAdresse(enEdition.id, enEdition);
      } else {
        await api.creerAdresse(enEdition);
      }
      setEnEdition(null);
      recharger();
    } catch (err) {
      setErreur(err.response?.data?.error || 'Erreur lors de l’enregistrement.');
    }
  }

  /** Supprime une adresse après confirmation. */
  async function supprimer(id) {
    if (!window.confirm('Supprimer cette adresse ?')) return;
    await api.supprimerAdresse(id);
    recharger();
  }

  /** Définit l'adresse par défaut. */
  async function definirDefaut(id) {
    await api.adresseDefaut(id);
    recharger();
  }

  if (!adresses) return <Spinner />;

  return (
    <div className="carte-bloc">
      <h2>Mes adresses</h2>
      {erreur && <p className="message-erreur">{erreur}</p>}

      {adresses.length === 0 && <p style={{ color: 'var(--gris)' }}>Aucune adresse enregistrée.</p>}

      {adresses.map((adresse) => (
        <div key={adresse.id} className="liste-element">
          <div>
            <strong>{adresse.prenom} {adresse.nom}</strong>{' '}
            {adresse.est_defaut && <span className="badge badge-rose">Par défaut</span>}
            <br />
            <span style={{ fontSize: '0.92rem', color: 'var(--gris)' }}>
              {adresse.adresse_ligne1}{adresse.adresse_ligne2 ? `, ${adresse.adresse_ligne2}` : ''} —{' '}
              {adresse.code_postal} {adresse.ville}, {adresse.pays}
            </span>
          </div>
          <div className="liste-element-actions">
            {!adresse.est_defaut && (
              <Button petit variante="contour" onClick={() => definirDefaut(adresse.id)}>Par défaut</Button>
            )}
            <Button petit variante="contour" onClick={() => setEnEdition(adresse)}>Modifier</Button>
            <Button petit variante="danger" onClick={() => supprimer(adresse.id)}>Supprimer</Button>
          </div>
        </div>
      ))}

      <Button petit variante="rose" style={{ marginTop: 14 }} onClick={() => setEnEdition(ADRESSE_VIDE)}>
        + Ajouter une adresse
      </Button>

      {enEdition && (
        <Modal titre={enEdition.id ? 'Modifier l’adresse' : 'Nouvelle adresse'} onClose={() => setEnEdition(null)}>
          <form onSubmit={enregistrer}>
            <div className="groupe-2">
              <Input label="Prénom" required value={enEdition.prenom}
                onChange={(e) => setEnEdition({ ...enEdition, prenom: e.target.value })} />
              <Input label="Nom" required value={enEdition.nom}
                onChange={(e) => setEnEdition({ ...enEdition, nom: e.target.value })} />
            </div>
            <Input label="Adresse" required value={enEdition.adresse_ligne1}
              onChange={(e) => setEnEdition({ ...enEdition, adresse_ligne1: e.target.value })} />
            <Input label="Complément (optionnel)" value={enEdition.adresse_ligne2 || ''}
              onChange={(e) => setEnEdition({ ...enEdition, adresse_ligne2: e.target.value })} />
            <div className="groupe-2">
              <Input label="Ville" required value={enEdition.ville}
                onChange={(e) => setEnEdition({ ...enEdition, ville: e.target.value })} />
              <Input label="Région (optionnel)" value={enEdition.region || ''}
                onChange={(e) => setEnEdition({ ...enEdition, region: e.target.value })} />
            </div>
            <div className="groupe-2">
              <Input label="Code postal" required value={enEdition.code_postal}
                onChange={(e) => setEnEdition({ ...enEdition, code_postal: e.target.value })} />
              <Input label="Pays" required value={enEdition.pays}
                onChange={(e) => setEnEdition({ ...enEdition, pays: e.target.value })} />
            </div>
            <div className="modal-actions">
              <Button type="button" variante="contour" onClick={() => setEnEdition(null)}>Annuler</Button>
              <Button type="submit" variante="rose">Enregistrer</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
