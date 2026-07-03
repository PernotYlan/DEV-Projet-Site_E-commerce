import { useEffect, useState } from 'react';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

/** Gestion des utilisateurs : recherche, détail, changement de rôle, anonymisation. */
export default function AdminUtilisateurs() {
  const [resultat, setResultat] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [erreur, setErreur] = useState('');

  function recharger() {
    setResultat(null);
    api.admin.utilisateurs({ search, page }).then(setResultat).catch(() => setErreur('Erreur de chargement.'));
  }
  useEffect(recharger, [search, page]);

  /** Change le rôle d'un utilisateur. */
  async function changerRole(id, role) {
    await api.admin.modifierUtilisateur(id, { role });
    recharger();
  }

  /** Anonymise un compte (RGPD). */
  async function anonymiser(id) {
    if (!window.confirm('Anonymiser cet utilisateur ? (action RGPD irréversible)')) return;
    await api.admin.anonymiserUtilisateur(id);
    setDetail(null);
    recharger();
  }

  const pagination = resultat?.pagination;
  const nbPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  return (
    <>
      <h1>Utilisateurs</h1>
      <div className="admin-barre">
        <input type="search" placeholder="Rechercher par nom ou email…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      {erreur && <p className="message-erreur">{erreur}</p>}

      {!resultat ? <Spinner /> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Inscrit le</th><th>Email vérifié</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {resultat.data.map((u) => (
                  <tr key={u.id}>
                    <td>{u.prenom} {u.nom}</td>
                    <td>{u.email}</td>
                    <td>
                      <select value={u.role} onChange={(e) => changerRole(u.id, e.target.value)}>
                        <option value="CLIENT">CLIENT</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>{new Date(u.cree_le).toLocaleDateString('fr-FR')}</td>
                    <td>{u.email_verifie ? '✅' : '—'}</td>
                    <td><Button petit variante="contour" onClick={() => api.admin.utilisateur(u.id).then(setDetail)}>Détail</Button></td>
                  </tr>
                ))}
                {resultat.data.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--gris)' }}>Aucun utilisateur.</td></tr>}
              </tbody>
            </table>
          </div>

          {nbPages > 1 && (
            <nav className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
              {Array.from({ length: nbPages }, (_, i) => i + 1).map((n) => (
                <button key={n} className={n === page ? 'actif' : ''} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button disabled={page >= nbPages} onClick={() => setPage(page + 1)}>›</button>
            </nav>
          )}
        </>
      )}

      {detail && (
        <Modal titre={`${detail.prenom} ${detail.nom}`} onClose={() => setDetail(null)}>
          <p style={{ fontSize: '0.92rem' }}>{detail.email} — {detail.telephone || 'pas de téléphone'}<br />Rôle : {detail.role}</p>
          <h3>Commandes ({detail.commandes?.length || 0})</h3>
          {(detail.commandes || []).map((c) => (
            <div key={c.id} className="recap-ligne"><span>{new Date(c.cree_le).toLocaleDateString('fr-FR')}</span><span>{c.statut}</span></div>
          ))}
          <h3>Abonnements ({detail.abonnements?.length || 0})</h3>
          {(detail.abonnements || []).map((a) => (
            <div key={a.id} className="recap-ligne"><span>{a.produit_nom}</span><span>{a.statut}</span></div>
          ))}
          <div className="modal-actions">
            <Button variante="danger" onClick={() => anonymiser(detail.id)}>Anonymiser (RGPD)</Button>
            <Button variante="contour" onClick={() => setDetail(null)}>Fermer</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
