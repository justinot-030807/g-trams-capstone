require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const mongoSanitize = require('./src/middleware/sanitize');
const timeoutMiddleware = require('./src/middleware/timeoutMiddleware'); // ADDED TIMEOUT
const { initSocket } = require('./src/config/socket');
const { beginRestoreSensitiveWork } = require('./src/services/backupService');

if (process.env.NODE_ENV !== 'test' && (!process.env.JWT_SECRET || !String(process.env.JWT_SECRET).trim())) {
    console.error('FATAL: JWT_SECRET environment variable is required.');
    process.exit(1);
}

// Routes
const todaRoutes = require('./src/routes/todaRoutes'); 
const auditLogRoutes = require('./src/routes/auditLogRoutes');

const app = express();
const server = http.createServer(app);

// Enable Payload Compression (Gzip/Brotli)
app.use(compression());

// Global Timeout: 45 seconds max per request to prevent hanging while allowing OCR/backups/SMTP
app.use(timeoutMiddleware(45000));

app.set('trust proxy', 1);
const databaseConnection = connectDB();

// HTTP Security Headers (Helmet)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://accounts.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "https://res.cloudinary.com", "data:", "blob:"],
            connectSrc: ["'self'", "https://api.semaphore.co", "https://oauth2.googleapis.com"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameSrc: ["https://accounts.google.com"]
        }
    }
}));

// CORS configuration with strict origin enforcement
const CLIENT_ORIGINS = String(process.env.CLIENT_URL || '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

const EXTRA_ALLOWED_ORIGINS = String(process.env.EXTRA_ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

const ALLOWED_ORIGINS = [
    'https://g-trams-official.vercel.app',
    'https://g-trams-web2.vercel.app',
    ...(process.env.NODE_ENV !== 'production' ? [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
    ] : []),
    ...CLIENT_ORIGINS,
    ...EXTRA_ALLOWED_ORIGINS
];

const isOriginAllowed = (origin) => {
    if (!origin) return true;
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    if (
        process.env.ALLOW_VERCEL_PREVIEWS === 'true' &&
        /^https:\/\/g-trams(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin)
    ) {
        return true;
    }
    if (
        process.env.NODE_ENV !== 'production' &&
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i.test(origin)
    ) {
        return true;
    }
    return false;
};

app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Blocked by CORS policy: Origin ${origin} not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Server-Time', 'X-Server-Timezone']
}));

// Server-Authoritative Time Header (Asia/Manila, UTC+8)
app.use((req, res, next) => {
    res.setHeader('X-Server-Time', new Date().toISOString());
    res.setHeader('X-Server-Timezone', 'Asia/Manila');
    next();
});

const PORT = process.env.PORT || 3000;
const BASE_URI = process.env.BASE_URI || '/api/v1';
const { apiLimiter } = require('./src/middleware/rateLimiter');
app.use(BASE_URI, apiLimiter);

// Reject compressed request bodies to neutralize decompression DoS advisories (H-11)
app.use((req, res, next) => {
    const contentEncoding = req.headers['content-encoding'];
    if (contentEncoding && String(contentEncoding).trim().toLowerCase() !== 'identity') {
        return res.status(415).json({ message: 'Unsupported Content-Encoding.' });
    }
    next();
});

// Body parsing with payload size limits to prevent DOS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL Injection sanitization
app.use(mongoSanitize);

const restorePaths = /^\/backups\/(?:restore-upload|restore-file\/[^/]+)\/?$/i;
const backupSnapshotPaths = /^\/backups\/(?:list|status|direct-download|download\/[^/]+)\/?$/i;
const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Backup reads may materialize a baseline archive or read a full live snapshot.
app.use(BASE_URI, async (req, res, next) => {
    if (req.method === 'POST' && restorePaths.test(req.path)) {
        req.skipRestoreActivity = true;
        return next();
    }
    const isBackupSnapshot = ['GET', 'HEAD'].includes(req.method) && backupSnapshotPaths.test(req.path);
    if (!writeMethods.has(req.method) && !isBackupSnapshot) return next();

    let release;
    try {
        release = await beginRestoreSensitiveWork();
    } catch (error) {
        console.warn('[RestoreGuard] Unable to coordinate database work:', error.message);
        if (res.headersSent || res.destroyed) return;
        return res.status(503).json({ message: 'Database restore coordination is unavailable. Please retry shortly.' });
    }

    if (res.headersSent || res.destroyed) {
        if (release) await release();
        return;
    }
    if (!release) {
        return res.status(503).json({ message: 'Database restore in progress. Please retry shortly.' });
    }

    req.restoreWorkAdmitted = true;
    res.once('finish', () => { void release({ keepLease: res.statusCode === 408 }); });
    // A disconnected client does not cancel the handler or its pending database writes.
    res.once('close', () => {
        if (!res.writableFinished) void release({ keepLease: true });
    });
    next();
});

// Auth routes
const authRoutes = require('./src/routes/authRoutes');
app.use(`${BASE_URI}/auth`, authRoutes);

// Franchise routes
const franchiseRoutes = require('./src/routes/franchiseRoutes');
app.use(`${BASE_URI}/franchises`, franchiseRoutes);
app.use(`${BASE_URI}/franchise`, franchiseRoutes);

// TODA routes
app.use(`${BASE_URI}/toda`, todaRoutes); 

// System settings routes
app.use(`${BASE_URI}/settings`, require('./src/routes/systemSettingsRoutes'));

// Audit logs routes (Admin only)
app.use(`${BASE_URI}/audit-logs`, auditLogRoutes);
app.use(`${BASE_URI}/backups`, require('./src/routes/backupRoutes'));

// Notification and Chat routes
app.use(`${BASE_URI}/notifications`, require('./src/routes/notificationRoutes'));
app.use(`${BASE_URI}/push`, require('./src/routes/pushRoutes'));
app.use(`${BASE_URI}/chat`, require('./src/routes/chatRoutes'));
app.use(`${BASE_URI}/tickets`, require('./src/routes/ticketRoutes'));
app.use(`${BASE_URI}/violations`, require('./src/routes/violationRoutes'));

// Swagger API Documentation (disabled in production unless explicitly enabled)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const swaggerUi = require('swagger-ui-express');
    const swaggerSpec = require('./src/config/swagger');
    app.use(`${BASE_URI}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Health check routes for Render/Uptime monitors
app.get('/', (req, res) => {
    res.status(200).json({ message: 'G-TRAMS API is running smoothly.' });
});
app.get(`${BASE_URI}/health`, (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    const indexesReady = typeof connectDB.areIndexesReady === 'function' ? connectDB.areIndexesReady() : false;
    if (process.env.NODE_ENV !== 'test' && (!dbReady || !indexesReady)) {
        return res.status(503).json({
            status: 'degraded',
            dbReady,
            indexesReady,
            message: !dbReady ? 'Database connection is not ready.' : 'Database indexes are not ready.'
        });
    }
    res.status(200).json({
        status: 'ok',
        dbReady,
        indexesReady,
        message: 'G-TRAMS API is running smoothly.'
    });
});

const { errorHandler, notFound } = require('./src/middleware/errorMiddleware');

// Handle 404
app.use(notFound);

// Global error handling middleware (handles Multer errors, validation errors, etc.)
app.use(errorHandler);

// Initialize Socket.IO
initSocket(server);

// Initialize Cron Jobs
if (process.env.NODE_ENV !== 'test') {
    const { startCleanupJobs } = require('./src/jobs/cleanupJobs');
    const { startFranchiseCronJobs } = require('./src/services/cronService');
    startCleanupJobs();
    void databaseConnection.then(startFranchiseCronJobs);
}

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`server running on port ${PORT}`);
    });
}

module.exports = { app, server };
