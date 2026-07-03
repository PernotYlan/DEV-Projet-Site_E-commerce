import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../api';

/**
 * En-tête présent sur toutes les pages : logo, recherche, navigation
 * (avec dropdown catégories), panier avec badge, menu compte.
 * Sur mobile : menu burger qui intègre aussi les liens du footer.
 */
export default function Header() {
  const { user, logout } = useAuth();
  const { nbArticles } = useCart();
  const navigate = useNavigate();

  const [recherche, setRecherche] = useState('');
  const [categories, setCategories] = useState([]);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [dropdownCat, setDropdownCat] = useState(false);
  const [dropdownCompte, setDropdownCompte] = useState(false);
  const refNav = useRef(null);

  // Charge les catégories actives pour le menu déroulant
  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  // Ferme les dropdowns au clic extérieur
  useEffect(() => {
    function clicExterieur(e) {
      if (refNav.current && !refNav.current.contains(e.target)) {
        setDropdownCat(false);
        setDropdownCompte(false);
      }
    }
    document.addEventListener('click', clicExterieur);
    return () => document.removeEventListener('click', clicExterieur);
  }, []);

  /** Soumet la recherche et redirige vers la page de résultats. */
  function soumettreRecherche(e) {
    e.preventDefault();
    navigate(`/recherche?q=${encodeURIComponent(recherche)}`);
    setMenuOuvert(false);
  }

  /** Déconnexion puis retour à l'accueil. */
  async function deconnexion() {
    await logout();
    setMenuOuvert(false);
    setDropdownCompte(false);
    navigate('/');
  }

  /** Ferme le menu mobile lors d'une navigation. */
  const fermer = () => setMenuOuvert(false);

  return (
    <header className="header">
      <div className="header-barre" ref={refNav}>
        <Link to="/" className="logo" onClick={fermer}>
          CY<em>NA</em>
        </Link>

        <form className="header-recherche" onSubmit={soumettreRecherche} role="search">
          <input
            type="search"
            placeholder="Rechercher un service…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            aria-label="Rechercher un service"
          />
          <button type="submit" aria-label="Lancer la recherche">🔍</button>
        </form>

        <nav className="header-nav" aria-label="Navigation principale">
          <Link to="/">Accueil</Link>
          <div className="nav-deroulant">
            <button onClick={() => setDropdownCat(!dropdownCat)}>Catégories ▾</button>
            {dropdownCat && (
              <div className="nav-deroulant-menu">
                {categories.map((c) => (
                  <Link key={c.id} to={`/catalogue/${c.id}`} onClick={() => setDropdownCat(false)}>
                    {c.nom}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/contact">Contact</Link>
          {user ? (
            <div className="nav-deroulant">
              <button onClick={() => setDropdownCompte(!dropdownCompte)}>
                👤 {user.prenom} ▾
              </button>
              {dropdownCompte && (
                <div className="nav-deroulant-menu">
                  <Link to="/compte/profil" onClick={() => setDropdownCompte(false)}>Mon compte</Link>
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" onClick={() => setDropdownCompte(false)}>Back-office</Link>
                  )}
                  <a href="#" onClick={(e) => { e.preventDefault(); deconnexion(); }}>Déconnexion</a>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login">Connexion</Link>
              <Link to="/register">Inscription</Link>
            </>
          )}
        </nav>

        <Link to="/panier" className="header-panier" aria-label={`Panier, ${nbArticles} article(s)`} onClick={fermer}>
          🛒
          {nbArticles > 0 && <span className="badge-panier">{nbArticles}</span>}
        </Link>

        <button className="burger" onClick={() => setMenuOuvert(!menuOuvert)} aria-label="Menu">
          {menuOuvert ? '✕' : '☰'}
        </button>
      </div>

      {menuOuvert && (
        <nav className="menu-mobile" aria-label="Menu mobile">
          <Link to="/" onClick={fermer}>Accueil</Link>
          <span className="menu-section">Catégories</span>
          {categories.map((c) => (
            <Link key={c.id} to={`/catalogue/${c.id}`} onClick={fermer}>{c.nom}</Link>
          ))}
          <span className="menu-section">Compte</span>
          {user ? (
            <>
              <Link to="/compte/profil" onClick={fermer}>Mon compte</Link>
              <Link to="/compte/commandes" onClick={fermer}>Mes commandes</Link>
              {user.role === 'ADMIN' && <Link to="/admin" onClick={fermer}>Back-office</Link>}
              <button className="lien-menu" onClick={deconnexion}>Se déconnecter</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={fermer}>Se connecter</Link>
              <Link to="/register" onClick={fermer}>S’inscrire</Link>
            </>
          )}
          {/* Contenu du footer, déplacé dans le menu sur mobile */}
          <span className="menu-section">Informations</span>
          <Link to="/contact" onClick={fermer}>Contact</Link>
          <Link to="/mentions-legales" onClick={fermer}>Mentions légales</Link>
          <Link to="/cgu" onClick={fermer}>CGU</Link>
        </nav>
      )}
    </header>
  );
}
