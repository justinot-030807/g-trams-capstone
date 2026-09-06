// Express 5 Safe NoSQL Injection Sanitizer
const cleanObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            if (typeof obj[i] === 'object' && obj[i] !== null) {
                cleanObject(obj[i]);
            }
        }
        return obj;
    }

    for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            cleanObject(obj[key]);
        }
    }
    return obj;
};

const mongoSanitize = (req, res, next) => {
    try {
        if (req.body) cleanObject(req.body);
        if (req.params) cleanObject(req.params);
        if (req.query) cleanObject(req.query);
    } catch (e) {
        console.error('Sanitization warning:', e);
    }
    next();
};

module.exports = mongoSanitize;
