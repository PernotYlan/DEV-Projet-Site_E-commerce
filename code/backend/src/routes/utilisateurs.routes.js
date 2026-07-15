const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/auth');
const utilisateursController = require('../controllers/utilisateurs.controller');

const router = express.Router();

// Toutes les routes utilisateurs nécessitent un access token valide
router.use(verifyToken);

/** Règle de mot de passe fort (identique à l'inscription). */
const motDePasseFort = (champ) =>
  body(champ)
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    .withMessage(
      'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
    );

/** Règles de validation d'une adresse (création et modification). */
const reglesAdresse = [
  body('prenom').trim().notEmpty().withMessage('Le prénom est obligatoire'),
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire'),
  body('adresse_ligne1').trim().notEmpty().withMessage("L'adresse est obligatoire"),
  body('adresse_ligne2').optional({ values: 'falsy' }).trim(),
  body('ville').trim().notEmpty().withMessage('La ville est obligatoire'),
  body('region').optional({ values: 'falsy' }).trim(),
  body('code_postal').trim().notEmpty().withMessage('Le code postal est obligatoire'),
  body('pays').trim().notEmpty().withMessage('Le pays est obligatoire'),
  body('telephone').trim().notEmpty().withMessage('Le téléphone est obligatoire'),
];

/** Valide que :id est un UUID. */
const idUuid = param('id').isUUID().withMessage('Identifiant invalide');

router.get('/me', utilisateursController.getMe);

router.put(
  '/me',
  validate([
    body('nom').trim().notEmpty().withMessage('Le nom est obligatoire'),
    body('prenom').trim().notEmpty().withMessage('Le prénom est obligatoire'),
    body('telephone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }).withMessage('Téléphone invalide'),
  ]),
  utilisateursController.updateMe
);

router.put(
  '/me/email',
  validate([
    body('nouvel_email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
    body('mot_de_passe').notEmpty().withMessage('Le mot de passe est obligatoire'),
  ]),
  utilisateursController.changerEmail
);

router.get(
  '/me/confirm-email-change',
  validate([query('token').notEmpty().withMessage('Token manquant')]),
  utilisateursController.confirmerChangementEmail
);

router.put(
  '/me/password',
  validate([
    body('mot_de_passe_actuel').notEmpty().withMessage('Le mot de passe actuel est obligatoire'),
    motDePasseFort('nouveau_mot_de_passe'),
  ]),
  utilisateursController.changerMotDePasse
);

router.delete('/me', utilisateursController.supprimerCompte);

router.get('/me/adresses', utilisateursController.listerAdresses);
router.post('/me/adresses', validate(reglesAdresse), utilisateursController.creerAdresse);
router.put('/me/adresses/:id', validate([idUuid, ...reglesAdresse]), utilisateursController.modifierAdresse);
router.delete('/me/adresses/:id', validate([idUuid]), utilisateursController.supprimerAdresse);
router.put('/me/adresses/:id/defaut', validate([idUuid]), utilisateursController.definirAdresseDefaut);

// Méthodes de paiement (cartes Stripe)
router.get('/me/paiements', utilisateursController.listerPaiements);
router.post(
  '/me/paiements',
  validate([body('stripe_payment_method_id').trim().notEmpty().withMessage('Moyen de paiement manquant')]),
  utilisateursController.ajouterPaiement
);
router.delete('/me/paiements/:id', validate([idUuid]), utilisateursController.supprimerPaiement);
router.put('/me/paiements/:id/defaut', validate([idUuid]), utilisateursController.definirPaiementDefaut);

module.exports = router;
