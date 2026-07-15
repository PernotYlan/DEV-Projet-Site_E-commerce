import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import Spinner from '../components/ui/Spinner';

// Pages publiques
import Home from '../pages/Home';
import Catalogue from '../pages/Catalogue';
import Produit from '../pages/Produit';
import Recherche from '../pages/Recherche';
import Panier from '../pages/Panier';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import ConfirmEmail from '../pages/ConfirmEmail';
import Contact from '../pages/Contact';
import { MentionsLegales, CGU, PolitiqueConfidentialite } from '../pages/PageStatique';

// Pages privées
import Checkout from '../pages/Checkout';
import Confirmation from '../pages/Confirmation';
import MonCompte from '../pages/account/MonCompte';
import Profil from '../pages/account/Profil';
import Adresses from '../pages/account/Adresses';
import Paiements from '../pages/account/Paiements';
import Abonnements from '../pages/account/Abonnements';
import Commandes from '../pages/account/Commandes';

// Back-office (réservé au rôle ADMIN)
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminProduits from '../pages/admin/AdminProduits';
import AdminProduitForm from '../pages/admin/AdminProduitForm';
import AdminCategories from '../pages/admin/AdminCategories';
import AdminUtilisateurs from '../pages/admin/AdminUtilisateurs';
import AdminCommandes from '../pages/admin/AdminCommandes';
import AdminAbonnements from '../pages/admin/AdminAbonnements';
import AdminMessages from '../pages/admin/AdminMessages';
import AdminCarrousel from '../pages/admin/AdminCarrousel';
import AdminAccueil from '../pages/admin/AdminAccueil';

/**
 * Route privée : redirige vers /login (avec retour) si non connecté.
 * Si adminSeul, redirige vers / quand le rôle n'est pas ADMIN.
 */
function ProtectedRoute({ children, adminSeul = false }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (adminSeul && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

/** Toutes les routes de l'application. */
export default function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/catalogue/:categorieId" element={<Catalogue />} />
        <Route path="/produit/:id" element={<Produit />} />
        <Route path="/recherche" element={<Recherche />} />
        <Route path="/panier" element={<Panier />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/cgu" element={<CGU />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />

        {/* Routes privées */}
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/confirmation/:commandeId" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
        <Route path="/compte" element={<ProtectedRoute><MonCompte /></ProtectedRoute>}>
          <Route index element={<Navigate to="/compte/profil" replace />} />
          <Route path="profil" element={<Profil />} />
          <Route path="adresses" element={<Adresses />} />
          <Route path="paiements" element={<Paiements />} />
          <Route path="abonnements" element={<Abonnements />} />
          <Route path="commandes" element={<Commandes />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<p className="vide"><span className="emoji">🤔</span>Page introuvable.</p>} />
      </Route>

      {/* Back-office : layout dédié, accès réservé aux ADMIN (redirige vers / sinon) */}
      <Route path="/admin" element={<ProtectedRoute adminSeul><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="produits" element={<AdminProduits />} />
        <Route path="produits/nouveau" element={<AdminProduitForm />} />
        <Route path="produits/:id/modifier" element={<AdminProduitForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="utilisateurs" element={<AdminUtilisateurs />} />
        <Route path="commandes" element={<AdminCommandes />} />
        <Route path="abonnements" element={<AdminAbonnements />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="carrousel" element={<AdminCarrousel />} />
        <Route path="accueil" element={<AdminAccueil />} />
      </Route>
    </Routes>
  );
}
