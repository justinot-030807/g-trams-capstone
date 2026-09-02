// In-Memory Sliding-Window Rate Limiter
const rateLimitMap = new Map();

const authRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const maxAttempts = options.max || 5; // 5 attempts default
  const message = options.message || 'Too many attempts. Please try again after 15 minutes.';

  return (req, res, next) => {
    const rawIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const normalizedIp = rawIp.replace(/^::ffff:/, '');
    const key = `${normalizedIp}_${req.baseUrl || ''}${req.path || ''}`;
    const now = Date.now();

    const record = rateLimitMap.get(key) || { attempts: [] };

    // Filter out attempts older than windowMs
    record.attempts = record.attempts.filter(timestamp => now - timestamp < windowMs);

    const remaining = Math.max(0, maxAttempts - record.attempts.length);
    res.setHeader('X-RateLimit-Limit', maxAttempts);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (record.attempts.length >= maxAttempts) {
      const remainingMs = windowMs - (now - record.attempts[0]);
      const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
      res.setHeader('Retry-After', remainingSeconds);
      return res.status(429).json({
        message: `${message} (Please retry in ${remainingMinutes} min)`,
        retryAfterSeconds: remainingSeconds,
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
