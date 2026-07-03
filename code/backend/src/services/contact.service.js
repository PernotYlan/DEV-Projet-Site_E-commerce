const db = require('../config/db');

/**
 * Enregistre un message de contact (formulaire ou chatbot).
 * @param {{email: string, sujet?: string, message: string, source?: string, utilisateur_id?: string}} donnees
 */
async function creerMessage({ email, sujet, message, source = 'FORMULAIRE', utilisateur_id = null }) {
  await db.query(
    `INSERT INTO Messages_Contact (utilisateur_id, email, sujet, message, source)
     VALUES ($1, $2, $3, $4, $5)`,
    [utilisateur_id, email, sujet || null, message, source]
  );
}

module.exports = { creerMessage };
