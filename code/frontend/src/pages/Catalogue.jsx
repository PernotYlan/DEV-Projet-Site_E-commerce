import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import Spinner from '../components/ui/Spinner';
import Visuel from '../components/ui/Visuel';
import ProductCard from '../components/ui/ProductCard';

/**
 * Page catalogue d'une catégorie : bannière avec nom en surimpression,
 * description, puis produits triés (disponibles prioritaires d'abord,
 * indisponibles grisés en dernier — tri fait côté serveur).
 */
export default function Catalogue() {
  const { categorieId } = useParams();
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    setDonnees(null);
    api.categorieProduits(categorieId).then(setDonnees).catch(() => setErreur(true));
  }, [categorieId]);

  if (erreur) return <p className="vide">Catégorie introuvable.</p>;
  if (!donnees) return <Spinner />;

  const { categorie, produits } = donnees;

  return (
    <div className="conteneur">
      <Visuel couleur={categorie.couleur} className="banniere-categorie">
        <h1>{categorie.nom}</h1>
      </Visuel>
      <p className="description-categorie">{categorie.description}</p>

      {produits.length === 0 ? (
        <p className="vide">
          <span className="emoji">📭</span>Aucun service dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="grille-produits">
          {produits.map((produit) => (
            <ProductCard key={produit.id} produit={produit} />
          ))}
        </div>
      )}
    </div>
  );
}
