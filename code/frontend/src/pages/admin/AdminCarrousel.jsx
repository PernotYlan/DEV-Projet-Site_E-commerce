import { useEffect, useState } from 'react';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

const VIDE = { titre: '', description: '', img_url: '', lien_url: '', ordre_affichage: 0, is_active: true };

/** Gestion du carrousel d'accueil : liste avec aperçu, CRUD. */
export default function AdminCarrousel() {
  const [slides, setSlides] = useState(null);
  const [edition, setEdition] = useState(null);
  const [erreur, setErreur] = useState('');

  function recharger() {
    api.admin.carrousel().then(setSlides).catch(() => setErreur('Erreur de chargement.'));
  }
  useEffect(recharger, []);

  async function enregistrer(e) {
    e.preventDefault();
    try {
      if (edition.id) await api.admin.modifierSlide(edition.id, edition);
      else await api.admin.creerSlide(edition);
      setEdition(null);
      recharger();
    } catch (err) {
      setErreur(err.response?.data?.error || 'Erreur.');
    }
  }

  async function supprimer(s) {
    if (!window.confirm('Supprimer cette slide ?')) return;
    await api.admin.supprimerSlide(s.id);
    recharger();
  }

  if (!slides) return <Spinner />;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Carrousel d’accueil</h1>
        <Button variante="rose" onClick={() => setEdition({ ...VIDE })}>+ Nouvelle slide</Button>
      </div>
      {erreur && <p className="message-erreur">{erreur}</p>}

      {slides.map((s) => (
        <div key={s.id} className="liste-element carte-bloc" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 90, height: 54, borderRadius: 8, flexShrink: 0,
              background: s.img_url ? `center/cover url(${s.img_url})` : 'var(--ardoise)',
            }} />
            <div>
              <strong>{s.titre || <em>(sans titre)</em>}</strong>{' '}
              {!s.is_active && <span className="badge badge-rouge">Inactive</span>}
              <br /><span style={{ fontSize: '0.85rem', color: 'var(--gris)' }}>{s.description}</span>
            </div>
          </div>
          <div className="liste-element-actions">
            <Button petit variante="contour" onClick={() => setEdition({ ...s })}>Modifier</Button>
            <Button petit variante="danger" onClick={() => supprimer(s)}>Suppr.</Button>
          </div>
        </div>
      ))}

      {edition && (
        <Modal titre={edition.id ? 'Modifier la slide' : 'Nouvelle slide'} onClose={() => setEdition(null)}>
          <form onSubmit={enregistrer}>
            <Input label="Titre" value={edition.titre || ''} onChange={(e) => setEdition({ ...edition, titre: e.target.value })} />
            <div className="champ">
              <label>Description</label>
              <textarea rows="2" value={edition.description || ''} onChange={(e) => setEdition({ ...edition, description: e.target.value })} />
            </div>
            <Input label="URL de l’image" required value={edition.img_url} onChange={(e) => setEdition({ ...edition, img_url: e.target.value })} />
            <Input label="Lien (ex: /produit/3)" value={edition.lien_url || ''} onChange={(e) => setEdition({ ...edition, lien_url: e.target.value })} />
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
