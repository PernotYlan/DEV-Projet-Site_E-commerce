const contactService = require('../services/contact.service');

/** POST /api/contact — message du formulaire de contact. */
async function formulaire(req, res, next) {
  try {
    const { email, sujet, message } = req.body;
    await contactService.creerMessage({ email, sujet, message, source: 'FORMULAIRE' });
    res.status(201).json({ data: { message: 'Message envoyé. Notre équipe vous répondra sous 24h.' } });
  } catch (err) {
    next(err);
  }
}

/** POST /api/contact/chatbot — message issu du chatbot. */
async function chatbot(req, res, next) {
  try {
    const { email, message } = req.body;
    await contactService.creerMessage({ email, message, source: 'CHATBOT' });
    res.status(201).json({ data: { message: 'ok' } });
  } catch (err) {
    next(err);
  }
}

module.exports = { formulaire, chatbot };
