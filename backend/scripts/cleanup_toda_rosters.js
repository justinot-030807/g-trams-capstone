const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SCRIPT !== 'true') {
    console.error('Refusing to run cleanup_toda_rosters in production without ALLOW_PROD_SCRIPT=true.');
    process.exit(1);
}

const mongoUri = String(process.env.MONGO_URI || '').trim();
if (!mongoUri) {
    console.error('Refusing to run cleanup_toda_rosters: MONGO_URI is not set.');
    process.exit(1);
}
if (/prod|production|live/i.test(mongoUri) && process.env.ALLOW_PROD_SCRIPT !== 'true') {
    console.error('Refusing to run cleanup_toda_rosters: MONGO_URI appears to target a production database without ALLOW_PROD_SCRIPT=true.');
    process.exit(1);
}
if (process.env.CONFIRM_SCRIPT_RUN !== 'true' && !/localhost|127\.0\.0\.1|test|dev|staging|demo|sandbox/i.test(mongoUri) && process.env.ALLOW_PROD_SCRIPT !== 'true') {
    console.error('Refusing to run destructive cleanup script against an unrecognized remote MONGO_URI without CONFIRM_SCRIPT_RUN=true.');
    process.exit(1);
}

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
