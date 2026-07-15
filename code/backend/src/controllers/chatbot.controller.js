const https = require('https');
const http = require('http');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');

function postToOllama(prompt) {
  const payload = JSON.stringify({
    model: process.env.OLLAMA_MODEL || 'llama3.2:1b',
    prompt,
    stream: false,
    options: {
      temperature: 0.2,
      top_p: 0.9,
      repeat_penalty: 1.1,
    },
  });

  const target = process.env.OLLAMA_HOST || 'http://ollama:11434';
  const url = new URL('/api/generate', target);

  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json.response || 'Désolé, je n’ai pas de réponse pour le moment.');
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function getClientContext(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { userName: null, userEmail: req.body?.email || null };
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const result = await db.query('SELECT prenom, nom, email FROM Utilisateurs WHERE id = $1', [payload.id]);
    const user = result.rows[0];
    if (!user) {
      return { userName: null, userEmail: req.body?.email || null };
    }

    return {
      userName: user.prenom ? `${user.prenom}` : null,
      userEmail: user.email || req.body?.email || null,
      userFullName: [user.prenom, user.nom].filter(Boolean).join(' ') || null,
    };
  } catch {
    return { userName: null, userEmail: req.body?.email || null };
  }
}

async function getProductContext() {
  try {
    const result = await db.query(
      `SELECT p.nom, p.description, c.nom AS categorie_nom,
              (SELECT MIN(montant) FROM Prix pr WHERE pr.produit_id = p.id AND pr.is_active) AS prix_min
       FROM Produits p
       JOIN Categories c ON c.id = p.categorie_id
       WHERE p.is_active = TRUE
       ORDER BY p.priorite DESC, p.cree_le DESC
       LIMIT 10`
    );

    return result.rows.map((row) => {
      const prix = row.prix_min ? `${Number(row.prix_min).toFixed(2)} €` : 'prix non communiqué';
      return `- ${row.nom} (${row.categorie_nom}) — ${row.description || 'solution de cybersécurité'} — à partir de ${prix}`;
    });
  } catch {
    return [];
  }
}

function buildPrompt(message, clientContext, products) {
  const userLine = clientContext.userFullName
    ? `Nom du client : ${clientContext.userFullName}`
    : clientContext.userName
      ? `Prénom du client : ${clientContext.userName}`
      : 'Client non connecté';

  const emailLine = clientContext.userEmail ? `Email du client : ${clientContext.userEmail}` : 'Aucune adresse email fournie';
  const productLine = products.length
    ? `Produits/solutions disponibles :\n${products.join('\n')}`
    : 'Produits/solutions disponibles : informations non chargées';

  return `Tu es l'assistant de support client de CYNA, une plateforme de cybersécurité SaaS.
Règles strictes :
- Réponds uniquement aux questions liées au site, aux produits, aux abonnements, aux commandes, à la sécurité, aux prix, à la facturation, au support ou à l'expérience client.
- Si la question n'a rien à voir avec le site ou le parcours client, redirige poliment vers l'assistance CYNA et propose une aide liée au site.
- Sois concis, utile, professionnel et rassurant.
- N'invente jamais d'information. Si tu n'es pas sûr, dis-le clairement.
- Utilise le prénom du client si tu le connais. Si le client n'est pas identifié, adresse-le poliment avec "Bonjour".
- Adapte le ton au contexte métier, sans être trop familier.

Contexte client :
${userLine}
${emailLine}

${productLine}

Question du client : ${message.trim()}

Réponse de l'assistant :`;
}

async function chat(req, res, next) {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message manquant' });
    }

    const [clientContext, products] = await Promise.all([getClientContext(req), getProductContext()]);
    const prompt = buildPrompt(message, clientContext, products);
    const reply = await postToOllama(prompt);
    return res.status(200).json({ data: { reply } });
  } catch (err) {
    next(err);
  }
}

module.exports = { chat };