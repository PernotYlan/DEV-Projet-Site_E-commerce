/**
 * Couche API unique pour toute l'application.
 * - VITE_MOCK=1 : données de démonstration locales (aucun backend requis).
 * - VITE_MOCK=0 : appels HTTP vers le backend Express via Axios.
 * Les composants n'importent que `api` et ignorent le mode utilisé.
 */
import http, { setAccessToken } from './axios';
import { mockApi } from './mock';

const MOCK = import.meta.env.VITE_MOCK === '1';

/** Extrait le champ `data` de la réponse standard du backend. */
const data = (reponse) => reponse.data.data;

/** Implémentation réelle : chaque fonction appelle l'endpoint correspondant. */
const realApi = {
  // Catalogue public
  accueil: () => http.get('/accueil').then(data),
  categories: () => http.get('/categories').then(data),
  categorieProduits: (id) => http.get(`/categories/${id}/produits`).then(data),
  produit: (id) => http.get(`/produits/${id}`).then(data),
  recherche: (params) => http.get('/produits/recherche', { params }).then((r) => r.data),

  // Authentification
  login: (email, mot_de_passe, se_souvenir) =>
    http.post('/auth/login', { email, mot_de_passe, se_souvenir }).then(data),
  register: (donnees) => http.post('/auth/register', donnees).then(data),
  refresh: () => http.post('/auth/refresh').then(data),
  logout: () => http.post('/auth/logout').then(data),
  forgotPassword: (email) => http.post('/auth/forgot-password', { email }).then(data),
  resetPassword: (token, nouveau_mot_de_passe) =>
    http.post('/auth/reset-password', { token, nouveau_mot_de_passe }).then(data),
  confirmEmail: (token) => http.get('/auth/confirm-email', { params: { token } }).then(data),

  // Compte utilisateur
  me: () => http.get('/utilisateurs/me').then(data),
  updateMe: (donnees) => http.put('/utilisateurs/me', donnees).then(data),
  changerMotDePasse: (mot_de_passe_actuel, nouveau_mot_de_passe) =>
    http.put('/utilisateurs/me/password', { mot_de_passe_actuel, nouveau_mot_de_passe }).then(data),
  changerEmail: (nouvel_email, mot_de_passe) =>
    http.put('/utilisateurs/me/email', { nouvel_email, mot_de_passe }).then(data),
  adresses: () => http.get('/utilisateurs/me/adresses').then(data),
  creerAdresse: (adresse) => http.post('/utilisateurs/me/adresses', adresse).then(data),
  modifierAdresse: (id, adresse) => http.put(`/utilisateurs/me/adresses/${id}`, adresse).then(data),
  supprimerAdresse: (id) => http.delete(`/utilisateurs/me/adresses/${id}`).then(data),
  adresseDefaut: (id) => http.put(`/utilisateurs/me/adresses/${id}/defaut`).then(data),
  paiements: () => http.get('/utilisateurs/me/paiements').then(data),
  ajouterPaiement: (stripePaymentMethodId) =>
    http.post('/utilisateurs/me/paiements', { stripe_payment_method_id: stripePaymentMethodId }).then(data),
  supprimerPaiement: (id) => http.delete(`/utilisateurs/me/paiements/${id}`).then(data),
  paiementDefaut: (id) => http.put(`/utilisateurs/me/paiements/${id}/defaut`).then(data),

  // Abonnements
  abonnements: () => http.get('/abonnements').then(data),
  resilierAbonnement: (id) => http.post(`/abonnements/${id}/resilier`).then(data),

  // Commandes
  commandes: () => http.get('/commandes').then(data),
  commande: (id) => http.get(`/commandes/${id}`).then(data),
  creerCommande: (donnees) => http.post('/commandes', donnees).then(data),
  telechargerFacture: (id) => http.get(`/commandes/${id}/facture`, { responseType: 'blob' }).then((r) => r.data),

  // Contact
  contact: (donnees) => http.post('/contact', donnees).then(data),
  chatbot: (donnees) => http.post('/contact/chatbot', donnees).then(data),

  // Back-office (rôle ADMIN)
  admin: {
    dashboard: (periode) => http.get('/admin/dashboard/stats', { params: { periode } }).then(data),

    // Produits
    produits: (params) => http.get('/admin/produits', { params }).then((r) => r.data),
    produit: (id) => http.get(`/admin/produits/${id}`).then(data),
    creerProduit: (b) => http.post('/admin/produits', b).then(data),
    modifierProduit: (id, b) => http.put(`/admin/produits/${id}`, b).then(data),
    supprimerProduit: (id) => http.delete(`/admin/produits/${id}`).then(data),
    ajouterPrix: (id, b) => http.post(`/admin/produits/${id}/prix`, b).then(data),
    modifierPrix: (id, b) => http.put(`/admin/prix/${id}`, b).then(data),
    supprimerPrix: (id) => http.delete(`/admin/prix/${id}`).then(data),

    // Catégories
    categories: () => http.get('/admin/categories').then(data),
    creerCategorie: (b) => http.post('/admin/categories', b).then(data),
    modifierCategorie: (id, b) => http.put(`/admin/categories/${id}`, b).then(data),
    supprimerCategorie: (id) => http.delete(`/admin/categories/${id}`).then(data),
    reordonnerCategories: (ordres) => http.put('/admin/categories/ordre', ordres).then(data),

    // Carrousel
    carrousel: () => http.get('/admin/carrousel').then(data),
    creerSlide: (b) => http.post('/admin/carrousel', b).then(data),
    modifierSlide: (id, b) => http.put(`/admin/carrousel/${id}`, b).then(data),
    supprimerSlide: (id) => http.delete(`/admin/carrousel/${id}`).then(data),

    // Contenu accueil
    accueil: () => http.get('/admin/accueil').then(data),
    modifierAccueil: (cle, valeur) => http.put(`/admin/accueil/${cle}`, { valeur }).then(data),

    // Utilisateurs
    utilisateurs: (params) => http.get('/admin/utilisateurs', { params }).then((r) => r.data),
    utilisateur: (id) => http.get(`/admin/utilisateurs/${id}`).then(data),
    modifierUtilisateur: (id, b) => http.put(`/admin/utilisateurs/${id}`, b).then(data),
    anonymiserUtilisateur: (id) => http.delete(`/admin/utilisateurs/${id}`).then(data),

    // Commandes
    commandes: (params) => http.get('/admin/commandes', { params }).then((r) => r.data),
    commande: (id) => http.get(`/admin/commandes/${id}`).then(data),
    telechargerFacture: (id) =>
      http.get(`/admin/commandes/${id}/facture`, { responseType: 'blob' }).then((r) => r.data),

    // Abonnements
    abonnements: (params) => http.get('/admin/abonnements', { params }).then((r) => r.data),
    changerStatutAbonnement: (id, statut) => http.put(`/admin/abonnements/${id}/statut`, { statut }).then(data),

    // Messages
    messages: (params) => http.get('/admin/messages', { params }).then((r) => r.data),
    message: (id) => http.get(`/admin/messages/${id}`).then(data),
    changerStatutMessage: (id, statut) => http.put(`/admin/messages/${id}/statut`, { statut }).then(data),
  },
};

export const api = MOCK ? mockApi : realApi;
export { setAccessToken, MOCK };
