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

// Flexible Rate Limiter Generator
const authRateLimiter = (options) => {
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000, 
        max: options.max || 10,
        message: { message: options.message || 'Too many requests, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
        validate: false,
        keyGenerator: resolveClientIp,
        skip: () => process.env.NODE_ENV === 'test' && !process.env.FORCE_RATE_LIMIT
    });
};

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { message: 'Too many requests from this IP.' },
    standardHeaders: true, 
    legacyHeaders: false, 
    validate: false,
    keyGenerator: resolveClientIp,
    skip: () => process.env.NODE_ENV === 'test' && !process.env.FORCE_RATE_LIMIT
});

module.exports = { authRateLimiter, apiLimiter };
