import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const TYPES = ['MENSUEL', 'SEMESTRIEL', 'ANNUEL'];

/** Formulaire de création / modification d'un produit. */
export default function AdminProduitForm() {
  const { id } = useParams();
  const edition = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categorie_id: '', nom: '', description: '', image_url: '',
    is_active: true, en_maintenance: false, priorite: 0, est_top_produit: false,
  });
  const [specs, setSpecs] = useState([{ cle: '', valeur: '' }]);
  const [prix, setPrix] = useState({ MENSUEL: '', SEMESTRIEL: '', ANNUEL: '' });
  const [prixExistants, setPrixExistants] = useState({}); // type -> id (mode édition)
  const [chargement, setChargement] = useState(edition);
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    api.admin.categories().then(setCategories).catch(() => {});
  }, []);

  // Mode édition : charge le produit existant
  useEffect(() => {
    if (!edition) return;
    api.admin.produit(id).then((p) => {
      setForm({
        categorie_id: p.categorie_id, nom: p.nom, description: p.description || '',
        image_url: p.image_url || '', is_active: p.is_active, en_maintenance: p.en_maintenance,
        priorite: p.priorite, est_top_produit: p.est_top_produit,
      });
      if (p.specs_technique && Object.keys(p.specs_technique).length) {
        setSpecs(Object.entries(p.specs_technique).map(([cle, valeur]) => ({ cle, valeur: String(valeur) })));
      }
      const px = {}; const ids = {};
      (p.prix || []).forEach((x) => { px[x.type_abonnement] = x.montant; ids[x.type_abonnement] = x.id; });
      setPrix({ MENSUEL: px.MENSUEL ?? '', SEMESTRIEL: px.SEMESTRIEL ?? '', ANNUEL: px.ANNUEL ?? '' });
      setPrixExistants(ids);
      setChargement(false);
    }).catch(() => { setErreur('Produit introuvable.'); setChargement(false); });
  }, [id, edition]);

  const champ = (cle) => (e) => setForm({ ...form, [cle]: e.target.value });
  const coche = (cle) => (e) => setForm({ ...form, [cle]: e.target.checked });

  /** Construit l'objet specs_technique depuis les lignes clé/valeur. */
  function construireSpecs() {
    const obj = {};
    specs.forEach(({ cle, valeur }) => { if (cle.trim()) obj[cle.trim()] = valeur; });
    return Object.keys(obj).length ? obj : null;
  }

  /** Enregistre le produit (création ou modification) + ses prix. */
  async function soumettre(e) {
    e.preventDefault();
    setEnCours(true);
    setErreur('');
    try {
      const corps = {
        ...form,
        categorie_id: Number(form.categorie_id),
        priorite: Number(form.priorite),
        specs_technique: construireSpecs(),
      };

      if (edition) {
        await api.admin.modifierProduit(id, corps);
        // Prix : met à jour l'existant ou crée le manquant
        for (const type of TYPES) {
          const montant = prix[type];
          if (montant === '' || montant == null) continue;
          if (prixExistants[type]) {
            await api.admin.modifierPrix(prixExistants[type], { montant: Number(montant) });
          } else {
            await api.admin.ajouterPrix(id, { type_abonnement: type, montant: Number(montant) });
          }
        }
      } else {
        corps.prix = TYPES.filter((t) => prix[t] !== '').map((t) => ({ type_abonnement: t, montant: Number(prix[t]) }));
        await api.admin.creerProduit(corps);
      }
      navigate('/admin/produits');
    } catch (err) {
      setErreur(err.response?.data?.error || 'Erreur lors de l’enregistrement.');
      setEnCours(false);
    }
  }

  if (chargement) return <Spinner />;

  return (
    <>
      <h1>{edition ? 'Modifier le produit' : 'Nouveau produit'}</h1>
      {erreur && <p className="message-erreur">{erreur}</p>}

      <form onSubmit={soumettre}>
        <div className="carte-bloc">
          <h2>Informations générales</h2>
          <div className="champ">
            <label htmlFor="cat">Catégorie</label>
            <select id="cat" required value={form.categorie_id} onChange={champ('categorie_id')}>
              <option value="">— Choisir —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <Input label="Nom" required value={form.nom} onChange={champ('nom')} />
          <div className="champ">
            <label htmlFor="desc">Description</label>
            <textarea id="desc" rows="4" value={form.description} onChange={champ('description')} />
          </div>
          <Input label="URL de l’image principale" value={form.image_url} onChange={champ('image_url')} />
          <div className="groupe-2">
            <Input label="Priorité" type="number" value={form.priorite} onChange={champ('priorite')} />
            <div className="champ" style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
              <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={form.is_active} onChange={coche('is_active')} /> Actif</label>
              <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={form.en_maintenance} onChange={coche('en_maintenance')} /> En maintenance</label>
              <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={form.est_top_produit} onChange={coche('est_top_produit')} /> Top produit</label>
            </div>
          </div>
        </div>

        <div className="carte-bloc">
          <h2>Caractéristiques techniques</h2>
          {specs.map((s, i) => (
            <div key={i} className="groupe-2" style={{ alignItems: 'end' }}>
              <Input label={i === 0 ? 'Caractéristique' : ''} value={s.cle}
                onChange={(e) => setSpecs(specs.map((x, j) => j === i ? { ...x, cle: e.target.value } : x))} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                <Input label={i === 0 ? 'Valeur' : ''} value={s.valeur}
                  onChange={(e) => setSpecs(specs.map((x, j) => j === i ? { ...x, valeur: e.target.value } : x))} />
                <Button type="button" variante="contour" petit style={{ marginBottom: 16 }}
                  onClick={() => setSpecs(specs.filter((_, j) => j !== i))}>✕</Button>
              </div>
            </div>
          ))}
          <Button type="button" variante="contour" petit onClick={() => setSpecs([...specs, { cle: '', valeur: '' }])}>
            + Ajouter une caractéristique
          </Button>
        </div>

        <div className="carte-bloc">
          <h2>Tarifs (€ HT)</h2>
          <div className="groupe-2">
            {TYPES.map((t) => (
              <Input key={t} label={t.charAt(0) + t.slice(1).toLowerCase()} type="number" step="0.01" min="0"
                value={prix[t]} onChange={(e) => setPrix({ ...prix, [t]: e.target.value })} />
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <Button type="button" variante="contour" onClick={() => navigate('/admin/produits')}>Annuler</Button>
          <Button type="submit" variante="rose" disabled={enCours}>{enCours ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </div>
      </form>
    </>
  );
}
