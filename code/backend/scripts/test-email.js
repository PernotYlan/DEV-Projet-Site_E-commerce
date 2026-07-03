/**
 * Script de test d'envoi d'email via la configuration SMTP du .env.
 * Usage : node scripts/test-email.js [destinataire]
 * Avec Mailtrap, l'email apparaît dans votre boîte sandbox (pas de vraie livraison).
 */
const { envoyerEmail } = require('../src/services/email.service');

async function main() {
  const destinataire = process.argv[2] || 'test@cyna-it.fr';
  await envoyerEmail(
    destinataire,
    'Test SMTP — CYNA',
    `<h1 style="font-family:sans-serif">Ça marche ✅</h1>
     <p style="font-family:sans-serif">Si vous voyez cet email dans Mailtrap, la configuration SMTP est correcte.</p>`
  );
  console.log(`Email de test envoyé à ${destinataire}. Vérifiez votre boîte Mailtrap.`);
}

main().catch((err) => {
  console.error('Échec de l’envoi :', err.message);
  process.exit(1);
});
