import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { euros } from '../../components/ui/ProductCard';

/** Colonnes triables du tableau : libellé affiché + clé de tri envoyée à l'API. */
const COLONNES = [
  { cle: 'nom', libelle: 'Nom' },
  { cle: 'categorie', libelle: 'Catégorie' },
  { cle: 'prix', libelle: 'Prix dès' },
  { cle: 'priorite', libelle: 'Priorité' },
  { cle: 'is_active', libelle: 'État' },
];

/** Liste des produits : recherche, filtres, tri, pagination, sélection multiple, suppression. */
export default function AdminProduits() {
  const navigate = useNavigate();
  const [resultat, setResultat] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filtres, setFiltres] = useState({ search: '', categorie_id: '', is_active: '', sort: 'priorite', order: 'desc', page: 1 });
  const [erreur, setErreur] = useState('');
  const [selection, setSelection] = useState(new Set());

  useEffect(() => {
    api.admin.categories().then(setCategories).catch(() => {});
  }, []);

  /** Recharge la liste selon les filtres. */
  function recharger() {
    setResultat(null);
    setSelection(new Set());
    api.admin.produits(filtres).then(setResultat).catch(() => setErreur('Erreur de chargement.'));
  }

  useEffect(recharger, [filtres]);

  /** Change un filtre (et revient page 1, sauf pour la pagination). */
  const set = (cle, valeur) => setFiltres((f) => ({ ...f, [cle]: valeur, page: cle === 'page' ? valeur : 1 }));

  /** Bascule le tri sur une colonne. */
  function trier(colonne) {
    setFiltres((f) => ({ ...f, sort: colonne, order: f.sort === colonne && f.order === 'asc' ? 'desc' : 'asc', page: 1 }));
  }

  /** Coche/décoche un produit dans la sélection. */
  function basculerSelection(id) {
    setSelection((s) => {
      const suivant = new Set(s);
      suivant.has(id) ? suivant.delete(id) : suivant.add(id);
      return suivant;
    });
  }

  /** Coche/décoche tous les produits affichés sur la page courante. */
  function basculerToutSelectionner() {
    const idsPage = (resultat?.data || []).map((p) => p.id);
    const touteCochee = idsPage.length > 0 && idsPage.every((id) => selection.has(id));
    setSelection(touteCochee ? new Set() : new Set(idsPage));
  }

  /** Supprime un produit après confirmation. */
  async function supprimer(id, nom) {
    if (!window.confirm(`Supprimer « ${nom} » ?`)) return;
    try {
      await api.admin.supprimerProduit(id);
      recharger();
    } catch (err) {
      alert(err.response?.data?.error || 'Suppression impossible.');
    }
  }

  /** Supprime tous les produits sélectionnés après confirmation. */
  async function supprimerSelection() {
    const ids = [...selection];
    if (!window.confirm(`Supprimer les ${ids.length} produits sélectionnés ?`)) return;
    try {
      const { echecs } = await api.admin.supprimerProduits(ids);
      if (echecs?.length) {
        alert(`${echecs.length} produit(s) n'ont pas pu être supprimés :\n` + echecs.map((e) => `- ${e.raison}`).join('\n'));
      }
      recharger();
    } catch (err) {
      alert(err.response?.data?.error || 'Suppression impossible.');
    }
  }

  const pagination = resultat?.pagination;
  const nbPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;
  const idsPage = (resultat?.data || []).map((p) => p.id);
  const touteCochee = idsPage.length > 0 && idsPage.every((id) => selection.has(id));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1>Produits</h1>
        <Button variante="rose" onClick={() => navigate('/admin/produits/nouveau')}>+ Nouveau produit</Button>
      </div>

      <div className="admin-barre">
        <input type="search" placeholder="Rechercher…" value={filtres.search} onChange={(e) => set('search', e.target.value)} />
        <select value={filtres.categorie_id} onChange={(e) => set('categorie_id', e.target.value)}>
          <option value="">Toutes catégories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={filtres.is_active} onChange={(e) => set('is_active', e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {selection.size > 0 && (
        <div className="barre-selection">
          <span>{selection.size} produit{selection.size > 1 ? 's' : ''} sélectionné{selection.size > 1 ? 's' : ''}</span>
          <Button petit variante="danger" onClick={supprimerSelection}>Supprimer la sélection</Button>
        </div>
      )}

      {!resultat ? (
        <Spinner />
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="col-case">
                    <input type="checkbox" checked={touteCochee} onChange={basculerToutSelectionner} aria-label="Tout sélectionner" />
                  </th>
                  {COLONNES.map((col) => (
                    <th key={col.cle} className="th-tri" onClick={() => trier(col.cle)}>
                      {col.libelle}
                      {filtres.sort === col.cle && <span className="fleche-tri">{filtres.order === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resultat.data.map((p) => (
                  <tr key={p.id}>
                    <td className="col-case">
                      <input type="checkbox" checked={selection.has(p.id)} onChange={() => basculerSelection(p.id)} aria-label={`Sélectionner ${p.nom}`} />
                    </td>
                    <td>{p.nom} {p.est_top_produit && <span className="badge badge-rose">Top</span>}</td>
                    <td>{p.categorie_nom}</td>
                    <td>{p.prix_min != null ? euros(p.prix_min) : '—'}</td>
                    <td>{p.priorite}</td>
                    <td>
                      {!p.is_active && <span className="badge badge-rouge">Inactif</span>}
                      {p.en_maintenance && <span className="badge badge-orange">Maintenance</span>}
                      {p.is_active && !p.en_maintenance && <span className="badge badge-vert">Actif</span>}
                    </td>
                    <td>
                      <div className="actions">
                        <Button petit variante="contour" onClick={() => navigate(`/admin/produits/${p.id}`)}>Détails</Button>
                        <Button petit variante="danger" onClick={() => supprimer(p.id, p.nom)}>Suppr.</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {resultat.data.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--gris)' }}>Aucun produit.</td></tr>
                )}
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
