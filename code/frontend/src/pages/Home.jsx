import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Spinner from '../components/ui/Spinner';
import Visuel from '../components/ui/Visuel';
import ProductCard from '../components/ui/ProductCard';

/**
 * Page d'accueil : carrousel auto-défilant, texte fixe, grille des
 * catégories et section "Top Produits du moment".
 */
export default function Home() {
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    api.accueil().then(setDonnees).catch(() => setErreur(true));
  }, []);

  const nbSlides = donnees?.carrousel?.length || 0;

  // Auto-défilement toutes les 5 secondes (le minuteur repart à zéro
  // après une navigation manuelle, car `slide` est dans les dépendances)
  useEffect(() => {
    if (nbSlides < 2) return;
    const minuteur = setInterval(() => {
      setSlide((s) => (s + 1) % nbSlides);
    }, 5000);
    return () => clearInterval(minuteur);
  }, [nbSlides, slide]);

  if (erreur) return <p className="vide">Impossible de charger la page d’accueil.</p>;
  if (!donnees) return <Spinner />;

  const { carrousel, contenu, categories, top_produits } = donnees;

  return (
    <>
      {/* Carrousel promotionnel : piste coulissante + flèches + points */}
      {carrousel.length > 0 && (
        <section className="carrousel" aria-label="Promotions">
          <div className="carrousel-piste" style={{ transform: `translateX(-${slide * 100}%)` }}>
            {carrousel.map((s) => (
              <Visuel key={s.id} couleur={s.couleur} className="carrousel-slide">
                <div>
                  <h2>{s.titre}</h2>
                  <p>{s.description}</p>
                  {s.lien_url && (
                    <Link to={s.lien_url} className="btn btn-rose">
                      Découvrir
                    </Link>
                  )}
                </div>
              </Visuel>
            ))}
          </div>
          {carrousel.length > 1 && (
            <>
              <button
                className="carrousel-fleche gauche"
                onClick={() => setSlide((slide - 1 + carrousel.length) % carrousel.length)}
                aria-label="Diapositive précédente"
              >
                ‹
              </button>
              <button
                className="carrousel-fleche droite"
                onClick={() => setSlide((slide + 1) % carrousel.length)}
                aria-label="Diapositive suivante"
              >
                ›
              </button>
              <div className="carrousel-points">
                {carrousel.map((s, i) => (
                  <button
                    key={s.id}
                    className={i === slide ? 'actif' : ''}
                    onClick={() => setSlide(i)}
                    aria-label={`Aller à la diapositive ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Texte fixe modifiable depuis le back-office */}
      <p className="texte-accueil">{contenu.texte_sous_carrousel}</p>

      <div className="conteneur">
        {/* Grille des catégories */}
        <h2 className="section-titre">Nos catégories de services</h2>
        <div className="grille-categories">
          {categories.map((categorie) => (
            <Link key={categorie.id} to={`/catalogue/${categorie.id}`}>
              <Visuel couleur={categorie.couleur} className="carte-categorie">
                <span className="cat-icone">{categorie.icone || '🛡️'}</span>
                <span className="cat-nom">{categorie.nom}</span>
              </Visuel>
            </Link>
          ))}
        </div>

        {/* Top produits */}
        <h2 className="section-titre">{contenu.titre_top_produits}</h2>
        <div className="grille-produits">
          {top_produits.map((produit) => (
            <ProductCard key={produit.id} produit={produit} />
          ))}
        </div>
      </div>
    </>
  );
}
