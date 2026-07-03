const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { httpError } = require('./errorHandler');

/**
 * Vérifie l'access token JWT (header "Authorization: Bearer <token>")
 * et attache { id, role } à req.user.
 */
function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return next(httpError(401, 'Authentification requise'));
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    next(httpError(401, 'Token invalide ou expiré'));
  }
}

/** Restreint la route aux administrateurs (à utiliser après verifyToken). */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(httpError(403, 'Accès réservé aux administrateurs'));
  }
  next();
}

module.exports = { verifyToken, requireAdmin };
