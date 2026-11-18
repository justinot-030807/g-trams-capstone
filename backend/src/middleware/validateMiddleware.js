const { errorResponse } = require('../utils/apiResponse');

const validate = (schema) => (req, res, next) => {
    try {
        // Zod validation throws an error if it fails
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        if (parsed && parsed.body) {
            req.body = parsed.body;
        }
        next();
    } catch (err) {
        // Zod specific error mapping
        const issues = err.issues || err.errors;
        if (Array.isArray(issues)) {
            const formattedErrors = issues.map((e) => ({
                field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
                message: e.message,
            }));
            return errorResponse(res, 400, 'Validation Failed', formattedErrors);
        }
        return errorResponse(res, 400, 'Invalid Request Data');
    }
};

module.exports = validate;
