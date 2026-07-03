import { useEffect, useState } from 'react';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';

const STATUTS = ['ACTIF', 'SUSPENDU', 'RESILIE', 'PAST_DUE'];
const BADGE = { ACTIF: 'badge-vert', SUSPENDU: 'badge-orange', PAST_DUE: 'badge-orange', RESILIE: 'badge-rouge' };

/** Gestion des abonnements : filtre statut, changement forcé de statut. */
export default function AdminAbonnements() {
  const [resultat, setResultat] = useState(null);
  const [filtres, setFiltres] = useState({ statut: '', page: 1 });
  const [erreur, setErreur] = useState('');

  const set = (cle, valeur) => setFiltres((f) => ({ ...f, [cle]: valeur, page: cle === 'page' ? valeur : 1 }));

  function recharger() {
    setResultat(null);
    api.admin.abonnements(filtres).then(setResultat).catch(() => setErreur('Erreur de chargement.'));
  }
  useEffect(recharger, [filtres]);

  /** Force le statut d'un abonnement. */
  async function changerStatut(id, statut) {
    await api.admin.changerStatutAbonnement(id, statut);
    recharger();
  }

  const pagination = resultat?.pagination;
  const nbPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;
  const dateFr = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

  return (
    <>
      <h1>Abonnements</h1>
      <div className="admin-barre">
        <select value={filtres.statut} onChange={(e) => set('statut', e.target.value)}>
          <option value="">Tous statuts</option>
          {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {erreur && <p className="message-erreur">{erreur}</p>}

      {!resultat ? <Spinner /> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Client</th><th>Produit</th><th>Type</th><th>Début</th><th>Fin</th><th>Statut</th></tr></thead>
              <tbody>
                {resultat.data.map((a) => (
                  <tr key={a.id}>
                    <td>{a.email}</td>
                    <td>{a.produit_nom}</td>
                    <td>{a.type_abonnement}</td>
                    <td>{dateFr(a.periode_debut)}</td>
                    <td>{dateFr(a.periode_fin)}</td>
                    <td>
                      <select value={a.statut} onChange={(e) => changerStatut(a.id, e.target.value)}
                        className={`badge ${BADGE[a.statut] || ''}`} style={{ border: 'none', padding: '4px 8px' }}>
                        {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {resultat.data.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--gris)' }}>Aucun abonnement.</td></tr>}
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
    </>
  );
}
