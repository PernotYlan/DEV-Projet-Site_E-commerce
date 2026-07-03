const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/auth');
const commandesController = require('../controllers/commandes.controller');

const router = express.Router();
router.use(verifyToken);

router.post(
  '/',
  validate([
    body('adresse_id').isUUID().withMessage('Adresse invalide'),
    body('methode_paiement_id').optional({ values: 'null' }).isUUID().withMessage('Moyen de paiement invalide'),
    body('items').isArray({ min: 1 }).withMessage('Le panier est vide'),
    body('items.*.produit_id').isInt().withMessage('Produit invalide'),
    body('items.*.prix_id').isUUID().withMessage('Prix invalide'),
    body('items.*.quantite').optional().isInt({ min: 1 }).withMessage('Quantité invalide'),
  ]),
  commandesController.creer
);

router.get('/', commandesController.lister);
router.get('/:id', validate([param('id').isUUID().withMessage('Identifiant invalide')]), commandesController.detail);

module.exports = router;
