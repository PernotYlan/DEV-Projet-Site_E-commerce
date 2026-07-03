import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import Spinner from '../components/ui/Spinner';
import Visuel from '../components/ui/Visuel';
import Button from '../components/ui/Button';
import ProductCard, { euros } from '../components/ui/ProductCard';

/**
 * Page produit : visuel, nom, description, caractéristiques techniques,
 * sélecteur de type d'abonnement, disponibilité, CTA et services similaires.
 */
export default function Produit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [produit, setProduit] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [typeChoisi, setTypeChoisi] = useState('MENSUEL');
  const [ajoute, setAjoute] = useState(false);

  useEffect(() => {
    setProduit(null);
    setAjoute(false);
    window.scrollTo(0, 0);
    api.produit(id).then(setProduit).catch(() => setErreur(true));
  }, [id]);

  if (erreur) return <p className="vide">Service introuvable.</p>;
  if (!produit) return <Spinner />;

  const disponible = produit.is_active && !produit.en_maintenance;
  const prixChoisi = produit.prix.find((p) => p.type_abonnement === typeChoisi) || produit.prix[0];
  const libelles = { MENSUEL: '/mois', SEMESTRIEL: '/6 mois', ANNUEL: '/an' };

  /** Ajoute le produit au panier avec le type d'abonnement sélectionné. */
  function ajouterAuPanier() {
    addItem({
      produit_id: produit.id,
      nom: produit.nom,
      couleur: produit.couleur,
      prix_id: prixChoisi.id,
      type_abonnement: prixChoisi.type_abonnement,
      prix_unitaire_ht: prixChoisi.montant,
      quantite: 1,
    });
    setAjoute(true);
  }

  return (
    <div className="conteneur">
      <div className="fiche-produit">
        <Visuel couleur={produit.couleur} className="fiche-visuel" icone="🛡️" />

        <div className="fiche-infos">
          <h1>{produit.nom}</h1>

          {/* Disponibilité */}
          {disponible && <span className="badge badge-vert">Disponible immédiatement</span>}
          {produit.en_maintenance && (
            <span className="badge badge-orange">Service momentanément indisponible</span>
          )}
          {!produit.is_active && <span className="badge badge-rouge">Indisponible</span>}

          <p style={{ margin: '14px 0' }}>{produit.description}</p>

          {/* Sélecteur du type d'abonnement */}
          <div className="selecteur-abonnement" role="group" aria-label="Type d’abonnement">
            {produit.prix.map((p) => (
              <button
                key={p.id}
                className={p.type_abonnement === typeChoisi ? 'actif' : ''}
                onClick={() => setTypeChoisi(p.type_abonnement)}
              >
                {p.type_abonnement}
              </button>
            ))}
          </div>

          <p className="fiche-prix">
            {euros(prixChoisi.montant)} <span>HT {libelles[prixChoisi.type_abonnement]}</span>
          </p>

          {/* CTA */}
          {disponible ? (
            ajoute ? (
              <div>
                <p className="message-succes">Ajouté au panier ✓</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Button variante="rose" onClick={() => navigate('/panier')}>Voir le panier</Button>
                  <Button variante="contour" onClick={() => setAjoute(false)}>Continuer</Button>
                </div>
              </div>
            ) : (
              <Button variante="rose" onClick={ajouterAuPanier}>S’abonner maintenant</Button>
            )
          ) : (
            <Button disabled>Service indisponible</Button>
          )}

          {/* Caractéristiques techniques (jsonb clé/valeur) */}
          {produit.specs_technique && (
            <div className="specs">
              <h3>Caractéristiques techniques</h3>
              <dl>
                {Object.entries(produit.specs_technique).map(([cle, valeur]) => (
                  <div key={cle} style={{ display: 'contents' }}>
                    <dt>{cle}</dt>
                    <dd>{String(valeur)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Services similaires */}
      {produit.similaires?.length > 0 && (
        <>
          <h2 className="section-titre">Services similaires</h2>
          <div className="grille-produits">
            {produit.similaires.map((p) => (
              <ProductCard key={p.id} produit={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
