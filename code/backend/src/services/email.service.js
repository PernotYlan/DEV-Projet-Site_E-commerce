const nodemailer = require('nodemailer');
const env = require('../config/env');

/** Transporteur SMTP partagé (configuré via les variables d'environnement). */
const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
});

/**
 * Envoie un email HTML.
 * @param {string} destinataire - Adresse email du destinataire
 * @param {string} sujet - Sujet de l'email
 * @param {string} html - Corps HTML
 */
async function envoyerEmail(destinataire, sujet, html) {
  await transporter.sendMail({
    from: env.smtp.from,
    to: destinataire,
    subject: sujet,
    html,
  });
}

/** Envoie le lien de confirmation d'inscription (valable 24h). */
function envoyerConfirmationInscription(email, token) {
  const lien = `${env.frontendUrl}/confirm-email?token=${token}`;
  return envoyerEmail(
    email,
    'Confirmez votre inscription — CYNA',
    `<p>Bienvenue chez CYNA !</p>
     <p>Cliquez sur le lien ci-dessous pour confirmer votre inscription (valable 24 heures) :</p>
     <p><a href="${lien}">${lien}</a></p>
     <p>Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>`
  );
}

/** Envoie le lien de réinitialisation de mot de passe (valable 24h). */
function envoyerResetMotDePasse(email, token) {
  const lien = `${env.frontendUrl}/reset-password?token=${token}`;
  return envoyerEmail(
    email,
    'Réinitialisation de votre mot de passe — CYNA',
    `<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
     <p>Cliquez sur le lien ci-dessous pour en définir un nouveau (valable 24 heures) :</p>
     <p><a href="${lien}">${lien}</a></p>
     <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`
  );
}

/** Envoie le lien de confirmation de changement d'adresse email (valable 24h). */
function envoyerConfirmationChangementEmail(email, token) {
  const lien = `${env.frontendUrl}/compte/profil?email_token=${token}`;
  return envoyerEmail(
    email,
    'Confirmez votre nouvelle adresse email — CYNA',
    `<p>Vous avez demandé à changer l'adresse email de votre compte CYNA.</p>
     <p>Cliquez sur le lien ci-dessous pour confirmer cette nouvelle adresse (valable 24 heures) :</p>
     <p><a href="${lien}">${lien}</a></p>`
  );
}

module.exports = {
  envoyerEmail,
  envoyerConfirmationInscription,
  envoyerResetMotDePasse,
  envoyerConfirmationChangementEmail,
};
