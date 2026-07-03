import { useEffect, useState } from 'react';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

/** Couleur de badge selon le statut d'abonnement. */
const BADGES = { ACTIF: 'badge-vert', SUSPENDU: 'badge-orange', PAST_DUE: 'badge-orange', RESILIE: 'badge-rouge' };

/** Formate une date ISO en français. */
function dateFr(iso) {
  return iso ? new Date(iso).toLocaleDateString('fr-FR') : '—';
}

/** Abonnements de l'utilisateur : liste + résiliation avec confirmation. */
export default function Abonnements() {
  const [abonnements, setAbonnements] = useState(null);
  const [aResilier, setAResilier] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.abonnements().then(setAbonnements).catch(() => setErreur('Impossible de charger vos abonnements.'));
  }, []);

  /** Confirme la résiliation (effective en fin de période). */
  async function resilier() {
    try {
      await api.resilierAbonnement(aResilier.id);
      setAbonnements(await api.abonnements());
      setAResilier(null);
    } catch (err) {
      setErreur(err.response?.data?.error || 'Erreur lors de la résiliation.');
      setAResilier(null);
    }
  }

  if (!abonnements) return <Spinner />;

  return (
    <div className="carte-bloc">
      <h2>Mes abonnements</h2>
      {erreur && <p className="message-erreur">{erreur}</p>}

      {abonnements.length === 0 && <p style={{ color: 'var(--gris)' }}>Aucun abonnement.</p>}

      {abonnements.map((abonnement) => (
        <div key={abonnement.id} className="liste-element">
          <div>
            <strong>{abonnement.produit_nom}</strong>{' '}
            <span className={`badge ${BADGES[abonnement.statut] || 'badge-ardoise'}`}>{abonnement.statut}</span>{' '}
            <span className="badge badge-ardoise">{abonnement.type_abonnement}</span>
            <br />
            <span style={{ fontSize: '0.92rem', color: 'var(--gris)' }}>
              Début : {dateFr(abonnement.periode_debut)} —{' '}
              {abonnement.resiliation_demandee_le
                ? `prend fin le ${dateFr(abonnement.periode_fin)}`
                : abonnement.periode_fin
                  ? `renouvellement le ${dateFr(abonnement.periode_fin)}`
                  : 'sans échéance'}
            </span>
          </div>
          <div className="liste-element-actions">
            {abonnement.statut === 'ACTIF' && !abonnement.resiliation_demandee_le && (
              <Button petit variante="danger" onClick={() => setAResilier(abonnement)}>Résilier</Button>
            )}
            {abonnement.resiliation_demandee_le && <span className="badge badge-orange">Résiliation demandée</span>}
          </div>
        </div>
      ))}

      {aResilier && (
        <Modal titre="Résilier l’abonnement ?" onClose={() => setAResilier(null)}>
          <p>
            Votre abonnement <strong>{aResilier.produit_nom}</strong> restera actif jusqu’au{' '}
            <strong>{dateFr(aResilier.periode_fin) === '—' ? 'terme de la période en cours' : dateFr(aResilier.periode_fin)}</strong>,
            puis ne sera pas renouvelé.
          </p>
          <div className="modal-actions">
            <Button variante="contour" onClick={() => setAResilier(null)}>Annuler</Button>
            <Button variante="danger" onClick={resilier}>Confirmer la résiliation</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
