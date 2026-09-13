const { errorResponse } = require('../utils/apiResponse');

const timeoutMiddleware = (timeoutInMs) => {
    return (req, res, next) => {
        // Set the timeout for the specific request
        res.setTimeout(timeoutInMs, () => {
            const errMessage = 'Request Timeout: The server took too long to process the request.';
            console.error(`[TIMEOUT] ${req.method} ${req.originalUrl}`);
            
            if (!res.headersSent) {
                return errorResponse(res, 408, errMessage);
            }
        });
        next();
    };
};

module.exports = timeoutMiddleware;
