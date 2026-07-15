const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const { httpError } = require('../middlewares/errorHandler');
const emailService = require('./email.service');

/** Nombre de rounds bcrypt pour le hash des mots de passe. */
const SALT_ROUNDS = 10;

/** Retourne le hash SHA-256 (hex) d'un token, pour stockage en BDD. */
function sha256(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Génère un token aléatoire, stocke son hash dans Tokens_Email (expire +24h)
 * et retourne le token en clair (à envoyer par email).
 * @param {string} utilisateurId - UUID de l'utilisateur
 * @param {string} type - Type de token (CONFIRMATION_INSCRIPTION, RESET_MOT_DE_PASSE...)
 * @returns {Promise<string>} Token en clair
 */
async function creerTokenEmail(utilisateurId, type) {
  const token = crypto.randomBytes(32).toString('hex');
  await db.query(
    `INSERT INTO Tokens_Email (utilisateur_id, token_hash, type, expire_le)
     VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
    [utilisateurId, sha256(token), type]
  );
  return token;
}

/** Génère l'access token JWT (courte durée). */
function genererAccessToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/** Génère le refresh token JWT (longue durée, stocké en cookie httpOnly). */
function genererRefreshToken(user) {
  return jwt.sign({ id: user.id }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
}

/**
 * Inscrit un nouvel utilisateur (email_verifie = false) et envoie
 * l'email de confirmation d'inscription.
 * @param {{nom: string, prenom: string, email: string, mot_de_passe: string}} donnees
 */
async function register({ nom, prenom, email, mot_de_passe }) {
  const existant = await db.query('SELECT id FROM Utilisateurs WHERE email = $1', [email]);
  if (existant.rows.length > 0) {
    throw httpError(409, 'Un compte existe déjà avec cet email');
  }

  const hash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);
  const resultat = await db.query(
    `INSERT INTO Utilisateurs (nom, prenom, email, mdp_hash)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [nom, prenom, email, hash]
  );

  const token = await creerTokenEmail(resultat.rows[0].id, 'CONFIRMATION_INSCRIPTION');
  // L'échec d'envoi (SMTP down/mal configuré) ne doit pas faire échouer
  // l'inscription : le compte existe déjà en base à ce stade.
  await emailService.envoyerConfirmationInscription(email, token).catch((err) => {
    console.error('Échec envoi email de confirmation inscription :', err.message);
  });
}

/**
 * Confirme l'email d'un utilisateur via le token reçu par email.
 * @param {string} token - Token en clair issu du lien de confirmation
 */
async function confirmEmail(token) {
  const resultat = await db.query(
    `SELECT id, utilisateur_id FROM Tokens_Email
     WHERE token_hash = $1 AND type = 'CONFIRMATION_INSCRIPTION'
       AND utilise = FALSE AND expire_le > NOW()`,
    [sha256(token)]
  );
  const ligne = resultat.rows[0];
  if (!ligne) {
    throw httpError(400, 'Lien de confirmation invalide ou expiré');
  }

  await db.query('UPDATE Utilisateurs SET email_verifie = TRUE WHERE id = $1', [ligne.utilisateur_id]);
  await db.query('UPDATE Tokens_Email SET utilise = TRUE WHERE id = $1', [ligne.id]);
}

/**
 * Authentifie un utilisateur et génère les tokens.
 * Si se_souvenir = true, le hash du refresh token est stocké dans Sessions.
 * @param {{email: string, mot_de_passe: string, se_souvenir?: boolean}} donnees
 * @param {{ip: string, userAgent: string}} meta - Infos de la requête
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
async function login({ email, mot_de_passe, se_souvenir }, meta) {
  const resultat = await db.query('SELECT * FROM Utilisateurs WHERE email = $1', [email]);
  const user = resultat.rows[0];

  // Message générique pour ne pas révéler si l'email existe
  const mdpOk = user && user.mdp_hash && (await bcrypt.compare(mot_de_passe, user.mdp_hash));
  if (!mdpOk) {
    throw httpError(401, 'Email ou mot de passe incorrect');
  }
  if (!user.email_verifie) {
    throw httpError(403, 'Veuillez confirmer votre email avant de vous connecter');
  }

  const accessToken = genererAccessToken(user);
  const refreshToken = genererRefreshToken(user);

  if (se_souvenir) {
    await db.query(
      `INSERT INTO Sessions (utilisateur_id, token_hash, expire_le, ip_address, user_agent)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
      [user.id, sha256(refreshToken), meta.ip, meta.userAgent]
    );
  }

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Vérifie le refresh token (signature JWT + session BDD éventuelle)
 * et retourne un nouvel access token.
 * @param {string} refreshToken - Token lu depuis le cookie httpOnly
 * @returns {Promise<string>} Nouvel access token
 */
async function refresh(refreshToken) {
  if (!refreshToken) {
    throw httpError(401, 'Refresh token manquant');
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    throw httpError(401, 'Refresh token invalide ou expiré');
  }

  // Si une session "se souvenir de moi" existe en BDD, elle doit être encore valide
  const session = await db.query('SELECT expire_le FROM Sessions WHERE token_hash = $1', [
    sha256(refreshToken),
  ]);
  if (session.rows.length > 0 && new Date(session.rows[0].expire_le) < new Date()) {
    throw httpError(401, 'Session expirée, veuillez vous reconnecter');
  }

  const resultat = await db.query('SELECT id, role FROM Utilisateurs WHERE id = $1', [payload.id]);
  const user = resultat.rows[0];
  if (!user) {
    throw httpError(401, 'Utilisateur introuvable');
  }

  return genererAccessToken(user);
}

/**
 * Déconnecte l'utilisateur : supprime la session BDD liée au refresh token.
 * @param {string} refreshToken - Token lu depuis le cookie (peut être absent)
 */
async function logout(refreshToken) {
  if (refreshToken) {
    await db.query('DELETE FROM Sessions WHERE token_hash = $1', [sha256(refreshToken)]);
  }
}

/**
 * Envoie un email de réinitialisation si le compte existe.
 * Ne lève jamais d'erreur liée à l'existence de l'email (anti-énumération).
 * @param {string} email - Adresse email saisie
 */
async function forgotPassword(email) {
  const resultat = await db.query('SELECT id FROM Utilisateurs WHERE email = $1', [email]);
  const user = resultat.rows[0];
  if (!user) {
    return; // réponse 200 dans tous les cas
  }
  const token = await creerTokenEmail(user.id, 'RESET_MOT_DE_PASSE');
  await emailService.envoyerResetMotDePasse(email, token).catch((err) => {
    console.error('Échec envoi email de réinitialisation :', err.message);
  });
}

/**
 * Réinitialise le mot de passe via un token RESET_MOT_DE_PASSE valide.
 * @param {string} token - Token en clair issu du lien email
 * @param {string} nouveauMotDePasse - Nouveau mot de passe en clair
 */
async function resetPassword(token, nouveauMotDePasse) {
  const resultat = await db.query(
    `SELECT id, utilisateur_id FROM Tokens_Email
     WHERE token_hash = $1 AND type = 'RESET_MOT_DE_PASSE'
       AND utilise = FALSE AND expire_le > NOW()`,
    [sha256(token)]
  );
  const ligne = resultat.rows[0];
  if (!ligne) {
    throw httpError(400, 'Lien de réinitialisation invalide ou expiré');
  }

  const hash = await bcrypt.hash(nouveauMotDePasse, SALT_ROUNDS);
  await db.query('UPDATE Utilisateurs SET mdp_hash = $1 WHERE id = $2', [hash, ligne.utilisateur_id]);
  await db.query('UPDATE Tokens_Email SET utilise = TRUE WHERE id = $1', [ligne.id]);
}

module.exports = {
  register,
  confirmEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  creerTokenEmail,
  sha256,
  SALT_ROUNDS,
};
