const app = require('./src/app');
const env = require('./src/config/env');

/** Point d'entrée : démarre le serveur HTTP de l'API CYNA. */
app.listen(env.port, () => {
  console.log(`API CYNA démarrée sur http://localhost:${env.port}`);
});
