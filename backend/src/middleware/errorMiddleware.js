const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

    // Log only actual server errors (500s) to console, ignore 404 noise from bots
    if (statusCode !== 404) {
        console.error(`[ERROR] ${err.name}: ${err.message}`);
        if (err.stack) {
            console.error(err.stack);
        }
    }
    
    let errorResponse = {
        message: err.message || 'Internal Server Error'
    };

    // Include stack trace only in development
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = err.stack;
    }

    // Handle specific mongoose/other errors gracefully
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', details: err.errors });
    }
    if (err.code === 11000) {
        return res.status(400).json({ message: 'Duplicate Key Error', details: err.keyValue });
    }
    if (err.name === 'MulterError') {
        return res.status(400).json({ message: `File upload error: ${err.message}` });
    }
    if (err.message && err.message.includes('CORS policy')) {
        return res.status(403).json({ message: err.message });
    }

    res.status(statusCode).json(errorResponse);
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
