const utilisateursService = require('../services/utilisateurs.service');
const paiementService = require('../services/paiement.service');

/** GET /api/utilisateurs/me — profil de l'utilisateur connecté. */
async function getMe(req, res, next) {
  try {
    const user = await utilisateursService.getMe(req.user.id);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/utilisateurs/me — modifie nom, prénom, téléphone. */
async function updateMe(req, res, next) {
  try {
    const { nom, prenom, telephone } = req.body;
    const user = await utilisateursService.updateMe(req.user.id, { nom, prenom, telephone });
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/utilisateurs/me/email — demande un changement d'email. */
async function changerEmail(req, res, next) {
  try {
    const { nouvel_email, mot_de_passe } = req.body;
    await utilisateursService.demanderChangementEmail(req.user.id, nouvel_email, mot_de_passe);
    res.status(200).json({ data: { message: 'Un email de confirmation a été envoyé à la nouvelle adresse.' } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/utilisateurs/me/confirm-email-change?token= — confirme le nouvel email. */
async function confirmerChangementEmail(req, res, next) {
  try {
    await utilisateursService.confirmerChangementEmail(req.query.token);
    res.status(200).json({ data: { message: 'Adresse email mise à jour.' } });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/utilisateurs/me/password — change le mot de passe. */
async function changerMotDePasse(req, res, next) {
  try {
    const { mot_de_passe_actuel, nouveau_mot_de_passe } = req.body;
    await utilisateursService.changerMotDePasse(req.user.id, mot_de_passe_actuel, nouveau_mot_de_passe);
    res.status(200).json({ data: { message: 'Mot de passe modifié.' } });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/utilisateurs/me — anonymise le compte (RGPD). */
async function supprimerCompte(req, res, next) {
  try {
    await utilisateursService.anonymiser(req.user.id);
    res.status(200).json({ data: { message: 'Compte anonymisé.' } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/utilisateurs/me/adresses — liste des adresses. */
async function listerAdresses(req, res, next) {
  try {
    const adresses = await utilisateursService.listerAdresses(req.user.id);
    res.status(200).json({ data: adresses });
  } catch (err) {
    next(err);
  }
}

/** POST /api/utilisateurs/me/adresses — ajoute une adresse. */
async function creerAdresse(req, res, next) {
  try {
    const adresse = await utilisateursService.creerAdresse(req.user.id, req.body);
    res.status(201).json({ data: adresse });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/utilisateurs/me/adresses/:id — modifie une adresse. */
async function modifierAdresse(req, res, next) {
  try {
    const adresse = await utilisateursService.modifierAdresse(req.user.id, req.params.id, req.body);
    res.status(200).json({ data: adresse });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/utilisateurs/me/adresses/:id — supprime une adresse. */
async function supprimerAdresse(req, res, next) {
  try {
    await utilisateursService.supprimerAdresse(req.user.id, req.params.id);
    res.status(200).json({ data: { message: 'Adresse supprimée.' } });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/utilisateurs/me/adresses/:id/defaut — adresse par défaut. */
async function definirAdresseDefaut(req, res, next) {
  try {
    const adresse = await utilisateursService.definirAdresseDefaut(req.user.id, req.params.id);
    res.status(200).json({ data: adresse });
  } catch (err) {
    next(err);
  }
}

/** GET /api/utilisateurs/me/paiements — liste des cartes enregistrées. */
async function listerPaiements(req, res, next) {
  try {
    const cartes = await paiementService.listerPaiements(req.user.id);
    res.status(200).json({ data: cartes });
  } catch (err) {
    next(err);
  }
}

/** POST /api/utilisateurs/me/paiements — enregistre une carte (token Stripe). */
async function ajouterPaiement(req, res, next) {
  try {
    const carte = await paiementService.ajouterPaiement(req.user.id, req.body.stripe_payment_method_id);
    res.status(201).json({ data: carte });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/utilisateurs/me/paiements/:id — supprime une carte. */
async function supprimerPaiement(req, res, next) {
  try {
    await paiementService.supprimerPaiement(req.user.id, req.params.id);
    res.status(200).json({ data: { message: 'Carte supprimée.' } });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/utilisateurs/me/paiements/:id/defaut — carte par défaut. */
async function definirPaiementDefaut(req, res, next) {
  try {
    await paiementService.definirDefaut(req.user.id, req.params.id);
    res.status(200).json({ data: { message: 'Carte définie par défaut.' } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
  changerEmail,
  confirmerChangementEmail,
  changerMotDePasse,
  supprimerCompte,
  listerAdresses,
  creerAdresse,
  modifierAdresse,
  supprimerAdresse,
  definirAdresseDefaut,
  listerPaiements,
  ajouterPaiement,
  supprimerPaiement,
  definirPaiementDefaut,
};
