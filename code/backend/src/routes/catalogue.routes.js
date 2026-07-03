const express = require('express');
const { param } = require('express-validator');
const validate = require('../middlewares/validate');
const catalogueController = require('../controllers/catalogue.controller');

const router = express.Router();

// Routes publiques du catalogue
router.get('/accueil', catalogueController.accueil);
router.get('/categories', catalogueController.categories);
router.get(
  '/categories/:id/produits',
  validate([param('id').isInt().withMessage('Catégorie invalide')]),
  catalogueController.categorieProduits
);

// /produits/recherche AVANT /produits/:id pour éviter le conflit de route
router.get('/produits/recherche', catalogueController.recherche);
router.get(
  '/produits/:id',
  validate([param('id').isInt().withMessage('Produit invalide')]),
  catalogueController.produit
);

module.exports = router;
