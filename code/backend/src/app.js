const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');
const utilisateursRoutes = require('./routes/utilisateurs.routes');
const catalogueRoutes = require('./routes/catalogue.routes');
const commandesRoutes = require('./routes/commandes.routes');
const abonnementsRoutes = require('./routes/abonnements.routes');
const contactRoutes = require('./routes/contact.routes');
const adminRoutes = require('./routes/admin.routes');
const { webhook } = require('./controllers/paiement.controller');

const app = express();

// Derrière le reverse proxy nginx (conteneur frontend) : fait confiance au
// 1er proxy pour lire la vraie IP client (X-Forwarded-For), nécessaire pour
// que express-rate-limit fonctionne correctement en environnement Docker.
app.set('trust proxy', 1);

// Sécurité : en-têtes HTTP + CORS limité au front
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(cookieParser());

// Webhook Stripe : nécessite le corps BRUT pour vérifier la signature.
// Monté AVANT express.json() pour ne pas que le corps soit déjà parsé.
app.post('/api/paiement/webhook', express.raw({ type: 'application/json' }), webhook);

app.use(express.json());

// Limite globale : 100 requêtes / 15 min / IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes, réessayez plus tard' },
  })
);

// Routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/utilisateurs', utilisateursRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/abonnements', abonnementsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', catalogueRoutes); // /accueil, /categories, /produits...

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// 404 pour toute route inconnue
app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));

// Handler global d'erreurs (toujours en dernier)
app.use(errorHandler);

module.exports = app;
