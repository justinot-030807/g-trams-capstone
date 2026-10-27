const cron = require('node-cron');
const Franchise = require('../models/franchiseModel');
const Notification = require('../models/notificationModel');
const SystemSettings = require('../models/systemSettingsModel');
const { emitToUser } = require('../config/socket');
const { sendPushToUser } = require('./pushService');
const { 
    MANILA_TIMEZONE, 
    getManilaNow, 
    calculateDaysRemaining, 
    formatManilaDate 
} = require('../utils/phTime');

/**
 * Synchronize expired franchises in MongoDB
 * Identifies all 'Active' franchises that have reached their expiration date
 * and transitions their status to 'Expired', notifying the operator.
 */
async function syncFranchiseStatuses() {
    try {
        const now = getManilaNow();
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Find active franchises that have expired
        const expiredFranchises = await Franchise.find({
            status: 'Active',
            $or: [
                { expiryDate: { $lte: now } },
                { expiryDate: null, approvalDate: { $lte: oneYearAgo } }
            ]
        }).populate('operator', 'name contact');

        if (expiredFranchises.length === 0) {
            return { count: 0 };
        }

        console.log(`[CRON] Found ${expiredFranchises.length} active franchise(s) past expiration date. Synchronizing to 'Expired'...`);

        for (const franchise of expiredFranchises) {
            franchise.status = 'Expired';
            if (!franchise.expiryDate && franchise.approvalDate) {
                const calculatedExp = new Date(franchise.approvalDate);
                calculatedExp.setFullYear(calculatedExp.getFullYear() + 1);
                franchise.expiryDate = calculatedExp;
            }
            await franchise.save();

            // Notify operator of expiration
            const operatorId = franchise.operator?._id || franchise.operator;
            if (operatorId) {
                const expiryFormatted = formatManilaDate(franchise.expiryDate || now);
                const notifTitle = 'Franchise Permit Expired';
                const notifMessage = `Your franchise permit for unit ${franchise.plateNo || 'Tricycle'} expired on ${expiryFormatted}. Please submit your renewal application to avoid penalties and continue operations.`;

                try {
                    const notif = await Notification.create({
                        recipient: operatorId,
                        type: 'status_change',
                        title: notifTitle,
                        message: notifMessage,
                        relatedFranchise: franchise._id
                    });

                    emitToUser(String(operatorId), 'notification', notif);
                    sendPushToUser(operatorId, {
                        title: notifTitle,
                        message: notifMessage,
                        url: `/renew-franchise/${franchise._id}`,
                        type: 'status_change'
                    }).catch(err => console.warn('[CRON] Push alert failed:', err.message));
                } catch (notifErr) {
                    console.error('[CRON] Error notifying operator of expiration:', notifErr.message);
                }
            }
        }

        console.log(`[CRON] Successfully synchronized ${expiredFranchises.length} franchise(s) to 'Expired'.`);
        return { count: expiredFranchises.length };
    } catch (error) {
        console.error('[CRON ERROR] Error in syncFranchiseStatuses:', error);
        return { error: error.message };
    }
}

/**
 * Dispatch 30-day renewal reminder notifications to operators
 * Checks for Active franchises expiring within expiryWarningDays (default 30 days)
 * Throttles alerts to avoid sending duplicate reminders within 7 days.
 */
async function sendRenewalReminders() {
    try {
        const now = getManilaNow();

        // Retrieve configured warning window from System Settings
        const settings = await SystemSettings.findOne().lean();
        const warningDays = Number(settings?.expiryWarningDays) || 30;

        const warningThreshold = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Find active franchises within the renewal window that haven't received a reminder in the last 7 days
        const dueFranchises = await Franchise.find({
            status: 'Active',
            expiryDate: { $gt: now, $lte: warningThreshold },
            $or: [
                { lastRenewalReminderSentAt: null },
                { lastRenewalReminderSentAt: { $lt: sevenDaysAgo } }
            ]
        }).populate('operator', 'name contact');

        if (dueFranchises.length === 0) {
            return { count: 0 };
        }

        console.log(`[CRON] Dispatching renewal reminders for ${dueFranchises.length} franchise(s) expiring within ${warningDays} days...`);

        for (const franchise of dueFranchises) {
            const operatorId = franchise.operator?._id || franchise.operator;
            const daysLeft = calculateDaysRemaining(franchise.expiryDate, now);
            const formattedExpiry = formatManilaDate(franchise.expiryDate);

            const notifTitle = `Renewal Reminder: ${daysLeft} Day${daysLeft === 1 ? '' : 's'} Remaining`;
            const notifMessage = `Your franchise permit for unit ${franchise.plateNo || 'Tricycle'} will expire on ${formattedExpiry} (${daysLeft} days remaining). The annual renewal window is now open.`;

            try {
                if (operatorId) {
                    const notif = await Notification.create({
                        recipient: operatorId,
                        type: 'renewal_reminder',
                        title: notifTitle,
                        message: notifMessage,
                        relatedFranchise: franchise._id
                    });

                    emitToUser(String(operatorId), 'notification', notif);
                    sendPushToUser(operatorId, {
                        title: notifTitle,
                        message: notifMessage,
                        url: `/renew-franchise/${franchise._id}`,
                        type: 'renewal_reminder'
                    }).catch(err => console.warn('[CRON] Renewal push alert failed:', err.message));

                    // Dispatch automated 30-day expiration SMS alert & record audit log
                    const { dispatchExpirationSms } = require('./notificationService');
                    await dispatchExpirationSms({
                        franchise,
                        daysRemaining: daysLeft,
                        simulated: true
                    }).catch(smsErr => console.warn('[CRON] SMS dispatch failed:', smsErr.message));
                }

                // Update timestamp to throttle future reminders
                franchise.lastRenewalReminderSentAt = now;
                await franchise.save();
            } catch (err) {
                console.error(`[CRON] Failed to send renewal reminder for ${franchise.plateNo}:`, err.message);
            }
        }

        console.log(`[CRON] Successfully sent ${dueFranchises.length} renewal reminder(s).`);
        return { count: dueFranchises.length };
    } catch (error) {
        console.error('[CRON ERROR] Error in sendRenewalReminders:', error);
        return { error: error.message };
    }
}

/**
 * Auto-archive franchises that have been expired for over 1 year
 */
async function autoArchiveOldExpired() {
    try {
        const now = getManilaNow();
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const result = await Franchise.updateMany(
            { 
                status: 'Expired', 
                updatedAt: { $lt: oneYearAgo }, 
                isArchived: { $ne: true } 
            },
            { 
                $set: { isArchived: true, archivedAt: now } 
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`[CRON] Auto-Archived ${result.modifiedCount} long-expired franchise(s).`);
        }
        return { modifiedCount: result.modifiedCount };
    } catch (error) {
        console.error('[CRON ERROR] Error in autoArchiveOldExpired:', error);
        return { error: error.message };
    }
}

/**
 * Initialize all franchise background cron jobs
 * Scheduled at 00:00:00 midnight in Philippine Standard Time (UTC+8 / Asia/Manila)
 */
function startFranchiseCronJobs() {
    console.log(`[CRON] Initializing G-TRAMS Franchise Cron Engine (${MANILA_TIMEZONE})...`);

    // Run catch-up pass on server startup
    syncFranchiseStatuses().catch(err => console.error('[CRON] Startup sync error:', err));
    sendRenewalReminders().catch(err => console.error('[CRON] Startup reminder error:', err));

    // Daily Midnight Cron Job at 00:00:00 (Asia/Manila)
    const midnightTask = cron.schedule('0 0 * * *', async () => {
        console.log(`[CRON] Running daily midnight maintenance tasks at ${new Date().toISOString()} (${MANILA_TIMEZONE})...`);
        await syncFranchiseStatuses();
        await sendRenewalReminders();
        await autoArchiveOldExpired();
        console.log('[CRON] Daily midnight maintenance tasks completed.');
    }, {
        scheduled: true,
        timezone: MANILA_TIMEZONE
    });

    return midnightTask;
}

module.exports = {
    syncFranchiseStatuses,
    sendRenewalReminders,
    autoArchiveOldExpired,
    startFranchiseCronJobs
};
