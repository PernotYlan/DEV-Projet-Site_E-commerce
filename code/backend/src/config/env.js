require('dotenv').config();

/** Variables d'environnement obligatoires au démarrage. */
const OBLIGATOIRES = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

/**
 * Valide la présence des variables obligatoires et construit l'objet de config.
 * @returns {object} Configuration de l'application
 */
function chargerEnv() {
  const manquantes = OBLIGATOIRES.filter((nom) => !process.env[nom]);
  if (manquantes.length > 0) {
    throw new Error(`Variables d'environnement manquantes : ${manquantes.join(', ')}`);
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      // Adresse affichée comme expéditeur (l'identifiant SMTP n'est pas un email)
      from: process.env.SMTP_FROM || 'CYNA <no-reply@cyna-it.fr>',
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  };
}

module.exports = chargerEnv();
