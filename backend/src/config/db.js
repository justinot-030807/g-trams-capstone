const dns = require('node:dns');
if (dns && typeof dns.setServers === 'function') {
    try { dns.setServers(['1.1.1.1', '8.8.8.8']); } catch {}
}

const mongoose = require('mongoose');

let indexesReady = false;

const connectDB = async () => {
    if (process.env.NODE_ENV === 'test') {
        return;
    }
    if (!process.env.MONGO_URI || !String(process.env.MONGO_URI).trim()) {
        console.error('Fatal: MONGO_URI environment variable is not configured.');
        process.exit(1);
    }
    try {
        indexesReady = false;
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Ensure Franchise partial unique indexes and core model indexes are aligned
        const Franchise = require('../models/franchiseModel');
        const User = require('../models/userModel');
        const TodaRoster = require('../models/todaModel');
        await Promise.all([
            Franchise.syncIndexes(),
            User.syncIndexes(),
            TodaRoster.syncIndexes()
        ])
            .then(() => {
                indexesReady = true;
            })
            .catch(err => {
                indexesReady = false;
                console.warn('Model index sync notice:', err.message);
            });
    } catch (error) {
        indexesReady = false;
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB.isReady = () => mongoose.connection.readyState === 1;
// A transient driver reconnect does not discard the indexes checked at startup.
connectDB.areIndexesReady = () => connectDB.isReady() && (process.env.NODE_ENV === 'test' || indexesReady);

module.exports = connectDB;
