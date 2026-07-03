const abonnementsService = require('../services/abonnements.service');

/** GET /api/abonnements — abonnements de l'utilisateur. */
async function lister(req, res, next) {
  try {
    const abonnements = await abonnementsService.listerAbonnements(req.user.id);
    res.status(200).json({ data: abonnements });
  } catch (err) {
    next(err);
  }
}

/** GET /api/abonnements/:id — détail. */
async function detail(req, res, next) {
  try {
    const abonnement = await abonnementsService.getAbonnement(req.user.id, req.params.id);
    res.status(200).json({ data: abonnement });
  } catch (err) {
    next(err);
  }
}

/** POST /api/abonnements/:id/resilier — demande la résiliation. */
async function resilier(req, res, next) {
  try {
    const abonnement = await abonnementsService.resilier(req.user.id, req.params.id);
    res.status(200).json({ data: abonnement });
  } catch (err) {
    next(err);
  }
}

module.exports = { lister, detail, resilier };
