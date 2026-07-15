const https = require('https');
const http = require('http');

function postToOllama(prompt) {
  const payload = JSON.stringify({
    model: process.env.OLLAMA_MODEL || 'llama3.2:1b',
    prompt,
    stream: false,
    options: { temperature: 0.7 },
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

async function chat(req, res, next) {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message manquant' });
    }

    const prompt = `Tu es un assistant de support client pour un site e-commerce de cybersécurité. Réponds de façon concise, utile et professionnelle.\n\nUtilisateur : ${message.trim()}\n\nAssistant :`;
    const reply = await postToOllama(prompt);
    return res.status(200).json({ data: { reply } });
  } catch (err) {
    next(err);
  }
}

module.exports = { chat };