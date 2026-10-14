const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TodaSubmission = require('../src/models/todaSubmission');
const TodaRemovalRequest = require('../src/models/todaRemovalRequest');

async function cleanTodaSubmissions() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const submissionCount = await TodaSubmission.countDocuments();
        console.log(`Found ${submissionCount} TodaSubmission records.`);
        const delSubs = await TodaSubmission.deleteMany({});
        console.log(`Deleted ${delSubs.deletedCount} TodaSubmission records.`);

        const removalCount = await TodaRemovalRequest.countDocuments();
        console.log(`Found ${removalCount} TodaRemovalRequest records.`);
        const delRemovals = await TodaRemovalRequest.deleteMany({});
        console.log(`Deleted ${delRemovals.deletedCount} TodaRemovalRequest records.`);

        console.log('TODA collections successfully cleaned for fresh dry-run.');
    } catch (err) {
        console.error('Cleanup error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

cleanTodaSubmissions();
