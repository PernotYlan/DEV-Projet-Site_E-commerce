const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const contactController = require('../controllers/contact.controller');

const router = express.Router();

router.post(
  '/',
  validate([
    body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
    body('message').trim().notEmpty().withMessage('Le message est obligatoire'),
    body('sujet').optional({ values: 'falsy' }).trim(),
  ]),
  contactController.formulaire
);

router.post(
  '/chatbot',
  validate([
    body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
    body('message').trim().notEmpty().withMessage('Le message est obligatoire'),
  ]),
  contactController.chatbot
);

module.exports = router;
