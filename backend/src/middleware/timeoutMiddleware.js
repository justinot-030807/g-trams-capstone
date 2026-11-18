const { errorResponse } = require('../utils/apiResponse');

const timeoutMiddleware = (timeoutInMs) => {
    return (req, res, next) => {
        const reqPath = String(req.originalUrl || req.url || '').split('?')[0].toLowerCase();
        const isHeavyOperation =
            reqPath.endsWith('/scan-document') ||
            reqPath.endsWith('/scan-roster') ||
            reqPath.startsWith('/api/v1/backups') ||
            reqPath.includes('/backups/') ||
            Boolean(req.headers['content-type']?.includes('multipart/form-data'));

        // Allow longer bounded timeout (180s) for uploads, OCR scans, and backups; standard timeout otherwise
        const effectiveTimeoutMs = isHeavyOperation ? Math.max(timeoutInMs, 180000) : timeoutInMs;

        res.setTimeout(effectiveTimeoutMs, () => {
            const errMessage = 'Request Timeout: The server took too long to process the request.';
            console.error(`[TIMEOUT] ${req.method} ${reqPath}`);

            if (!res.headersSent) {
                return errorResponse(res, 408, errMessage);
            }
        });
        next();
    };
};

module.exports = timeoutMiddleware;
