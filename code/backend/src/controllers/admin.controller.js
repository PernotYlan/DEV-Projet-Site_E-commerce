const cat = require('../services/admin.catalogue.service');
const gestion = require('../services/admin.gestion.service');

/* Helpers pour réduire le boilerplate des handlers admin. */

/** Handler renvoyant { data: <résultat> } avec un code HTTP (200 par défaut). */
const h = (fn, status = 200) => async (req, res, next) => {
  try {
    res.status(status).json({ data: await fn(req) });
  } catch (err) {
    next(err);
  }
};

/** Handler pour les listes paginées (le service renvoie déjà { data, pagination }). */
const hList = (fn) => async (req, res, next) => {
  try {
    res.status(200).json(await fn(req));
  } catch (err) {
    next(err);
  }
};

/** GET /api/admin/commandes/:id/facture — télécharge la facture PDF (accès admin). */
async function telechargerFactureCommande(req, res, next) {
  try {
    const { buffer, numeroFacture } = await gestion.telechargerFacture(req.params.id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${numeroFacture}.pdf"`,
    });
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // ----- Dashboard -----
  dashboard: h((req) => gestion.dashboardStats(req.query.periode)),

  // ----- Produits -----
  listerProduits: hList((req) => cat.listerProduits(req.query)),
  getProduit: h((req) => cat.getProduit(req.params.id)),
  creerProduit: h((req) => cat.creerProduit(req.body), 201),
  modifierProduit: h((req) => cat.modifierProduit(req.params.id, req.body)),
  supprimerProduit: h(async (req) => {
    await cat.supprimerProduit(req.params.id);
    return { message: 'Produit supprimé' };
  }),
  ajouterImage: h((req) => cat.ajouterImage(req.params.id, req.body), 201),
  supprimerImage: h(async (req) => {
    await cat.supprimerImage(req.params.id, req.params.imageId);
    return { message: 'Image supprimée' };
  }),
  reordonnerImages: h(async (req) => {
    await cat.reordonnerImages(req.params.id, req.body);
    return { message: 'Ordre mis à jour' };
  }),
  ajouterPrix: h((req) => cat.ajouterPrix(req.params.id, req.body), 201),
  modifierPrix: h((req) => cat.modifierPrix(req.params.id, req.body)),
  supprimerPrix: h(async (req) => {
    await cat.supprimerPrix(req.params.id);
    return { message: 'Prix supprimé' };
  }),

  // ----- Catégories -----
  listerCategories: h((req) => cat.listerCategories()),
  getCategorie: h((req) => cat.getCategorie(req.params.id)),
  creerCategorie: h((req) => cat.creerCategorie(req.body), 201),
  modifierCategorie: h((req) => cat.modifierCategorie(req.params.id, req.body)),
  supprimerCategorie: h(async (req) => {
    await cat.supprimerCategorie(req.params.id);
    return { message: 'Catégorie supprimée' };
  }),
  reordonnerCategories: h(async (req) => {
    await cat.reordonnerCategories(req.body);
    return { message: 'Ordre mis à jour' };
  }),

  // ----- Carrousel -----
  listerCarrousel: h((req) => cat.listerCarrousel()),
  creerSlide: h((req) => cat.creerSlide(req.body), 201),
  modifierSlide: h((req) => cat.modifierSlide(req.params.id, req.body)),
  supprimerSlide: h(async (req) => {
    await cat.supprimerSlide(req.params.id);
    return { message: 'Slide supprimée' };
  }),
  reordonnerCarrousel: h(async (req) => {
    await cat.reordonnerCarrousel(req.body);
    return { message: 'Ordre mis à jour' };
  }),

  // ----- Contenu accueil -----
  listerAccueil: h((req) => cat.listerContenuAccueil()),
  modifierAccueil: h((req) => cat.modifierContenuAccueil(req.params.cle, req.body.valeur)),

  // ----- Utilisateurs -----
  listerUtilisateurs: hList((req) => gestion.listerUtilisateurs(req.query)),
  getUtilisateur: h((req) => gestion.getUtilisateur(req.params.id)),
  modifierUtilisateur: h((req) => gestion.modifierUtilisateur(req.params.id, req.body)),
  anonymiserUtilisateur: h(async (req) => {
    await gestion.anonymiserUtilisateur(req.params.id);
    return { message: 'Utilisateur anonymisé' };
  }),

  // ----- Commandes -----
  listerCommandes: hList((req) => gestion.listerCommandes(req.query)),
  getCommande: h((req) => gestion.getCommande(req.params.id)),
  telechargerFactureCommande,

  // ----- Abonnements -----
  listerAbonnements: hList((req) => gestion.listerAbonnements(req.query)),
  getAbonnement: h((req) => gestion.getAbonnement(req.params.id)),
  changerStatutAbonnement: h((req) => gestion.changerStatutAbonnement(req.params.id, req.body.statut)),

  // ----- Messages -----
  listerMessages: hList((req) => gestion.listerMessages(req.query)),
  getMessage: h((req) => gestion.getMessage(req.params.id)),
  changerStatutMessage: h((req) => gestion.changerStatutMessage(req.params.id, req.body.statut, req.user.id)),
};
