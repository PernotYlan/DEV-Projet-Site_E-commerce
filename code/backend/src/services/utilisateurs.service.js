const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const { httpError } = require('../middlewares/errorHandler');
const emailService = require('./email.service');
const { sha256, SALT_ROUNDS } = require('./auth.service');

/** Colonnes utilisateur renvoyées au client (jamais mdp_hash, d2f_secret). */
const COLONNES_PUBLIQUES = 'id, nom, prenom, email, telephone, role, email_verifie, is_d2f_actif, cree_le';

/**
 * Retourne le profil de l'utilisateur connecté (sans champs sensibles).
 * @param {string} userId - UUID de l'utilisateur
 */
async function getMe(userId) {
  const resultat = await db.query(`SELECT ${COLONNES_PUBLIQUES} FROM Utilisateurs WHERE id = $1`, [userId]);
  const user = resultat.rows[0];
  if (!user) {
    throw httpError(404, 'Utilisateur introuvable');
  }
  return user;
}

/**
 * Met à jour nom, prénom et téléphone de l'utilisateur connecté.
 * @param {string} userId - UUID de l'utilisateur
 * @param {{nom: string, prenom: string, telephone?: string}} donnees
 */
async function updateMe(userId, { nom, prenom, telephone }) {
  const resultat = await db.query(
    `UPDATE Utilisateurs SET nom = $1, prenom = $2, telephone = $3
     WHERE id = $4 RETURNING ${COLONNES_PUBLIQUES}`,
    [nom, prenom, telephone || null, userId]
  );
  return resultat.rows[0];
}

/**
 * Demande un changement d'email : vérifie le mot de passe, génère un token
 * CHANGEMENT_EMAIL (JWT contenant le nouvel email) et envoie l'email de
 * confirmation à la NOUVELLE adresse.
 * @param {string} userId - UUID de l'utilisateur
 * @param {string} nouvelEmail - Nouvelle adresse souhaitée
 * @param {string} motDePasse - Mot de passe actuel (re-vérification)
 */
async function demanderChangementEmail(userId, nouvelEmail, motDePasse) {
  const resultat = await db.query('SELECT mdp_hash FROM Utilisateurs WHERE id = $1', [userId]);
  const user = resultat.rows[0];
  if (!user || !user.mdp_hash || !(await bcrypt.compare(motDePasse, user.mdp_hash))) {
    throw httpError(401, 'Mot de passe incorrect');
  }

  const dejaPris = await db.query('SELECT id FROM Utilisateurs WHERE email = $1', [nouvelEmail]);
  if (dejaPris.rows.length > 0) {
    throw httpError(409, 'Cet email est déjà utilisé');
  }

  // Le token est un JWT signé : il transporte le nouvel email sans colonne BDD
  // supplémentaire. Son hash est stocké pour garantir l'usage unique.
  const token = jwt.sign({ id: userId, email: nouvelEmail }, env.jwtSecret, { expiresIn: '24h' });
  await db.query(
    `INSERT INTO Tokens_Email (utilisateur_id, token_hash, type, expire_le)
     VALUES ($1, $2, 'CHANGEMENT_EMAIL', NOW() + INTERVAL '24 hours')`,
    [userId, sha256(token)]
  );
  await emailService.envoyerConfirmationChangementEmail(nouvelEmail, token);
}

/**
 * Confirme le changement d'email via le token reçu sur la nouvelle adresse.
 * @param {string} token - Token en clair issu du lien email
 */
async function confirmerChangementEmail(token) {
  const resultat = await db.query(
    `SELECT id FROM Tokens_Email
     WHERE token_hash = $1 AND type = 'CHANGEMENT_EMAIL'
       AND utilise = FALSE AND expire_le > NOW()`,
    [sha256(token)]
  );
  const ligne = resultat.rows[0];
  if (!ligne) {
    throw httpError(400, 'Lien de confirmation invalide ou expiré');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw httpError(400, 'Lien de confirmation invalide ou expiré');
  }

  const dejaPris = await db.query('SELECT id FROM Utilisateurs WHERE email = $1', [payload.email]);
  if (dejaPris.rows.length > 0) {
    throw httpError(409, 'Cet email est déjà utilisé');
  }

  await db.query('UPDATE Utilisateurs SET email = $1 WHERE id = $2', [payload.email, payload.id]);
  await db.query('UPDATE Tokens_Email SET utilise = TRUE WHERE id = $1', [ligne.id]);
}

/**
 * Change le mot de passe après vérification de l'ancien.
 * @param {string} userId - UUID de l'utilisateur
 * @param {string} motDePasseActuel - Ancien mot de passe
 * @param {string} nouveauMotDePasse - Nouveau mot de passe
 */
async function changerMotDePasse(userId, motDePasseActuel, nouveauMotDePasse) {
  const resultat = await db.query('SELECT mdp_hash FROM Utilisateurs WHERE id = $1', [userId]);
  const user = resultat.rows[0];
  if (!user || !user.mdp_hash || !(await bcrypt.compare(motDePasseActuel, user.mdp_hash))) {
    throw httpError(401, 'Mot de passe actuel incorrect');
  }
  const hash = await bcrypt.hash(nouveauMotDePasse, SALT_ROUNDS);
  await db.query('UPDATE Utilisateurs SET mdp_hash = $1 WHERE id = $2', [hash, userId]);
}

/**
 * Anonymise le compte (RGPD) : remplace les données personnelles par des
 * valeurs neutres et supprime adresses, cartes, sessions et tokens.
 * Les commandes et abonnements sont conservés.
 * @param {string} userId - UUID de l'utilisateur
 */
async function anonymiser(userId) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE Utilisateurs
       SET nom = 'Anonyme', prenom = 'Utilisateur',
           email = 'anonyme-' || id || '@cyna.invalid',
           telephone = NULL, mdp_hash = NULL, email_verifie = FALSE
       WHERE id = $1`,
      [userId]
    );
    await client.query('DELETE FROM Sessions WHERE utilisateur_id = $1', [userId]);
    await client.query('DELETE FROM Tokens_Email WHERE utilisateur_id = $1', [userId]);
    await client.query('DELETE FROM Adresses WHERE utilisateur_id = $1', [userId]);
    await client.query('DELETE FROM Methodes_Paiement WHERE utilisateur_id = $1', [userId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Liste les adresses de l'utilisateur (défaut en premier). */
async function listerAdresses(userId) {
  const resultat = await db.query(
    'SELECT * FROM Adresses WHERE utilisateur_id = $1 ORDER BY est_defaut DESC, cree_le DESC',
    [userId]
  );
  return resultat.rows;
}

/**
 * Crée une adresse. La première adresse du carnet devient l'adresse par défaut.
 * @param {string} userId - UUID de l'utilisateur
 * @param {object} adresse - Champs de l'adresse
 */
async function creerAdresse(userId, adresse) {
  const nb = await db.query('SELECT COUNT(*)::int AS nb FROM Adresses WHERE utilisateur_id = $1', [userId]);
  const estDefaut = nb.rows[0].nb === 0;

  const resultat = await db.query(
    `INSERT INTO Adresses (utilisateur_id, prenom, nom, adresse_ligne1, adresse_ligne2,
                           ville, region, code_postal, pays, telephone, est_defaut)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      userId,
      adresse.prenom,
      adresse.nom,
      adresse.adresse_ligne1,
      adresse.adresse_ligne2 || null,
      adresse.ville,
      adresse.region || null,
      adresse.code_postal,
      adresse.pays,
      adresse.telephone,
      estDefaut,
    ]
  );
  return resultat.rows[0];
}

/**
 * Modifie une adresse appartenant à l'utilisateur (404 sinon).
 * @param {string} userId - UUID de l'utilisateur
 * @param {string} adresseId - UUID de l'adresse
 * @param {object} adresse - Nouveaux champs
 */
async function modifierAdresse(userId, adresseId, adresse) {
  const resultat = await db.query(
    `UPDATE Adresses
     SET prenom = $1, nom = $2, adresse_ligne1 = $3, adresse_ligne2 = $4,
         ville = $5, region = $6, code_postal = $7, pays = $8, telephone = $9
     WHERE id = $10 AND utilisateur_id = $11 RETURNING *`,
    [
      adresse.prenom,
      adresse.nom,
      adresse.adresse_ligne1,
      adresse.adresse_ligne2 || null,
      adresse.ville,
      adresse.region || null,
      adresse.code_postal,
      adresse.pays,
      adresse.telephone,
      adresseId,
      userId,
    ]
  );
  if (resultat.rowCount === 0) {
    throw httpError(404, 'Adresse introuvable');
  }
  return resultat.rows[0];
}

/** Supprime une adresse appartenant à l'utilisateur (404 sinon). */
async function supprimerAdresse(userId, adresseId) {
  const resultat = await db.query('DELETE FROM Adresses WHERE id = $1 AND utilisateur_id = $2', [
    adresseId,
    userId,
  ]);
  if (resultat.rowCount === 0) {
    throw httpError(404, 'Adresse introuvable');
  }
}

/**
 * Définit une adresse comme adresse par défaut (désactive les autres).
 * @param {string} userId - UUID de l'utilisateur
 * @param {string} adresseId - UUID de l'adresse
 */
async function definirAdresseDefaut(userId, adresseId) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE Adresses SET est_defaut = FALSE WHERE utilisateur_id = $1', [userId]);
    const resultat = await client.query(
      'UPDATE Adresses SET est_defaut = TRUE WHERE id = $1 AND utilisateur_id = $2 RETURNING *',
      [adresseId, userId]
    );
    if (resultat.rowCount === 0) {
      throw httpError(404, 'Adresse introuvable');
    }
    await client.query('COMMIT');
    return resultat.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getMe,
  updateMe,
  demanderChangementEmail,
  confirmerChangementEmail,
  changerMotDePasse,
  anonymiser,
  listerAdresses,
  creerAdresse,
  modifierAdresse,
  supprimerAdresse,
  definirAdresseDefaut,
};
