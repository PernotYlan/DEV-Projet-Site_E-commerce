import { useEffect, useState } from 'react';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { euros } from '../../components/ui/ProductCard';

const STATUTS = {
  PAIEMENT_ACCEPTE: ['badge-vert', 'Payée'],
  PAIEMENT_ATTENTE: ['badge-orange', 'En attente'],
  PAIEMENT_REFUSE: ['badge-rouge', 'Refusée'],
};

/** Gestion des commandes : filtres statut/date, détail. */
export default function AdminCommandes() {
  const [resultat, setResultat] = useState(null);
  const [filtres, setFiltres] = useState({ statut: '', date_min: '', date_max: '', page: 1 });
  const [detail, setDetail] = useState(null);
  const [erreur, setErreur] = useState('');

  const set = (cle, valeur) => setFiltres((f) => ({ ...f, [cle]: valeur, page: cle === 'page' ? valeur : 1 }));

  useEffect(() => {
    setResultat(null);
    api.admin.commandes(filtres).then(setResultat).catch(() => setErreur('Erreur de chargement.'));
  }, [filtres]);

  const pagination = resultat?.pagination;
  const nbPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  return (
    <>
      <h1>Commandes</h1>
      <div className="admin-barre">
        <select value={filtres.statut} onChange={(e) => set('statut', e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="PAIEMENT_ACCEPTE">Payées</option>
          <option value="PAIEMENT_ATTENTE">En attente</option>
          <option value="PAIEMENT_REFUSE">Refusées</option>
        </select>
        <input type="date" value={filtres.date_min} onChange={(e) => set('date_min', e.target.value)} aria-label="Date min" />
        <input type="date" value={filtres.date_max} onChange={(e) => set('date_max', e.target.value)} aria-label="Date max" />
      </div>
      {erreur && <p className="message-erreur">{erreur}</p>}

      {!resultat ? <Spinner /> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Date</th><th>Client</th><th>Total TTC</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {resultat.data.map((c) => {
                  const [classe, libelle] = STATUTS[c.statut] || ['badge-ardoise', c.statut];
                  return (
                    <tr key={c.id}>
                      <td>{new Date(c.cree_le).toLocaleDateString('fr-FR')}</td>
                      <td>{c.prenom} {c.nom}<br /><span style={{ color: 'var(--gris)', fontSize: '0.85rem' }}>{c.email}</span></td>
                      <td>{euros(c.total_ttc)}</td>
                      <td><span className={`badge ${classe}`}>{libelle}</span></td>
                      <td><Button petit variante="contour" onClick={() => api.admin.commande(c.id).then(setDetail)}>Détail</Button></td>
                    </tr>
                  );
                })}
                {resultat.data.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--gris)' }}>Aucune commande.</td></tr>}
              </tbody>
            </table>
          </div>

          {nbPages > 1 && (
            <nav className="pagination">
              <button disabled={filtres.page <= 1} onClick={() => set('page', filtres.page - 1)}>‹</button>
              {Array.from({ length: nbPages }, (_, i) => i + 1).map((n) => (
                <button key={n} className={n === filtres.page ? 'actif' : ''} onClick={() => set('page', n)}>{n}</button>
              ))}
              <button disabled={filtres.page >= nbPages} onClick={() => set('page', filtres.page + 1)}>›</button>
            </nav>
          )}
        </>
      )}

      {detail && (
        <Modal titre={`Commande du ${new Date(detail.cree_le).toLocaleDateString('fr-FR')}`} onClose={() => setDetail(null)}>
          <p style={{ fontSize: '0.92rem' }}>{detail.prenom} {detail.nom} — {detail.email}</p>
          {(detail.lignes || []).map((l) => (
            <div key={l.id} className="recap-ligne"><span>{l.produit_nom} × {l.quantite}</span><span>{euros(l.prix_total_ht)}</span></div>
          ))}
          <div className="recap-ligne recap-total"><span>Total TTC</span><span>{euros(detail.total_ttc)}</span></div>
          {detail.facture && <p style={{ marginTop: 10, fontSize: '0.9rem' }}>📄 Facture : <strong>{detail.facture.numero_facture}</strong></p>}
          {detail.adresse_snapshot && (
            <p style={{ fontSize: '0.9rem', marginTop: 8 }}>
              {detail.adresse_snapshot.adresse_ligne1}, {detail.adresse_snapshot.code_postal} {detail.adresse_snapshot.ville}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
