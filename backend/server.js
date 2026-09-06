require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const mongoSanitize = require('./src/middleware/sanitize');

// Routes
const todaRoutes = require('./src/routes/todaRoutes'); 
const auditLogRoutes = require('./src/routes/auditLogRoutes');

const app = express();
app.set('trust proxy', 1);
connectDB();

// HTTP Security Headers (Helmet)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
}));

// CORS configuration with strict origin enforcement
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://g-trams-official.vercel.app'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow mobile apps, curl, or server-to-server requests without Origin header
        if (!origin) return callback(null, true);
        
        if (
            ALLOWED_ORIGINS.includes(origin) ||
            origin.endsWith('.vercel.app')
        ) {
            return callback(null, true);
        }
        return callback(new Error(`Blocked by CORS policy: Origin ${origin} not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with payload size limits to prevent DOS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL Injection sanitization
app.use(mongoSanitize);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads')); 

const PORT = process.env.PORT || 3000;
const BASE_URI = process.env.BASE_URI || '/api/v1';

// Auth routes
const authRoutes = require('./src/routes/authRoutes');
app.use(`${BASE_URI}/auth`, authRoutes);

// Franchise routes
const franchiseRoutes = require('./src/routes/franchiseRoutes');
app.use(`${BASE_URI}/franchises`, franchiseRoutes);

// TODA routes
app.use(`${BASE_URI}/toda`, todaRoutes); 

// System settings routes
app.use(`${BASE_URI}/settings`, require('./src/routes/systemSettingsRoutes'));

// Audit logs routes (Admin only)
app.use(`${BASE_URI}/audit-logs`, auditLogRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});