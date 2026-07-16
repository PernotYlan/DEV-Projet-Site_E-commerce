import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { euros } from '../../components/ui/ProductCard';

const LIBELLES_TYPE = { MENSUEL: 'Mensuel', SEMESTRIEL: 'Semestriel', ANNUEL: 'Annuel' };

/** Page de détails (lecture seule) d'un produit du catalogue. */
export default function AdminProduitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [produit, setProduit] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.admin.produit(id).then(setProduit).catch(() => setErreur('Produit introuvable.'));
  }, [id]);

  if (erreur) return <p className="message-erreur">{erreur}</p>;
  if (!produit) return <Spinner />;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1>{produit.nom}</h1>
        <div className="actions">
          <Button variante="contour" onClick={() => navigate('/admin/produits')}>Retour à la liste</Button>
          <Button variante="rose" onClick={() => navigate(`/admin/produits/${id}/modifier`)}>Modifier</Button>
        </div>
      </div>

      <div className="carte-bloc">
        <h2>Informations générales</h2>
        <div className="groupe-2">
          <p><strong>Catégorie</strong><br />{produit.categorie_nom || produit.categorie_id}</p>
          <p><strong>Priorité</strong><br />{produit.priorite}</p>
        </div>
        {produit.description && (
          <p style={{ marginTop: 10 }}><strong>Description</strong><br />{produit.description}</p>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {!produit.is_active && <span className="badge badge-rouge">Inactif</span>}
          {produit.en_maintenance && <span className="badge badge-orange">Maintenance</span>}
          {produit.is_active && !produit.en_maintenance && <span className="badge badge-vert">Actif</span>}
          {produit.est_top_produit && <span className="badge badge-rose">Top produit</span>}
        </div>
      </div>

      {produit.specs_technique && Object.keys(produit.specs_technique).length > 0 && (
        <div className="carte-bloc">
          <h2>Caractéristiques techniques</h2>
          {Object.entries(produit.specs_technique).map(([cle, valeur]) => (
            <div key={cle} className="recap-ligne"><span>{cle}</span><span>{String(valeur)}</span></div>
          ))}
        </div>
      )}

      <div className="carte-bloc">
        <h2>Tarifs</h2>
        {(produit.prix || []).length === 0 ? (
          <p style={{ color: 'var(--gris)' }}>Aucun tarif défini.</p>
        ) : (
          (produit.prix || []).map((p) => (
            <div key={p.id} className="recap-ligne">
              <span>{LIBELLES_TYPE[p.type_abonnement] || p.type_abonnement}</span>
              <span>{euros(p.montant)} HT</span>
            </div>
          ))
        )}
      </div>

      {produit.images && produit.images.length > 0 && (
        <div className="carte-bloc">
          <h2>Images</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {produit.images.map((img) => (
              <img key={img.id} src={img.image_url} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
