// In-Memory Sliding-Window Rate Limiter
const rateLimitMap = new Map();

const authRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const maxAttempts = options.max || 5; // 5 attempts default
  const message = options.message || 'Too many attempts. Please try again after 15 minutes.';

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip || 'unknown';
    const key = `${ip}_${req.originalUrl || req.path}`;
    const now = Date.now();

    const record = rateLimitMap.get(key) || { attempts: [] };

    // Filter out attempts older than windowMs
    record.attempts = record.attempts.filter(timestamp => now - timestamp < windowMs);

    if (record.attempts.length >= maxAttempts) {
      const remainingMs = windowMs - (now - record.attempts[0]);
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
      return res.status(429).json({
        message: `${message} (Please retry in ${remainingMinutes} min)`,
        retryAfterMinutes: remainingMinutes
      });
    }

    record.attempts.push(now);
    rateLimitMap.set(key, record);

    // Garbage collection if map grows too large
    if (rateLimitMap.size > 5000) {
      for (const [k, v] of rateLimitMap.entries()) {
        if (!v.attempts || v.attempts.every(t => now - t >= windowMs)) {
          rateLimitMap.delete(k);
        }
      }
    }

    next();
  };
};

module.exports = { authRateLimiter };
