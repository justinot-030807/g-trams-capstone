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
        if (err.errors) {
            const formattedErrors = err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            return errorResponse(res, 400, 'Validation Failed', formattedErrors);
        }
        return errorResponse(res, 400, 'Invalid Request Data');
    }
};

module.exports = validate;
