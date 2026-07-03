import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import Spinner from '../components/ui/Spinner';
import ProductCard from '../components/ui/ProductCard';

/**
 * Page de recherche avancée : mot-clé, filtres (catégories, prix,
 * type d'abonnement, disponibilité), tri et pagination.
 * Tous les critères sont synchronisés avec l'URL (?q=...).
 */
export default function Recherche() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [resultats, setResultats] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [saisie, setSaisie] = useState(params.get('q') || '');

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  // Relance la recherche à chaque changement de paramètres d'URL
  useEffect(() => {
    setChargement(true);
    setSaisie(params.get('q') || '');
    const criteres = {
      q: params.get('q') || undefined,
      categorie_id: params.get('categorie_id') || undefined,
      prix_min: params.get('prix_min') || undefined,
      prix_max: params.get('prix_max') || undefined,
      type_abonnement: params.get('type_abonnement') || undefined,
      disponible_seulement: params.get('disponible_seulement') === '1' || undefined,
      tri: params.get('tri') || undefined,
      page: params.get('page') || 1,
      limit: 12,
    };
    api
      .recherche(criteres)
      .then(setResultats)
      .catch(() => setResultats({ data: [], pagination: { page: 1, limit: 12, total: 0 } }))
      .finally(() => setChargement(false));
  }, [params]);

  /** Met à jour un paramètre d'URL (et revient page 1). */
  function definir(cle, valeur) {
    const suivants = new URLSearchParams(params);
    if (valeur === undefined || valeur === '' || valeur === false) {
      suivants.delete(cle);
    } else {
      suivants.set(cle, valeur);
    }
    if (cle !== 'page') suivants.delete('page');
    setParams(suivants);
  }

  const pagination = resultats?.pagination;
  const nbPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;
  const pageCourante = pagination?.page || 1;

  return (
    <div className="conteneur">
      <div className="layout-recherche">
        {/* Filtres */}
        <aside className="filtres">
          <h3>Filtres</h3>

          <fieldset>
            <legend>Catégorie</legend>
            {categories.map((c) => (
              <label key={c.id}>
                <input
                  type="radio"
                  name="categorie"
                  checked={params.get('categorie_id') === String(c.id)}
                  onChange={() => definir('categorie_id', String(c.id))}
                />
                {c.nom}
              </label>
            ))}
            <label>
              <input
                type="radio"
                name="categorie"
                checked={!params.get('categorie_id')}
                onChange={() => definir('categorie_id', '')}
              />
              Toutes
            </label>
          </fieldset>

          <fieldset>
            <legend>Prix (€ HT)</legend>
            <div className="prix-minmax">
              <input
                type="number"
                placeholder="Min"
                min="0"
                defaultValue={params.get('prix_min') || ''}
                onBlur={(e) => definir('prix_min', e.target.value)}
                aria-label="Prix minimum"
              />
              <input
                type="number"
                placeholder="Max"
                min="0"
                defaultValue={params.get('prix_max') || ''}
                onBlur={(e) => definir('prix_max', e.target.value)}
                aria-label="Prix maximum"
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>Abonnement</legend>
            {['MENSUEL', 'SEMESTRIEL', 'ANNUEL'].map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="type_abonnement"
                  checked={params.get('type_abonnement') === type}
                  onChange={() => definir('type_abonnement', type)}
                />
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </label>
            ))}
            <label>
              <input
                type="radio"
                name="type_abonnement"
                checked={!params.get('type_abonnement')}
                onChange={() => definir('type_abonnement', '')}
              />
              Tous
            </label>
          </fieldset>

          <fieldset>
            <legend>Disponibilité</legend>
            <label>
              <input
                type="checkbox"
                checked={params.get('disponible_seulement') === '1'}
                onChange={(e) => definir('disponible_seulement', e.target.checked ? '1' : '')}
              />
              Disponibles uniquement
            </label>
          </fieldset>
        </aside>

        {/* Résultats */}
        <section>
          <form
            className="header-recherche"
            style={{ maxWidth: 'none', marginBottom: 16 }}
            onSubmit={(e) => {
              e.preventDefault();
              definir('q', saisie);
            }}
          >
            <input
              type="search"
              placeholder="Rechercher un service…"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              style={{ border: '1.5px solid var(--gris-clair)' }}
            />
            <button type="submit">🔍</button>
          </form>

          <div className="barre-resultats">
            <p>
              <strong>{pagination?.total ?? 0}</strong> résultat{(pagination?.total ?? 0) > 1 ? 's' : ''}
            </p>
            <select
              value={params.get('tri') || ''}
              onChange={(e) => definir('tri', e.target.value)}
              aria-label="Trier les résultats"
            >
              <option value="">Pertinence</option>
              <option value="prix_asc">Prix croissant</option>
              <option value="prix_desc">Prix décroissant</option>
              <option value="date_desc">Nouveautés</option>
              <option value="disponibilite">Disponibilité</option>
            </select>
          </div>

          {chargement || !resultats ? (
            <Spinner />
          ) : resultats.data.length === 0 ? (
            <p className="vide">
              <span className="emoji">🔎</span>Aucun service ne correspond à votre recherche.
            </p>
          ) : (
            <div className="grille-produits" style={{ gridTemplateColumns: undefined }}>
              {resultats.data.map((produit) => (
                <ProductCard key={produit.id} produit={produit} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {nbPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button disabled={pageCourante <= 1} onClick={() => definir('page', String(pageCourante - 1))}>
                ‹
              </button>
              {Array.from({ length: nbPages }, (_, i) => i + 1).map((numero) => (
                <button
                  key={numero}
                  className={numero === pageCourante ? 'actif' : ''}
                  onClick={() => definir('page', String(numero))}
                >
                  {numero}
                </button>
              ))}
              <button disabled={pageCourante >= nbPages} onClick={() => definir('page', String(pageCourante + 1))}>
                ›
              </button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
