/**
 * Implémentation "mock" de l'API (mode VITE_MOCK=1).
 * Reproduit le comportement du backend avec les données de démonstration,
 * pour faire tourner le site sans serveur (démo locale).
 */
import {
  categories,
  produits,
  carrousel,
  contenuAccueil,
  utilisateurDemo,
  adressesDemo,
  paiementsDemo,
  abonnementsDemo,
  commandesDemo,
} from './mock-data';

/** Petite latence artificielle pour simuler le réseau. */
const attendre = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

/** Copie profonde simple (évite de muter les fixtures). */
const copie = (objet) => JSON.parse(JSON.stringify(objet));

// État mutable de la session de démo (persiste tant que l'onglet est ouvert)
let etatUser = null;
let etatAdresses = copie(adressesDemo);
let etatPaiements = copie(paiementsDemo);
let etatAbonnements = copie(abonnementsDemo);
let etatCommandes = copie(commandesDemo);
let compteurId = 100;

// État mutable du catalogue côté back-office démo
let adminProduits = copie(produits);
let adminCategories = copie(categories);
let adminCarrousel = copie(carrousel);
let adminContenu = copie(contenuAccueil);

/** Petite liste d'utilisateurs fictifs pour le back-office démo. */
let adminUtilisateurs = [
  { id: 'u-1', nom: 'Dupont', prenom: 'Marie', email: 'demo@cyna-it.fr', role: 'CLIENT', email_verifie: true, cree_le: '2026-05-01' },
  { id: 'u-2', nom: 'Martin', prenom: 'Paul', email: 'paul.martin@example.com', role: 'CLIENT', email_verifie: true, cree_le: '2026-04-12' },
  { id: 'u-3', nom: 'Cyna', prenom: 'Admin', email: 'admin@cyna-it.fr', role: 'ADMIN', email_verifie: true, cree_le: '2026-01-10' },
];

/** Messages de contact fictifs pour le back-office démo. */
let adminMessages = [
  { id: 'm-1', email: 'paul.martin@example.com', sujet: 'Question abonnement', message: 'Comment passer à l’offre annuelle ?', source: 'FORMULAIRE', statut: 'NOUVEAU', cree_le: '2026-06-10' },
  { id: 'm-2', email: 'visiteur@example.com', sujet: null, message: 'Quelles méthodes de paiement acceptez-vous ?', source: 'CHATBOT', statut: 'TRAITE', cree_le: '2026-06-08' },
];

/** Nom de catégorie depuis son id (données démo). */
const nomCategorie = (id) => (adminCategories.find((c) => c.id === id) || {}).nom || '';

// L'utilisateur démo est "souvenu" via localStorage (rôle inclus)
if (localStorage.getItem('cyna_demo_connecte') === '1') {
  const estAdmin = localStorage.getItem('cyna_demo_role') === 'ADMIN';
  etatUser = { ...copie(utilisateurDemo), role: estAdmin ? 'ADMIN' : 'CLIENT' };
}

/** Tri du catalogue : actifs prioritaires → actifs sans priorité → indisponibles. */
function trierProduits(liste) {
  return [...liste].sort((a, b) => {
    const dispoA = a.is_active && !a.en_maintenance ? 0 : 1;
    const dispoB = b.is_active && !b.en_maintenance ? 0 : 1;
    if (dispoA !== dispoB) return dispoA - dispoB;
    return (b.priorite || 0) - (a.priorite || 0);
  });
}

export const mockApi = {
  // ----- Catalogue public -----

  /** GET /accueil */
  async accueil() {
    await attendre();
    return {
      carrousel: copie(carrousel),
      contenu: copie(contenuAccueil),
      categories: copie(categories),
      top_produits: copie(trierProduits(produits.filter((p) => p.est_top_produit && p.is_active))),
    };
  },

  /** GET /categories */
  async categories() {
    await attendre(100);
    return copie(categories);
  },

  /** GET /categories/:id/produits */
  async categorieProduits(id) {
    await attendre();
    const categorie = categories.find((c) => c.id === Number(id));
    if (!categorie) throw new Error('Catégorie introuvable');
    return {
      categorie: copie(categorie),
      produits: copie(trierProduits(produits.filter((p) => p.categorie_id === Number(id)))),
    };
  },

  /** GET /produits/:id */
  async produit(id) {
    await attendre();
    const produit = produits.find((p) => p.id === Number(id));
    if (!produit) throw new Error('Produit introuvable');
    const similaires = produits
      .filter((p) => p.categorie_id === produit.categorie_id && p.id !== produit.id && p.is_active)
      .slice(0, 6);
    return { ...copie(produit), similaires: copie(similaires) };
  },

  /** GET /produits/recherche */
  async recherche(params) {
    await attendre();
    let resultats = [...produits];

    if (params.q) {
      const q = params.q.toLowerCase();
      resultats = resultats.filter(
        (p) => p.nom.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
      );
    }
    if (params.categorie_id) {
      resultats = resultats.filter((p) => p.categorie_id === Number(params.categorie_id));
    }
    if (params.type_abonnement) {
      resultats = resultats.filter((p) => p.prix.some((x) => x.type_abonnement === params.type_abonnement));
    }
    if (params.prix_min || params.prix_max) {
      resultats = resultats.filter((p) => {
        const minimum = Math.min(...p.prix.map((x) => x.montant));
        if (params.prix_min && minimum < Number(params.prix_min)) return false;
        if (params.prix_max && minimum > Number(params.prix_max)) return false;
        return true;
      });
    }
    if (params.disponible_seulement) {
      resultats = resultats.filter((p) => p.is_active && !p.en_maintenance);
    }

    const prixMin = (p) => Math.min(...p.prix.map((x) => x.montant));
    switch (params.tri) {
      case 'prix_asc':
        resultats.sort((a, b) => prixMin(a) - prixMin(b));
        break;
      case 'prix_desc':
        resultats.sort((a, b) => prixMin(b) - prixMin(a));
        break;
      case 'date_desc':
        resultats.sort((a, b) => new Date(b.cree_le) - new Date(a.cree_le));
        break;
      case 'date_asc':
        resultats.sort((a, b) => new Date(a.cree_le) - new Date(b.cree_le));
        break;
      default:
        resultats = trierProduits(resultats);
    }

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 12;
    const total = resultats.length;
    const debut = (page - 1) * limit;
    return {
      data: copie(resultats.slice(debut, debut + limit)),
      pagination: { page, limit, total },
    };
  },

  // ----- Authentification -----

  /**
   * POST /auth/login — en démo, accepte n'importe quel couple email/mot de passe.
   * Un email commençant par « admin » connecte en tant qu'ADMIN (pour montrer
   * le back-office dans la démo).
   */
  async login(email) {
    await attendre(400);
    const role = email.toLowerCase().startsWith('admin') ? 'ADMIN' : 'CLIENT';
    etatUser = { ...copie(utilisateurDemo), email, role };
    localStorage.setItem('cyna_demo_connecte', '1');
    localStorage.setItem('cyna_demo_role', role);
    return { access_token: 'demo-token', user: copie(etatUser) };
  },

  /** POST /auth/register — simule la création de compte. */
  async register() {
    await attendre(400);
    return { message: 'Compte créé. Vérifiez vos emails pour confirmer votre inscription.' };
  },

  /** POST /auth/refresh — restaure la session démo si elle existe. */
  async refresh() {
    await attendre(100);
    if (!etatUser) throw new Error('Pas de session');
    return { access_token: 'demo-token', user: copie(etatUser) };
  },

  /** POST /auth/logout */
  async logout() {
    etatUser = null;
    localStorage.removeItem('cyna_demo_connecte');
    localStorage.removeItem('cyna_demo_role');
  },

  /** POST /auth/forgot-password */
  async forgotPassword() {
    await attendre(400);
    return { message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' };
  },

  /** POST /auth/reset-password */
  async resetPassword() {
    await attendre(400);
    return { message: 'Mot de passe réinitialisé.' };
  },

  /** GET /auth/confirm-email */
  async confirmEmail() {
    await attendre(600);
    return { message: 'Email confirmé. Vous pouvez maintenant vous connecter.' };
  },

  // ----- Compte utilisateur -----

  /** GET /utilisateurs/me */
  async me() {
    await attendre(100);
    return copie(etatUser);
  },

  /** PUT /utilisateurs/me */
  async updateMe(donnees) {
    await attendre();
    etatUser = { ...etatUser, ...donnees };
    return copie(etatUser);
  },

  /** PUT /utilisateurs/me/password */
  async changerMotDePasse() {
    await attendre();
    return { message: 'Mot de passe modifié.' };
  },

  /** PUT /utilisateurs/me/email */
  async changerEmail() {
    await attendre();
    return { message: 'Un email de confirmation a été envoyé à la nouvelle adresse.' };
  },

  /** GET /utilisateurs/me/adresses */
  async adresses() {
    await attendre(100);
    return copie(etatAdresses);
  },

  /** POST /utilisateurs/me/adresses */
  async creerAdresse(adresse) {
    await attendre();
    const nouvelle = { ...adresse, id: `adr-${compteurId++}`, est_defaut: etatAdresses.length === 0 };
    etatAdresses.push(nouvelle);
    return copie(nouvelle);
  },

  /** PUT /utilisateurs/me/adresses/:id */
  async modifierAdresse(id, adresse) {
    await attendre();
    const index = etatAdresses.findIndex((a) => a.id === id);
    etatAdresses[index] = { ...etatAdresses[index], ...adresse };
    return copie(etatAdresses[index]);
  },

  /** DELETE /utilisateurs/me/adresses/:id */
  async supprimerAdresse(id) {
    await attendre();
    etatAdresses = etatAdresses.filter((a) => a.id !== id);
  },

  /** PUT /utilisateurs/me/adresses/:id/defaut */
  async adresseDefaut(id) {
    await attendre();
    etatAdresses = etatAdresses.map((a) => ({ ...a, est_defaut: a.id === id }));
  },

  /** GET /utilisateurs/me/paiements */
  async paiements() {
    await attendre(100);
    return copie(etatPaiements);
  },

  /** POST /utilisateurs/me/paiements — ajoute une carte fictive (démo). */
  async ajouterPaiement() {
    await attendre();
    const carte = {
      id: `pm-${compteurId++}`,
      derniers_quatre_chiffres: '4242',
      nom_sur_carte: 'CARTE DEMO',
      mois_expiration: 12,
      annee_expiration: 2030,
      est_defaut: etatPaiements.length === 0,
    };
    etatPaiements.push(carte);
    return copie(carte);
  },

  /** DELETE /utilisateurs/me/paiements/:id */
  async supprimerPaiement(id) {
    await attendre();
    etatPaiements = etatPaiements.filter((p) => p.id !== id);
  },

  /** PUT /utilisateurs/me/paiements/:id/defaut */
  async paiementDefaut(id) {
    await attendre();
    etatPaiements = etatPaiements.map((p) => ({ ...p, est_defaut: p.id === id }));
  },

  // ----- Abonnements -----

  /** GET /abonnements */
  async abonnements() {
    await attendre();
    return copie(etatAbonnements);
  },

  /** POST /abonnements/:id/resilier */
  async resilierAbonnement(id) {
    await attendre();
    etatAbonnements = etatAbonnements.map((a) =>
      a.id === id ? { ...a, renouvellement_auto: false, resiliation_demandee_le: new Date().toISOString() } : a
    );
    return copie(etatAbonnements.find((a) => a.id === id));
  },

  // ----- Commandes -----

  /** GET /commandes */
  async commandes() {
    await attendre();
    return copie(etatCommandes);
  },

  /** GET /commandes/:id */
  async commande(id) {
    await attendre(100);
    return copie(etatCommandes.find((c) => c.id === id));
  },

  /** GET /commandes/:id/facture — non disponible en mode démo (pas de génération PDF côté front). */
  async telechargerFacture() {
    await attendre(100);
    throw new Error('Le téléchargement de facture nécessite le vrai backend (non disponible en mode démo).');
  },

  /**
   * POST /commandes — simule le paiement : la commande est créée
   * et acceptée immédiatement, et les abonnements sont activés.
   */
  async creerCommande({ items, adresse, carte }) {
    await attendre(800);
    const totalHt = items.reduce((somme, item) => somme + item.prix_unitaire_ht * item.quantite, 0);
    const commande = {
      id: `cmd-demo-${compteurId++}`,
      cree_le: new Date().toISOString(),
      statut: 'PAIEMENT_ACCEPTE',
      total_ht: totalHt,
      taux_tva: 20,
      total_ttc: Math.round(totalHt * 1.2 * 100) / 100,
      carte_derniers_chiffres: carte?.derniers_quatre_chiffres || '4242',
      adresse_snapshot: copie(adresse),
      lignes: items.map((item, i) => ({
        id: `ligne-${compteurId}-${i}`,
        produit_nom: item.nom,
        type_abonnement: item.type_abonnement,
        prix_unitaire_ht: item.prix_unitaire_ht,
        quantite: item.quantite,
        prix_total_ht: item.prix_unitaire_ht * item.quantite,
      })),
    };
    etatCommandes.unshift(commande);
    items.forEach((item) => {
      etatAbonnements.push({
        id: `ab-${compteurId++}`,
        produit_id: item.produit_id,
        produit_nom: item.nom,
        statut: 'ACTIF',
        type_abonnement: item.type_abonnement,
        periode_debut: new Date().toISOString(),
        periode_fin: null,
        renouvellement_auto: true,
        resiliation_demandee_le: null,
      });
    });
    return { commande_id: commande.id };
  },

  // ----- Contact -----

  /** POST /contact */
  async contact() {
    await attendre(400);
    return { message: 'Message envoyé. Notre équipe vous répondra sous 24h.' };
  },

  /** POST /contact/chatbot */
  async chatbot() {
    await attendre(200);
    return { message: 'ok' };
  },

  // ----- Back-office (démo) -----
  admin: {
    /** Stats du tableau de bord (valeurs de démonstration). */
    async dashboard(periode = '7j') {
      await attendre(200);
      const parSemaine = periode === '5s';
      const n = parSemaine ? 5 : 7;
      const base = [320, 0, 540, 299, 0, 815, 1200, 760, 0, 499];
      const ventes = Array.from({ length: n }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (n - 1 - i) * (parSemaine ? 7 : 1));
        return { label: d.toISOString().slice(0, 10), total: base[i % base.length] };
      });
      const ventes_par_categorie = adminCategories.map((c, i) => ({
        label: c.nom,
        total: [2870, 1240, 4790][i % 3],
      }));
      return {
        periode,
        ventes,
        ventes_par_categorie,
        kpi: {
          abonnements_actifs: etatAbonnements.filter((a) => a.statut === 'ACTIF').length,
          nouveaux_utilisateurs_7j: 2,
          revenu_periode: ventes.reduce((s, v) => s + v.total, 0),
          commandes_periode: etatCommandes.length,
        },
      };
    },

    // Produits
    async produits(params = {}) {
      await attendre(150);
      let liste = adminProduits.map((p) => ({
        id: p.id, nom: p.nom, is_active: p.is_active, en_maintenance: p.en_maintenance,
        priorite: p.priorite, est_top_produit: p.est_top_produit, categorie_id: p.categorie_id,
        categorie_nom: nomCategorie(p.categorie_id),
        prix_min: p.prix ? Math.min(...p.prix.map((x) => x.montant)) : null,
      }));
      if (params.search) liste = liste.filter((p) => p.nom.toLowerCase().includes(params.search.toLowerCase()));
      if (params.categorie_id) liste = liste.filter((p) => p.categorie_id === Number(params.categorie_id));
      if (params.is_active === 'true' || params.is_active === 'false') liste = liste.filter((p) => p.is_active === (params.is_active === 'true'));
      return paginer(liste.sort((a, b) => (b.priorite || 0) - (a.priorite || 0)), params);
    },
    async produit(id) {
      await attendre(100);
      const p = adminProduits.find((x) => x.id === Number(id));
      return { ...copie(p), images: [] };
    },
    async creerProduit(b) {
      await attendre();
      const nouveau = { id: compteurId++, images: [], prix: b.prix || [], ...b };
      adminProduits.push(nouveau);
      return copie(nouveau);
    },
    async modifierProduit(id, b) {
      await attendre();
      const p = adminProduits.find((x) => x.id === Number(id));
      Object.assign(p, b);
      return copie(p);
    },
    async supprimerProduit(id) {
      await attendre();
      adminProduits = adminProduits.filter((x) => x.id !== Number(id));
      return { message: 'Produit supprimé' };
    },
    async ajouterPrix(id, b) {
      await attendre();
      const p = adminProduits.find((x) => x.id === Number(id));
      const prix = { id: `prix-${compteurId++}`, is_active: true, ...b };
      (p.prix = p.prix || []).push(prix);
      return copie(prix);
    },
    async modifierPrix() { await attendre(); return { message: 'ok' }; },
    async supprimerPrix() { await attendre(); return { message: 'Prix supprimé' }; },

    // Catégories
    async categories() {
      await attendre(100);
      return adminCategories.map((c) => ({
        ...copie(c), nb_produits: adminProduits.filter((p) => p.categorie_id === c.id).length,
      }));
    },
    async creerCategorie(b) {
      await attendre();
      const c = { id: compteurId++, is_active: true, ordre_affichage: 0, ...b };
      adminCategories.push(c);
      return copie(c);
    },
    async modifierCategorie(id, b) {
      await attendre();
      const c = adminCategories.find((x) => x.id === Number(id));
      Object.assign(c, b);
      return copie(c);
    },
    async supprimerCategorie(id) {
      await attendre();
      adminCategories = adminCategories.filter((x) => x.id !== Number(id));
      return { message: 'Catégorie supprimée' };
    },
    async reordonnerCategories(ordres) {
      await attendre();
      ordres.forEach(({ id, ordre_affichage }) => {
        const c = adminCategories.find((x) => x.id === id);
        if (c) c.ordre_affichage = ordre_affichage;
      });
      adminCategories.sort((a, b) => a.ordre_affichage - b.ordre_affichage);
      return { message: 'ok' };
    },

    // Carrousel
    async carrousel() { await attendre(100); return copie(adminCarrousel); },
    async creerSlide(b) {
      await attendre();
      const s = { id: `slide-${compteurId++}`, is_active: true, ordre_affichage: 0, ...b };
      adminCarrousel.push(s);
      return copie(s);
    },
    async modifierSlide(id, b) {
      await attendre();
      const s = adminCarrousel.find((x) => x.id === id);
      Object.assign(s, b);
      return copie(s);
    },
    async supprimerSlide(id) {
      await attendre();
      adminCarrousel = adminCarrousel.filter((x) => x.id !== id);
      return { message: 'Slide supprimée' };
    },

    // Contenu accueil
    async accueil() {
      await attendre(100);
      return Object.entries(adminContenu).map(([cle, valeur]) => ({ cle, valeur }));
    },
    async modifierAccueil(cle, valeur) {
      await attendre();
      adminContenu[cle] = valeur;
      return { cle, valeur };
    },

    // Utilisateurs
    async utilisateurs(params = {}) {
      await attendre(150);
      let liste = copie(adminUtilisateurs);
      if (params.search) {
        const q = params.search.toLowerCase();
        liste = liste.filter((u) => u.email.toLowerCase().includes(q) || u.nom.toLowerCase().includes(q) || u.prenom.toLowerCase().includes(q));
      }
      return paginer(liste, params);
    },
    async utilisateur(id) {
      await attendre(100);
      const u = adminUtilisateurs.find((x) => x.id === id);
      return { ...copie(u), commandes: copie(etatCommandes), abonnements: copie(etatAbonnements) };
    },
    async modifierUtilisateur(id, b) {
      await attendre();
      const u = adminUtilisateurs.find((x) => x.id === id);
      Object.assign(u, b);
      return copie(u);
    },
    async anonymiserUtilisateur(id) {
      await attendre();
      const u = adminUtilisateurs.find((x) => x.id === id);
      if (u) { u.nom = 'Anonyme'; u.prenom = 'Utilisateur'; u.email = `anonyme-${id}@cyna.invalid`; }
      return { message: 'Utilisateur anonymisé' };
    },

    // Commandes
    async commandes(params = {}) {
      await attendre(150);
      let liste = etatCommandes.map((c) => ({
        id: c.id, total_ttc: c.total_ttc, statut: c.statut, cree_le: c.cree_le,
        email: 'demo@cyna-it.fr', nom: 'Dupont', prenom: 'Marie',
      }));
      if (params.statut) liste = liste.filter((c) => c.statut === params.statut);
      return paginer(liste, params);
    },
    async commande(id) {
      await attendre(100);
      const c = etatCommandes.find((x) => x.id === id);
      return { ...copie(c), email: 'demo@cyna-it.fr', nom: 'Dupont', prenom: 'Marie', facture: { numero_facture: 'FACT-2026-00001' } };
    },
    async telechargerFacture() {
      await attendre(100);
      throw new Error('Le téléchargement de facture nécessite le vrai backend (non disponible en mode démo).');
    },

    // Abonnements
    async abonnements(params = {}) {
      await attendre(150);
      let liste = etatAbonnements.map((a) => ({
        id: a.id, statut: a.statut, type_abonnement: a.type_abonnement,
        periode_debut: a.periode_debut, periode_fin: a.periode_fin,
        produit_nom: a.produit_nom, email: 'demo@cyna-it.fr',
      }));
      if (params.statut) liste = liste.filter((a) => a.statut === params.statut);
      return paginer(liste, params);
    },
    async changerStatutAbonnement(id, statut) {
      await attendre();
      const a = etatAbonnements.find((x) => x.id === id);
      if (a) a.statut = statut;
      return copie(a);
    },

    // Messages
    async messages(params = {}) {
      await attendre(150);
      let liste = copie(adminMessages);
      if (params.statut) liste = liste.filter((m) => m.statut === params.statut);
      if (params.source) liste = liste.filter((m) => m.source === params.source);
      return paginer(liste, params);
    },
    async message(id) {
      await attendre(100);
      return copie(adminMessages.find((x) => x.id === id));
    },
    async changerStatutMessage(id, statut) {
      await attendre();
      const m = adminMessages.find((x) => x.id === id);
      if (m) m.statut = statut;
      return copie(m);
    },
  },
};

/** Pagination utilitaire pour le mock back-office. */
function paginer(liste, params = {}) {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const total = liste.length;
  const debut = (page - 1) * limit;
  return { data: liste.slice(debut, debut + limit), pagination: { page, limit, total } };
}
