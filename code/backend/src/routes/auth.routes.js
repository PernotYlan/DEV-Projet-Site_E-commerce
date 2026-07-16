const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, query } = require('express-validator');
const validate = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');

const router = express.Router();

/** Règle de mot de passe fort : 8+ caractères, majuscule, minuscule, chiffre, spécial. */
const motDePasseFort = (champ) =>
  body(champ)
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    .withMessage(
      'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
    );

/** Limite : 5 inscriptions / heure / IP. */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives d’inscription, réessayez plus tard' },
});

/** Limite : 10 connexions / 15 min / IP. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion, réessayez plus tard' },
});

/** Limite : 10 vérifications de code 2FA / 15 min / IP (anti brute-force sur le code à 6 chiffres). */
const deuxFaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, réessayez plus tard' },
});

router.post(
  '/register',
  registerLimiter,
  validate([
    body('nom').trim().notEmpty().withMessage('Le nom est obligatoire'),
    body('prenom').trim().notEmpty().withMessage('Le prénom est obligatoire'),
    body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
    motDePasseFort('mot_de_passe'),
  ]),
  authController.register
);

router.get(
  '/confirm-email',
  validate([query('token').notEmpty().withMessage('Token manquant')]),
  authController.confirmEmail
);

router.post(
  '/login',
  loginLimiter,
  validate([
    body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
    body('mot_de_passe').notEmpty().withMessage('Le mot de passe est obligatoire'),
    body('se_souvenir').optional().isBoolean().withMessage('se_souvenir doit être un booléen'),
  ]),
  authController.login
);

router.post(
  '/verifier-2fa',
  deuxFaLimiter,
  validate([
    body('pre_auth_token').notEmpty().withMessage('Session de connexion manquante'),
    body('code').matches(/^\d{6}$/).withMessage('Le code doit contenir 6 chiffres'),
  ]),
  authController.verifier2FA
);

router.post('/refresh', authController.refresh);

router.post('/logout', authController.logout);

router.post(
  '/forgot-password',
  validate([body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail()]),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Token manquant'),
    motDePasseFort('nouveau_mot_de_passe'),
  ]),
  authController.resetPassword
);

module.exports = router;
