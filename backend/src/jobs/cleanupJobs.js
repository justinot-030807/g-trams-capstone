const cron = require('node-cron');
const User = require('../models/userModel');

const startCleanupJobs = () => {
    // Run every hour to clear abandoned unverified accounts that are older than 24 hours
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('[CRON] Starting cleanup job for expired OTPs and unverified accounts...');
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            // Find and delete users who are not verified and created more than 24 hours ago
            const result = await User.deleteMany({
                isVerified: false,
                createdAt: { $lt: oneDayAgo }
            });
            
            if (result.deletedCount > 0) {
                console.log(`[CRON] Cleaned up ${result.deletedCount} unverified abandoned accounts.`);
            }
            
            // Clear OTP fields for users who have expired OTP fields
            const otpResult = await User.updateMany(
                { otpExpire: { $lt: Date.now() } },
                { $unset: { otp: 1, otpExpire: 1 } }
            );

        } catch (error) {
            console.error('[CRON ERROR]', error);
        }
    });
};

module.exports = { startCleanupJobs };
