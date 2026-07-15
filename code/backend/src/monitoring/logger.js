const { createLogger, format, transports } = require('winston');

const jsonFormatter = format((info) => {
  const safeInfo = {
    timestamp: info.timestamp,
    level: info.level,
    message: info.message,
    request_id: info.request_id || null,
    route: info.route || null,
    endpoint: info.endpoint || null,
  };

  if (info.error && info.error.message) {
    safeInfo.error = info.error.message;
  }

  return safeInfo;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    jsonFormatter(),
    format.json()
  ),
  transports: [new transports.Console()],
});

function logHttp(req, res, next) {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  logger.info('request_received', {
    request_id: requestId,
    route: req.originalUrl,
    endpoint: req.path,
  });
  next();
}

module.exports = { logger, logHttp };
