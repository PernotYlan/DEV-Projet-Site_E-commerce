const promClient = require('prom-client');

promClient.collectDefaultMetrics({ prefix: 'node_' });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestsInFlight = new promClient.Gauge({
  name: 'http_requests_in_flight',
  help: 'Nombre de requêtes HTTP en cours',
});

const orderCreatedTotal = new promClient.Counter({
  name: 'order_created_total',
  help: 'Nombre de commandes créées',
});

const salesAmountTotal = new promClient.Counter({
  name: 'sales_amount_total_eur',
  help: 'Montant total des ventes en euros',
});

const paymentErrorsTotal = new promClient.Counter({
  name: 'payment_errors_total',
  help: 'Nombre total d’erreurs de paiement',
  labelNames: ['type'],
});

const cartSize = new promClient.Histogram({
  name: 'cart_size',
  help: 'Taille du panier au moment de la création de commande',
  buckets: [1, 2, 3, 5, 8, 10, 15],
});

const paymentServiceLatencySeconds = new promClient.Histogram({
  name: 'payment_service_latency_seconds',
  help: 'Latence des appels au service de paiement',
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
});

const activeSessions = new promClient.Gauge({
  name: 'active_sessions',
  help: 'Nombre de sessions actives',
});

function normalizeRoute(req) {
  if (req.route && req.route.path) {
    return req.route.path;
  }
  return req.path || 'unknown';
}

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  httpRequestsInFlight.inc();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    const route = normalizeRoute(req);
    const statusCode = `${res.statusCode}`;

    httpRequestDuration.observe({ method: req.method, route, status_code: statusCode }, duration);
    httpRequestsTotal.inc({ method: req.method, route, status_code: statusCode });
    httpRequestsInFlight.dec();
  });

  next();
}

function recordOrderCreated(amountEur) {
  orderCreatedTotal.inc();
  salesAmountTotal.inc(amountEur);
}

function recordPaymentError(type) {
  paymentErrorsTotal.inc({ type });
}

function recordCartSize(size) {
  cartSize.observe(size);
}

function recordPaymentLatency(seconds) {
  paymentServiceLatencySeconds.observe(seconds);
}

function setActiveSessions(value) {
  activeSessions.set(value);
}

module.exports = {
  metricsMiddleware,
  recordOrderCreated,
  recordPaymentError,
  recordPaymentLatency,
  recordCartSize,
  setActiveSessions,
  register: promClient.register,
};
