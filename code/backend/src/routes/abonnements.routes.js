const express = require('express');
const { param } = require('express-validator');
const validate = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/auth');
const abonnementsController = require('../controllers/abonnements.controller');

const router = express.Router();
router.use(verifyToken);

const idUuid = param('id').isUUID().withMessage('Identifiant invalide');

router.get('/', abonnementsController.lister);
router.get('/:id', validate([idUuid]), abonnementsController.detail);
router.post('/:id/resilier', validate([idUuid]), abonnementsController.resilier);

module.exports = router;
