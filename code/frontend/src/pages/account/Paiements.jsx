import { useEffect, useState } from 'react';
import { api, MOCK } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import AjoutCarte from '../../components/ui/AjoutCarte';

/**
 * Méthodes de paiement : liste des cartes (4 derniers chiffres, expiration),
 * ajout via Stripe (CardElement), suppression et choix de la carte par défaut.
 */
export default function Paiements() {
  const [cartes, setCartes] = useState(null);
  const [erreur, setErreur] = useState('');
  const [ajout, setAjout] = useState(false);

  /** Recharge la liste des cartes. */
  function recharger() {
    api.paiements().then(setCartes).catch(() => setErreur('Impossible de charger vos cartes.'));
  }

  useEffect(recharger, []);

  /** Supprime une carte après confirmation. */
  async function supprimer(id) {
    if (!window.confirm('Supprimer cette carte ?')) return;
    await api.supprimerPaiement(id);
    recharger();
  }

  /** Définit la carte par défaut. */
  async function definirDefaut(id) {
    await api.paiementDefaut(id);
    recharger();
  }

  /** Ajoute une carte fictive en mode démo (pas de Stripe). */
  async function ajouterDemo() {
    await api.ajouterPaiement('pm_demo');
    recharger();
  }

  if (!cartes) return <Spinner />;

  return (
    <div className="carte-bloc">
      <h2>Mes méthodes de paiement</h2>
      {erreur && <p className="message-erreur">{erreur}</p>}

      {cartes.length === 0 && <p style={{ color: 'var(--gris)' }}>Aucune carte enregistrée.</p>}

      {cartes.map((carte) => (
        <div key={carte.id} className="liste-element">
          <div>
            💳 <strong>•••• •••• •••• {carte.derniers_quatre_chiffres}</strong>{' '}
            {carte.est_defaut && <span className="badge badge-rose">Par défaut</span>}
            <br />
            <span style={{ fontSize: '0.92rem', color: 'var(--gris)' }}>
              {carte.nom_sur_carte} — expire {String(carte.mois_expiration).padStart(2, '0')}/{carte.annee_expiration}
            </span>
          </div>
          <div className="liste-element-actions">
            {!carte.est_defaut && (
              <Button petit variante="contour" onClick={() => definirDefaut(carte.id)}>Par défaut</Button>
            )}
            <Button petit variante="danger" onClick={() => supprimer(carte.id)}>Supprimer</Button>
          </div>
        </div>
      ))}

      <Button petit variante="rose" style={{ marginTop: 14 }} onClick={MOCK ? ajouterDemo : () => setAjout(true)}>
        + Ajouter une carte
      </Button>

      <p className="message-info" style={{ marginTop: 14 }}>
        L’ajout d’une carte se fait via le formulaire sécurisé Stripe : vos données bancaires
        ne transitent jamais par les serveurs CYNA.
      </p>

      {/* Modale d'ajout de carte (mode API réelle) */}
      {ajout && !MOCK && (
        <Modal titre="Ajouter une carte" onClose={() => setAjout(false)}>
          <AjoutCarte
            onAjoute={() => { setAjout(false); recharger(); }}
            onAnnuler={() => setAjout(false)}
          />
        </Modal>
      )}
    </div>
  );
}
