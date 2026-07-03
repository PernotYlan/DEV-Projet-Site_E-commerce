import { NavLink, Outlet } from 'react-router-dom';

/** Layout de l'espace compte : menu latéral (onglets sur mobile) + sous-page. */
export default function MonCompte() {
  const lien = ({ isActive }) => (isActive ? 'actif' : '');
  return (
    <div className="conteneur">
      <h1 className="section-titre">Mon compte</h1>
      <div className="layout-compte">
        <nav className="menu-compte" aria-label="Menu du compte">
          <NavLink to="/compte/profil" className={lien}>👤 Profil</NavLink>
          <NavLink to="/compte/adresses" className={lien}>📍 Adresses</NavLink>
          <NavLink to="/compte/paiements" className={lien}>💳 Paiements</NavLink>
          <NavLink to="/compte/abonnements" className={lien}>🔄 Abonnements</NavLink>
          <NavLink to="/compte/commandes" className={lien}>📦 Commandes</NavLink>
        </nav>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
