/**
 * Script utilitaire : définit le mot de passe de l'admin par défaut
 * (admin@cyna-it.fr), dont le hash est un placeholder dans sqlcyna.sql.
 *
 * Usage : node scripts/definir-mdp-admin.js "MonMotDePasse1!"
 */
const bcrypt = require('bcrypt');
const db = require('../src/config/db');
const { SALT_ROUNDS } = require('../src/services/auth.service');

/** Hash le mot de passe passé en argument et met à jour l'admin en BDD. */
async function main() {
  const motDePasse = process.argv[2];
  if (!motDePasse) {
    console.error('Usage : node scripts/definir-mdp-admin.js "MonMotDePasse1!"');
    process.exit(1);
  }

  const hash = await bcrypt.hash(motDePasse, SALT_ROUNDS);
  const resultat = await db.query(
    `UPDATE Utilisateurs SET mdp_hash = $1 WHERE email = 'admin@cyna-it.fr' RETURNING id`,
    [hash]
  );

  if (resultat.rowCount === 0) {
    console.error('Admin admin@cyna-it.fr introuvable en BDD. Avez-vous exécuté sqlcyna.sql ?');
  } else {
    console.log('Mot de passe admin mis à jour.');
  }
  await db.pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
