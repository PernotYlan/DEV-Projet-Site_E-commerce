import { useEffect, useState } from 'react';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const VIDE = { nom: '', description: '', image_url: '', ordre_affichage: 0, is_active: true };

/** Gestion des catégories : liste, réorganisation, CRUD. */
export default function AdminCategories() {
  const [categories, setCategories] = useState(null);
  const [edition, setEdition] = useState(null); // null | objet (id absent = création)
  const [erreur, setErreur] = useState('');

  function recharger() {
    api.admin.categories().then(setCategories).catch(() => setErreur('Erreur de chargement.'));
  }
  useEffect(recharger, []);

  /** Enregistre (création ou modification). */
  async function enregistrer(e) {
    e.preventDefault();
    try {
      if (edition.id) await api.admin.modifierCategorie(edition.id, edition);
      else await api.admin.creerCategorie(edition);
      setEdition(null);
      recharger();
    } catch (err) {
      setErreur(err.response?.data?.error || 'Erreur.');
    }
  }

  /** Supprime après confirmation. */
  async function supprimer(c) {
    if (!window.confirm(`Supprimer la catégorie « ${c.nom} » ?`)) return;
    try {
      await api.admin.supprimerCategorie(c.id);
      recharger();
    } catch (err) {
      alert(err.response?.data?.error || 'Suppression impossible.');
    }
  }

  /** Déplace une catégorie dans l'ordre d'affichage. */
  async function deplacer(index, sens) {
    const cible = index + sens;
    if (cible < 0 || cible >= categories.length) return;
    const liste = [...categories];
    [liste[index], liste[cible]] = [liste[cible], liste[index]];
    setCategories(liste);
    await api.admin.reordonnerCategories(liste.map((c, i) => ({ id: c.id, ordre_affichage: i + 1 })));
  }

  if (!categories) return <Spinner />;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Catégories</h1>
        <Button variante="rose" onClick={() => setEdition({ ...VIDE })}>+ Nouvelle catégorie</Button>
      </div>
      {erreur && <p className="message-erreur">{erreur}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Ordre</th><th>Nom</th><th>Produits</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {categories.map((c, i) => (
              <tr key={c.id}>
                <td>
                  <button className="btn btn-petit btn-contour" disabled={i === 0} onClick={() => deplacer(i, -1)}>↑</button>{' '}
                  <button className="btn btn-petit btn-contour" disabled={i === categories.length - 1} onClick={() => deplacer(i, 1)}>↓</button>
                </td>
                <td><strong>{c.nom}</strong></td>
                <td>{c.nb_produits}</td>
                <td>{c.is_active ? <span className="badge badge-vert">Active</span> : <span className="badge badge-rouge">Inactive</span>}</td>
                <td>
                  <div className="actions">
                    <Button petit variante="contour" onClick={() => setEdition({ ...c })}>Modifier</Button>
                    <Button petit variante="danger" onClick={() => supprimer(c)}>Suppr.</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edition && (
        <Modal titre={edition.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'} onClose={() => setEdition(null)}>
          <form onSubmit={enregistrer}>
            <Input label="Nom" required value={edition.nom} onChange={(e) => setEdition({ ...edition, nom: e.target.value })} />
            <div className="champ">
              <label>Description</label>
              <textarea rows="3" value={edition.description || ''} onChange={(e) => setEdition({ ...edition, description: e.target.value })} />
            </div>
            <Input label="URL de l’image" value={edition.image_url || ''} onChange={(e) => setEdition({ ...edition, image_url: e.target.value })} />
            <label style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
              <input type="checkbox" checked={edition.is_active} onChange={(e) => setEdition({ ...edition, is_active: e.target.checked })} /> Active
            </label>
            <div className="modal-actions">
              <Button type="button" variante="contour" onClick={() => setEdition(null)}>Annuler</Button>
              <Button type="submit" variante="rose">Enregistrer</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
