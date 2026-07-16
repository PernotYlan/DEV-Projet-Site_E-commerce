const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middlewares/validate');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const c = require('../controllers/admin.controller');

const router = express.Router();

// Toutes les routes admin exigent un token valide + le rôle ADMIN
router.use(verifyToken, requireAdmin);

const uuid = (n = 'id') => param(n).isUUID().withMessage('Identifiant invalide');
const entier = (n = 'id') => param(n).isInt().withMessage('Identifiant invalide');

// ----- Dashboard -----
router.get('/dashboard/stats', c.dashboard);

// ----- Produits -----
router.get('/produits', c.listerProduits);
router.post(
  '/produits',
  validate([
    body('nom').trim().notEmpty().withMessage('Le nom est obligatoire'),
    body('categorie_id').isInt().withMessage('Catégorie invalide'),
  ]),
  c.creerProduit
);
router.delete(
  '/produits',
  validate([body('ids').isArray({ min: 1 }).withMessage('Liste d’identifiants requise')]),
  c.supprimerProduits
);
router.get('/produits/:id', validate([entier()]), c.getProduit);
router.put('/produits/:id', validate([entier()]), c.modifierProduit);
router.delete('/produits/:id', validate([entier()]), c.supprimerProduit);

router.post('/produits/:id/images', validate([entier(), body('image_url').notEmpty()]), c.ajouterImage);
router.delete('/produits/:id/images/:imageId', validate([entier(), entier('imageId')]), c.supprimerImage);
router.put('/produits/:id/images/ordre', validate([entier(), body().isArray()]), c.reordonnerImages);

router.post(
  '/produits/:id/prix',
  validate([entier(), body('type_abonnement').isIn(['MENSUEL', 'SEMESTRIEL', 'ANNUEL']), body('montant').isFloat({ min: 0 })]),
  c.ajouterPrix
);
router.put('/prix/:id', validate([uuid()]), c.modifierPrix);
router.delete('/prix/:id', validate([uuid()]), c.supprimerPrix);

// ----- Catégories ----- (/ordre AVANT /:id)
router.get('/categories', c.listerCategories);
router.post('/categories', validate([body('nom').trim().notEmpty().withMessage('Le nom est obligatoire')]), c.creerCategorie);
router.put('/categories/ordre', validate([body().isArray()]), c.reordonnerCategories);
router.get('/categories/:id', validate([entier()]), c.getCategorie);
router.put('/categories/:id', validate([entier()]), c.modifierCategorie);
router.delete('/categories/:id', validate([entier()]), c.supprimerCategorie);

// ----- Carrousel ----- (/ordre AVANT /:id)
router.get('/carrousel', c.listerCarrousel);
router.post('/carrousel', validate([body('img_url').notEmpty().withMessage('Image obligatoire')]), c.creerSlide);
router.put('/carrousel/ordre', validate([body().isArray()]), c.reordonnerCarrousel);
router.put('/carrousel/:id', validate([uuid()]), c.modifierSlide);
router.delete('/carrousel/:id', validate([uuid()]), c.supprimerSlide);

// ----- Contenu accueil -----
router.get('/accueil', c.listerAccueil);
router.put('/accueil/:cle', validate([body('valeur').exists().withMessage('Valeur obligatoire')]), c.modifierAccueil);

// ----- Utilisateurs -----
router.get('/utilisateurs', c.listerUtilisateurs);
router.get('/utilisateurs/:id', validate([uuid()]), c.getUtilisateur);
router.put('/utilisateurs/:id', validate([uuid()]), c.modifierUtilisateur);
router.delete('/utilisateurs/:id', validate([uuid()]), c.anonymiserUtilisateur);

// ----- Commandes -----
router.get('/commandes', c.listerCommandes);
router.get('/commandes/:id', validate([uuid()]), c.getCommande);
router.get('/commandes/:id/facture', validate([uuid()]), c.telechargerFactureCommande);

// ----- Abonnements -----
router.get('/abonnements', c.listerAbonnements);
router.get('/abonnements/:id', validate([uuid()]), c.getAbonnement);
router.put(
  '/abonnements/:id/statut',
  validate([uuid(), body('statut').isIn(['ACTIF', 'SUSPENDU', 'RESILIE', 'PAST_DUE'])]),
  c.changerStatutAbonnement
);

// ----- Messages -----
router.get('/messages', c.listerMessages);
router.get('/messages/:id', validate([uuid()]), c.getMessage);
router.put(
  '/messages/:id/statut',
  validate([uuid(), body('statut').isIn(['NOUVEAU', 'EN_COURS', 'TRAITE', 'FERME'])]),
  c.changerStatutMessage
);

module.exports = router;
