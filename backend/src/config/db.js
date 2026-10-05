const dns = require('node:dns');
if (dns && typeof dns.setServers === 'function') {
    try { dns.setServers(['1.1.1.1', '8.8.8.8']); } catch {}
}

const mongoose = require('mongoose');

const connectDB = async () => {
    if (process.env.NODE_ENV === 'test') {
        return;
    }
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Ensure Franchise partial unique indexes are aligned
        const Franchise = require('../models/franchiseModel');
        Franchise.init().catch(err => console.warn('Franchise index init notice:', err.message));
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;