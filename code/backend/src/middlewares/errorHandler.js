/**
 * Crée une erreur avec un code HTTP attaché (à passer à next()).
 * @param {number} status - Code HTTP (400, 401, 403, 404, 409...)
 * @param {string} message - Message renvoyé au client
 * @returns {Error}
 */
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Handler global d'erreurs : renvoie { error } avec le bon code HTTP.
 * Les erreurs 500 sont loguées côté serveur sans exposer le détail au client.
 */
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status === 500) {
    console.error(err);
  }
  const message = status === 500 ? 'Erreur interne du serveur' : err.message;
  res.status(status).json({ error: message });
}

module.exports = { httpError, errorHandler };
