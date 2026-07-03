const { validationResult } = require('express-validator');

/**
 * Enveloppe des règles express-validator : exécute les règles puis
 * renvoie 400 avec le premier message d'erreur si la validation échoue.
 * @param {Array} regles - Chaînes de validation express-validator
 * @returns {Array} Middlewares à passer à la route
 */
function validate(regles) {
  return [
    ...regles,
    (req, res, next) => {
      const erreurs = validationResult(req);
      if (!erreurs.isEmpty()) {
        return res.status(400).json({ error: erreurs.array()[0].msg });
      }
      next();
    },
  ];
}

module.exports = validate;
