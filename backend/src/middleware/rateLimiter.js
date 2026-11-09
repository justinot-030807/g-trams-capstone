const rateLimit = require('express-rate-limit');

const resolveClientIp = (req) => {
    const cfIp = req.headers?.['cf-connecting-ip'];
    if (cfIp && typeof cfIp === 'string') return cfIp.trim();
    const realIp = req.headers?.['x-real-ip'];
    if (realIp && typeof realIp === 'string') return realIp.trim();
    const forwardedFor = req.headers?.['x-forwarded-for'];
    if (forwardedFor && typeof forwardedFor === 'string') {
        const first = forwardedFor.split(',')[0]?.trim();
        if (first) return first;
    }
    return req.ip || '127.0.0.1';
};

const resolveAuthKey = (req) => {
    const ip = resolveClientIp(req);
    if (process.env.FORCE_RATE_LIMIT) return ip;
    const contactKey = String(req.body?.contact || req.body?.email || '').toLowerCase().trim();
    return contactKey ? `${ip}:${contactKey}` : ip;
};

const resolveApiKey = (req) => {
    const ip = resolveClientIp(req);
    const authHeader = req.headers?.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.length > 16) {
        return `${ip}:${authHeader.slice(-24)}`;
    }
    return ip;
};

// Flexible Rate Limiter Generator
const authRateLimiter = (options) => {
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000, 
        max: options.max || 10,
        message: { message: options.message || 'Too many requests, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
        validate: false,
        keyGenerator: resolveAuthKey,
        skip: () => process.env.NODE_ENV === 'test' && !process.env.FORCE_RATE_LIMIT
    });
};

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000,
    message: { message: 'Too many requests from this IP.' },
    standardHeaders: true, 
    legacyHeaders: false, 
    validate: false,
    keyGenerator: resolveApiKey,
    skip: () => process.env.NODE_ENV === 'test' && !process.env.FORCE_RATE_LIMIT
});

module.exports = { authRateLimiter, apiLimiter };
