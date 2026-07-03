import { useEffect, useState } from 'react';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const STATUTS = ['NOUVEAU', 'EN_COURS', 'TRAITE', 'FERME'];
const BADGE = { NOUVEAU: 'badge-rose', EN_COURS: 'badge-orange', TRAITE: 'badge-vert', FERME: 'badge-ardoise' };

/** Gestion des messages de contact : filtres statut/source, détail, changement de statut. */
export default function AdminMessages() {
  const [resultat, setResultat] = useState(null);
  const [filtres, setFiltres] = useState({ statut: '', source: '', page: 1 });
  const [detail, setDetail] = useState(null);
  const [erreur, setErreur] = useState('');

  const set = (cle, valeur) => setFiltres((f) => ({ ...f, [cle]: valeur, page: cle === 'page' ? valeur : 1 }));

  function recharger() {
    setResultat(null);
    api.admin.messages(filtres).then(setResultat).catch(() => setErreur('Erreur de chargement.'));
  }
  useEffect(recharger, [filtres]);

  /** Change le statut d'un message. */
  async function changerStatut(id, statut) {
    await api.admin.changerStatutMessage(id, statut);
    if (detail) setDetail({ ...detail, statut });
    recharger();
  }

  const pagination = resultat?.pagination;
  const nbPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  return (
    <>
      <h1>Messages</h1>
      <div className="admin-barre">
        <select value={filtres.statut} onChange={(e) => set('statut', e.target.value)}>
          <option value="">Tous statuts</option>
          {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtres.source} onChange={(e) => set('source', e.target.value)}>
          <option value="">Toutes sources</option>
          <option value="FORMULAIRE">Formulaire</option>
          <option value="CHATBOT">Chatbot</option>
        </select>
      </div>
      {erreur && <p className="message-erreur">{erreur}</p>}

      {!resultat ? <Spinner /> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Date</th><th>Email</th><th>Sujet</th><th>Source</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {resultat.data.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.cree_le).toLocaleDateString('fr-FR')}</td>
                    <td>{m.email}</td>
                    <td>{m.sujet || <em style={{ color: 'var(--gris)' }}>—</em>}</td>
                    <td><span className="badge badge-ardoise">{m.source}</span></td>
                    <td><span className={`badge ${BADGE[m.statut]}`}>{m.statut}</span></td>
                    <td><Button petit variante="contour" onClick={() => api.admin.message(m.id).then(setDetail)}>Voir</Button></td>
                  </tr>
                ))}
                {resultat.data.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--gris)' }}>Aucun message.</td></tr>}
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
        <Modal titre={detail.sujet || 'Message'} onClose={() => setDetail(null)}>
          <p style={{ fontSize: '0.9rem', color: 'var(--gris)' }}>
            De : {detail.email} — {detail.source} — {new Date(detail.cree_le).toLocaleDateString('fr-FR')}
          </p>
          <p style={{ margin: '14px 0', whiteSpace: 'pre-wrap' }}>{detail.message}</p>
          <div className="champ">
            <label>Statut</label>
            <select value={detail.statut} onChange={(e) => changerStatut(detail.id, e.target.value)}>
              {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <Button variante="contour" onClick={() => setDetail(null)}>Fermer</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
