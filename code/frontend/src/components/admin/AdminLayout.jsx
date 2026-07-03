import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MOCK } from '../../api';
import AdminSidebar from './AdminSidebar';

/** Gabarit du back-office : barre supérieure + sidebar + contenu. */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function deconnexion() {
    await logout();
    navigate('/');
  }

  return (
    <>
      {MOCK && (
        <div className="bandeau-demo">Mode démonstration — back-office avec données fictives</div>
      )}
      <div className="admin-topbar">
        <Link to="/admin" className="logo">CY<em>NA</em> · Admin</Link>
        <div className="admin-topbar-actions">
          <Link to="/">← Retour au site</Link>
          <span>👤 {user?.prenom}</span>
          <button className="btn btn-petit btn-rose" onClick={deconnexion}>Déconnexion</button>
        </div>
      </div>
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-contenu">
          <Outlet />
        </div>
      </div>
    </>
  );
}
