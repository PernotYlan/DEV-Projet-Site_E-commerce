import { NavLink } from 'react-router-dom';

/** Liens de navigation du back-office. */
const LIENS = [
  ['/admin', '📊 Dashboard', true],
  ['/admin/produits', '🛡️ Produits'],
  ['/admin/categories', '🗂️ Catégories'],
  ['/admin/commandes', '📦 Commandes'],
  ['/admin/abonnements', '🔄 Abonnements'],
  ['/admin/utilisateurs', '👥 Utilisateurs'],
  ['/admin/messages', '✉️ Messages'],
  ['/admin/carrousel', '🖼️ Carrousel'],
  ['/admin/accueil', '🏠 Contenu accueil'],
];

/** Barre latérale (horizontale et défilante sur mobile) du back-office. */
export default function AdminSidebar() {
  return (
    <nav className="admin-sidebar" aria-label="Navigation du back-office">
      {LIENS.map(([to, label, exact]) => (
        <NavLink key={to} to={to} end={exact} className={({ isActive }) => (isActive ? 'actif' : '')}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
