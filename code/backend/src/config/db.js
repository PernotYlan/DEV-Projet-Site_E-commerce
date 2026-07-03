const { Pool } = require('pg');
const env = require('./env');

/** Pool de connexions PostgreSQL partagé par toute l'application. */
const pool = new Pool({ connectionString: env.databaseUrl });

/**
 * Exécute une requête SQL paramétrée ($1, $2, ...) sur le pool.
 * @param {string} texte - Requête SQL
 * @param {Array} [params] - Paramètres de la requête
 * @returns {Promise<import('pg').QueryResult>}
 */
function query(texte, params) {
  return pool.query(texte, params);
}

module.exports = { pool, query };
