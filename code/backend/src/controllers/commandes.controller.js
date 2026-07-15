const commandesService = require('../services/commandes.service');
const { recordOrderCreated, recordCartSize } = require('../monitoring/metrics');

/** POST /api/commandes — crée la commande et renvoie le client_secret Stripe. */
async function creer(req, res, next) {
  try {
    const { adresse_id, methode_paiement_id, items } = req.body;
    const resultat = await commandesService.creerCommande(req.user.id, { adresse_id, methode_paiement_id, items });
    recordCartSize(Array.isArray(items) ? items.length : 0);
    recordOrderCreated(0);
    res.status(201).json({ data: resultat });
  } catch (err) {
    next(err);
  }
}

/** GET /api/commandes — historique de l'utilisateur. */
async function lister(req, res, next) {
  try {
    const commandes = await commandesService.listerCommandes(req.user.id);
    res.status(200).json({ data: commandes });
  } catch (err) {
    next(err);
  }
}

/** GET /api/commandes/:id — détail d'une commande. */
async function detail(req, res, next) {
  try {
    const commande = await commandesService.getCommande(req.user.id, req.params.id);
    res.status(200).json({ data: commande });
  } catch (err) {
    next(err);
  }
}

module.exports = { creer, lister, detail };
