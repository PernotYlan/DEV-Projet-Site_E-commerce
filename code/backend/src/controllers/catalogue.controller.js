const catalogueService = require('../services/catalogue.service');

/** GET /api/accueil — données de la page d'accueil. */
async function accueil(req, res, next) {
  try {
    res.status(200).json({ data: await catalogueService.accueil() });
  } catch (err) {
    next(err);
  }
}

/** GET /api/categories — catégories actives. */
async function categories(req, res, next) {
  try {
    res.status(200).json({ data: await catalogueService.categories() });
  } catch (err) {
    next(err);
  }
}

/** GET /api/categories/:id/produits — produits d'une catégorie. */
async function categorieProduits(req, res, next) {
  try {
    res.status(200).json({ data: await catalogueService.categorieProduits(req.params.id) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/produits/recherche — recherche paginée. */
async function recherche(req, res, next) {
  try {
    const resultat = await catalogueService.recherche(req.query);
    res.status(200).json(resultat); // { data, pagination }
  } catch (err) {
    next(err);
  }
}

/** GET /api/produits/:id — détail d'un produit. */
async function produit(req, res, next) {
  try {
    res.status(200).json({ data: await catalogueService.produit(req.params.id) });
  } catch (err) {
    next(err);
  }
}

module.exports = { accueil, categories, categorieProduits, recherche, produit };
