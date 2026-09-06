require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Routes
const todaRoutes = require('./src/routes/todaRoutes'); 

const app = express();
app.set('trust proxy', 1);
connectDB();

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://g-trams-official.vercel.app'
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Start server
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});