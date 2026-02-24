const buckets = new Map();

const now = () => Date.now();

const getKey = (req) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const email = req.body?.email ? String(req.body.email).toLowerCase() : '';
  return `${ip}:${email}`;
};

const createLimiter = ({ windowMs, max, message }) => {
  return (req, res, next) => {
    const key = getKey(req);
    const ts = now();
    const entry = buckets.get(key) || { count: 0, resetAt: ts + windowMs };

    if (ts > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = ts + windowMs;
    }

    entry.count += 1;
    buckets.set(key, entry);

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - ts) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        message
      });
    }

    next();
  };
};

const loginRateLimit = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many login attempts. Please try again later.'
});

const registerRateLimit = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many registration attempts. Please try again later.'
});

module.exports = {
  loginRateLimit,
  registerRateLimit
};
