const authService = require('../services/auth.service');
const env = require('../config/env');
const { setActiveSessions } = require('../monitoring/metrics');

/** Options du cookie httpOnly qui transporte le refresh token. */
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: env.nodeEnv === 'production',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
};

/** POST /api/auth/register — inscription + envoi de l'email de confirmation. */
async function register(req, res, next) {
  try {
    const { nom, prenom, email, mot_de_passe } = req.body;
    await authService.register({ nom, prenom, email, mot_de_passe });
    res.status(201).json({ data: { message: 'Compte créé. Vérifiez vos emails pour confirmer votre inscription.' } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/confirm-email?token= — confirme l'adresse email. */
async function confirmEmail(req, res, next) {
  try {
    await authService.confirmEmail(req.query.token);
    res.status(200).json({ data: { message: 'Email confirmé. Vous pouvez maintenant vous connecter.' } });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/login — connexion, pose le cookie refresh et renvoie l'access token. */
async function login(req, res, next) {
  try {
    const { email, mot_de_passe, se_souvenir } = req.body;
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] || '' };
    const { accessToken, refreshToken, user } = await authService.login(
      { email, mot_de_passe, se_souvenir: Boolean(se_souvenir) },
      meta
    );
    setActiveSessions(1);
    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);
    res.status(200).json({ data: { access_token: accessToken, user } });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/refresh — renvoie un nouvel access token depuis le cookie. */
async function refresh(req, res, next) {
  try {
    const accessToken = await authService.refresh(req.cookies.refresh_token);
    res.status(200).json({ data: { access_token: accessToken } });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/logout — supprime la session BDD et efface le cookie. */
async function logout(req, res, next) {
  try {
    await authService.logout(req.cookies.refresh_token);
    setActiveSessions(0);
    res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, maxAge: undefined });
    res.status(200).json({ data: { message: 'Déconnecté' } });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/forgot-password — répond toujours 200 (anti-énumération). */
async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({ data: { message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' } });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/reset-password — définit un nouveau mot de passe via le token. */
async function resetPassword(req, res, next) {
  try {
    const { token, nouveau_mot_de_passe } = req.body;
    await authService.resetPassword(token, nouveau_mot_de_passe);
    res.status(200).json({ data: { message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, confirmEmail, login, refresh, logout, forgotPassword, resetPassword };
