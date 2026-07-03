import { useEffect, useState } from 'react';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { euros } from '../../components/ui/ProductCard';

/** Badge selon le statut de commande. */
const BADGES = {
  PAIEMENT_ACCEPTE: ['badge-vert', 'Payée'],
  PAIEMENT_ATTENTE: ['badge-orange', 'En attente'],
  PAIEMENT_REFUSE: ['badge-rouge', 'Refusée'],
};

/** Historique des commandes groupées par année + détail en modale. */
export default function Commandes() {
  const [commandes, setCommandes] = useState(null);
  const [detail, setDetail] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.commandes().then(setCommandes).catch(() => setErreur('Impossible de charger vos commandes.'));
  }, []);

  if (!commandes) return <Spinner />;

  // Groupement par année (ordre décroissant)
  const parAnnee = commandes.reduce((groupes, commande) => {
    const annee = new Date(commande.cree_le).getFullYear();
    (groupes[annee] = groupes[annee] || []).push(commande);
    return groupes;
  }, {});
  const annees = Object.keys(parAnnee).sort((a, b) => b - a);

  return (
    <div className="carte-bloc">
      <h2>Mes commandes</h2>
      {erreur && <p className="message-erreur">{erreur}</p>}
      {commandes.length === 0 && <p style={{ color: 'var(--gris)' }}>Aucune commande.</p>}

      {annees.map((annee) => (
        <div key={annee}>
          <h3>{annee}</h3>
          {parAnnee[annee].map((commande) => {
            const [classe, libelle] = BADGES[commande.statut] || ['badge-ardoise', commande.statut];
            return (
              <div key={commande.id} className="liste-element">
                <div>
                  <strong>{new Date(commande.cree_le).toLocaleDateString('fr-FR')}</strong>{' '}
                  <span className={`badge ${classe}`}>{libelle}</span>
                  <br />
                  <span style={{ fontSize: '0.92rem', color: 'var(--gris)' }}>
                    {commande.lignes.map((l) => l.produit_nom).join(', ')} — {euros(commande.total_ttc)} TTC
                  </span>
                </div>
                <Button petit variante="contour" onClick={() => setDetail(commande)}>Détail</Button>
              </div>
            );
          })}
        </div>
      ))}

      {detail && (
        <Modal titre={`Commande du ${new Date(detail.cree_le).toLocaleDateString('fr-FR')}`} onClose={() => setDetail(null)}>
          {detail.lignes.map((ligne) => (
            <div key={ligne.id} className="recap-ligne">
              <span>
                {ligne.produit_nom} × {ligne.quantite}{' '}
                <em style={{ color: 'var(--gris)' }}>({ligne.type_abonnement.toLowerCase()})</em>
              </span>
              <span>{euros(ligne.prix_total_ht)}</span>
            </div>
          ))}
          <div className="recap-ligne"><span>Total HT</span><span>{euros(detail.total_ht)}</span></div>
          <div className="recap-ligne recap-total"><span>Total TTC</span><span>{euros(detail.total_ttc)}</span></div>

          {detail.adresse_snapshot && (
            <>
              <h3 style={{ marginTop: 16 }}>Adresse de facturation</h3>
              <p style={{ fontSize: '0.92rem' }}>
                {detail.adresse_snapshot.prenom} {detail.adresse_snapshot.nom}<br />
                {detail.adresse_snapshot.adresse_ligne1}, {detail.adresse_snapshot.code_postal}{' '}
                {detail.adresse_snapshot.ville}, {detail.adresse_snapshot.pays}
              </p>
            </>
          )}
          {detail.carte_derniers_chiffres && (
            <p style={{ fontSize: '0.92rem', marginTop: 8 }}>
              💳 Carte se terminant par {detail.carte_derniers_chiffres}
            </p>
          )}
          <p className="message-info" style={{ marginTop: 14 }}>
            📄 La facture PDF sera téléchargeable ici une fois la génération branchée au backend.
          </p>
        </Modal>
      )}
    </div>
  );
}
