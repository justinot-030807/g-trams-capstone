const rateLimit = require('express-rate-limit');

// Flexible Rate Limiter Generator
const authRateLimiter = (options) => {
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000, 
        max: options.max || 10,
        message: { message: options.message || 'Too many requests, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
        skip: () => process.env.NODE_ENV === 'test'
    });
};

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { message: 'Too many requests from this IP.' },
    standardHeaders: true, 
    legacyHeaders: false, 
    skip: () => process.env.NODE_ENV === 'test'
});

module.exports = { authRateLimiter, apiLimiter };
