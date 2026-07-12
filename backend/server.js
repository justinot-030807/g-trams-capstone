require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

// TAMA NA ANG PATH NITO NGAYON (nilagyan natin ng /src)
const todaRoutes = require('./src/routes/todaRoutes'); 

const app = express();
connectDB();

// configure cors for the deployed vercel frontend and local development
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://g-trams-official.vercel.app' // <--- Ito ang bago mong Vercel domain
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Para mabasa ang uploaded files mula sa frontend
app.use('/uploads', express.static('uploads')); 

const PORT = process.env.PORT || 3000;
const BASE_URI = process.env.BASE_URI || '/api/v1';

// auth routes
const authRoutes = require('./src/routes/authRoutes');
app.use(`${BASE_URI}/auth`, authRoutes);

// franchise routes
const franchiseRoutes = require('./src/routes/franchiseRoutes');
app.use(`${BASE_URI}/franchises`, franchiseRoutes);

// calendar and report routes
app.use(`${BASE_URI}/calendar`, require('./src/routes/calendarRoutes'));


// BAGONG TODA ROUTE (Inilipat natin sa taas bago ang app.listen)
app.use(`${BASE_URI}/toda`, todaRoutes); 

// server initialization
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});