const metrics = require('../utils/monitoring/zkpMetrics');
const logger = require('../utils/monitoring/logger');

const monitorRequest = (req, res, next) => {
  const startTime = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds + nanoseconds / 1e9;
    
    metrics.cryptoOpsLatency.observe(duration);
    logger.info({
      path: req.path,
      method: req.method,
      status: res.statusCode,
      duration
    });
  });

  next();
};

module.exports = { monitorRequest };