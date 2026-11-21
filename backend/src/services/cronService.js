const cron = require('node-cron');
const Franchise = require('../models/franchiseModel');
const Notification = require('../models/notificationModel');
const SystemSettings = require('../models/systemSettingsModel');
const { emitToUser } = require('../config/socket');
const { sendPushToUser } = require('./pushService');
const { beginRestoreSensitiveWork, createBackupFile } = require('./backupService');
const { 
    MANILA_TIMEZONE, 
    getManilaNow, 
    calculateDaysRemaining, 
    formatManilaDate,
    computeManilaExpiryDate,
    isExpired
} = require('../utils/phTime');

/**
 * Synchronize expired franchises in MongoDB
 * Identifies all 'Active' / 'Active - Under Warning' franchises that have reached their expiration date
 * and atomically transitions their status to 'Expired', notifying the operator ONLY on successful transition.
 */
async function syncFranchiseStatuses() {
    let release;
    try {
        release = await beginRestoreSensitiveWork();
        if (!release) {
            console.log('[CRON] Skipping syncFranchiseStatuses: database restore in progress.');
            return { count: 0, skipped: true };
        }

        const now = getManilaNow();
        await Franchise.updateMany({ status: 'Suspended', suspensionEndDate: { $ne: null, $lte: now } }, { $set: { status: 'Active - Under Warning', suspensionEndDate: null, currentSanction: 'Warning' } }).catch(() => {});

        const settings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean().catch(() => null);
        const validityNew = Number(settings?.validityNew) > 0 ? Number(settings.validityNew) : 3;
        const validityRenew = Number(settings?.validityRenew) > 0 ? Number(settings.validityRenew) : 1;

        // Reconcile any legacy active permits missing an explicit expiryDate using configured term validity
        const missingExpiryDocs = await Franchise.find({
            status: { $in: ['Active', 'Active - Under Warning'] },
            $or: [{ expiryDate: null }, { expiryDate: { $exists: false } }]
        }).select('_id applicationType approvalDate dateApplied').lean();

        for (const doc of missingExpiryDocs) {
            const baseDate = doc.approvalDate || doc.dateApplied;
            if (!baseDate) continue;
            const termYears = doc.applicationType === 'Renewal' ? validityRenew : validityNew;
            const computedExpiry = computeManilaExpiryDate(baseDate, termYears);
            if (computedExpiry) {
                await Franchise.updateOne(
                    {
                        _id: doc._id,
                        $or: [{ expiryDate: null }, { expiryDate: { $exists: false } }]
                    },
                    { $set: { expiryDate: computedExpiry } }
                );
            }
        }

        // Query lean candidate active permits (avoids post-init dirty-tracking no-op on franchise.save())
        const candidateFranchises = await Franchise.find({
            status: { $in: ['Active', 'Active - Under Warning'] },
            expiryDate: { $ne: null, $lte: now }
        })
            .select('_id operator plateNo mtopNo expiryDate approvalDate dateApplied applicationType status')
            .lean();

        if (candidateFranchises.length === 0) {
            return { count: 0 };
        }

        const expiredCandidates = candidateFranchises.filter((doc) => {
            const termYears = doc.applicationType === 'Renewal' ? validityRenew : validityNew;
            const effectiveExpiry = doc.expiryDate
                || (doc.approvalDate ? computeManilaExpiryDate(doc.approvalDate, termYears) : null)
                || (doc.dateApplied ? computeManilaExpiryDate(doc.dateApplied, termYears) : null);
            if (!effectiveExpiry) return false;
            return isExpired(effectiveExpiry, now) || new Date(effectiveExpiry).getTime() <= now.getTime();
        });

        if (expiredCandidates.length === 0) {
            return { count: 0 };
        }

        console.log(`[CRON] Found ${expiredCandidates.length} active franchise(s) past expiration date. Synchronizing atomically to 'Expired'...`);

        let synchronizedCount = 0;

        for (const doc of expiredCandidates) {
            const termYears = doc.applicationType === 'Renewal' ? validityRenew : validityNew;
            const effectiveExpiry = doc.expiryDate
                || (doc.approvalDate ? computeManilaExpiryDate(doc.approvalDate, termYears) : null)
                || (doc.dateApplied ? computeManilaExpiryDate(doc.dateApplied, termYears) : null)
                || now;

            // Atomic conditional DB write: guarantees DB persistence and prevents duplicate notifications across instances
            const transitioned = await Franchise.findOneAndUpdate(
                {
                    _id: doc._id,
                    status: { $in: ['Active', 'Active - Under Warning'] }
                },
                {
                    $set: {
                        status: 'Expired',
                        expiryDate: effectiveExpiry
                    }
                },
                { returnDocument: 'after' }
            ).lean();

            if (!transitioned) {
                continue;
            }

            synchronizedCount += 1;

            // Notify operator ONLY after atomic DB transition succeeds
            const operatorId = transitioned.operator?._id || transitioned.operator || doc.operator;
            if (operatorId) {
                const expiryFormatted = formatManilaDate(effectiveExpiry);
                const notifTitle = 'Franchise Permit Expired';
                const notifMessage = `Your franchise permit for unit ${transitioned.plateNo || doc.plateNo || 'Tricycle'} expired on ${expiryFormatted}. Please submit your renewal application to avoid penalties and continue operations.`;

                try {
                    const notif = await Notification.create({
                        recipient: operatorId,
                        type: 'status_change',
                        title: notifTitle,
                        message: notifMessage,
                        relatedFranchise: doc._id
                    });

                    emitToUser(String(operatorId), 'notification', notif);
                    await sendPushToUser(operatorId, {
                        title: notifTitle,
                        message: notifMessage,
                        url: `/renew-franchise/${doc._id}`,
                        type: 'status_change'
                    }).catch(err => console.warn('[CRON] Push alert failed:', err.message));
                } catch (notifErr) {
                    console.error('[CRON] Error notifying operator of expiration:', notifErr.message);
                }
            }
        }

        console.log(`[CRON] Successfully synchronized ${synchronizedCount} franchise(s) to 'Expired'.`);
        return { count: synchronizedCount };
    } catch (error) {
        console.error('[CRON ERROR] Error in syncFranchiseStatuses:', error);
        return { error: error.message };
    } finally {
        if (release) await release();
    }
}

/**
 * Dispatch 30-day renewal reminder notifications to operators
 * Checks for Active franchises expiring within expiryWarningDays (default 30 days)
 * Throttles alerts to avoid sending duplicate reminders within 7 days.
 */
async function sendRenewalReminders() {
    let release;
    try {
        release = await beginRestoreSensitiveWork();
        if (!release) {
            console.log('[CRON] Skipping sendRenewalReminders: database restore in progress.');
            return { count: 0, selectedCount: 0, skipped: true };
        }
        const now = getManilaNow();
        await Franchise.updateMany({ status: 'Suspended', suspensionEndDate: { $ne: null, $lte: now } }, { $set: { status: 'Active - Under Warning', suspensionEndDate: null, currentSanction: 'Warning' } }).catch(() => {});

        // Retrieve configured warning window from System Settings
        const settings = await SystemSettings.findOne().lean();
        const warningDays = Number(settings?.expiryWarningDays) || 30;

        const warningThreshold = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Find active franchises within the renewal window that haven't received a reminder in the last 7 days
        const dueFranchises = await Franchise.find({
            status: { $in: ['Active', 'Active - Under Warning'] },
            expiryDate: { $gt: now, $lte: warningThreshold },
            $or: [
                { lastRenewalReminderSentAt: null },
                { lastRenewalReminderSentAt: { $lt: sevenDaysAgo } }
            ]
        }).populate('operator', 'name contact');

        if (dueFranchises.length === 0) {
            return { count: 0, selectedCount: 0 };
        }

        console.log(`[CRON] Dispatching renewal reminders for ${dueFranchises.length} franchise(s) expiring within ${warningDays} days...`);

        let sentCount = 0;
        for (const franchise of dueFranchises) {
            const operatorId = franchise.operator?._id || franchise.operator;
            if (!operatorId) {
                continue;
            }

            // Atomically claim the 7-day throttle window BEFORE dispatching notifications
            const priorThrottleAt = franchise.lastRenewalReminderSentAt || null;
            const claimedFranchise = await Franchise.findOneAndUpdate(
                {
                    _id: franchise._id,
                    status: { $in: ['Active', 'Active - Under Warning'] },
                    expiryDate: { $gt: now, $lte: warningThreshold },
                    $or: [
                        { lastRenewalReminderSentAt: null },
                        { lastRenewalReminderSentAt: { $lt: sevenDaysAgo } }
                    ]
                },
                { $set: { lastRenewalReminderSentAt: now } },
                { returnDocument: 'after' }
            );
            if (!claimedFranchise) {
                continue;
            }

            const daysLeft = calculateDaysRemaining(franchise.expiryDate, now);
            const safeDays = daysLeft !== null ? daysLeft : 0;
            const formattedExpiry = formatManilaDate(franchise.expiryDate);

            const notifTitle = `Renewal Reminder: ${safeDays} Day${safeDays === 1 ? '' : 's'} Remaining`;
            const notifMessage = `Your franchise permit for unit ${franchise.plateNo || 'Tricycle'} will expire on ${formattedExpiry}${daysLeft !== null ? ` (${daysLeft} days remaining)` : ''}. The annual renewal window is now open.`;

            try {
                const notif = await Notification.create({
                    recipient: operatorId,
                    type: 'renewal_reminder',
                    title: notifTitle,
                    message: notifMessage,
                    relatedFranchise: franchise._id
                });

                emitToUser(String(operatorId), 'notification', notif);
                await sendPushToUser(operatorId, {
                    title: notifTitle,
                    message: notifMessage,
                    url: `/renew-franchise/${franchise._id}`,
                    type: 'renewal_reminder'
                }).catch(err => console.warn('[CRON] Renewal push alert failed:', err.message));

                // Record 30-day expiration SMS audit log without sending a duplicate gateway SMS
                // (since Notification.create above already triggers dispatchNotificationEmail which sends SMS)
                const { dispatchExpirationSms } = require('./notificationService');
                await dispatchExpirationSms({
                    franchise,
                    daysRemaining: daysLeft,
                    simulated: true,
                    skipGatewaySend: true
                }).catch(smsErr => console.warn('[CRON] SMS dispatch failed:', smsErr.message));

                sentCount += 1;
            } catch (err) {
                console.error(`[CRON] Failed to send renewal reminder for ${franchise.plateNo}:`, err.message);
                await Franchise.updateOne(
                    { _id: franchise._id, lastRenewalReminderSentAt: now },
                    { $set: { lastRenewalReminderSentAt: priorThrottleAt } }
                ).catch(() => {});
            }
        }

        console.log(`[CRON] Successfully sent ${sentCount} of ${dueFranchises.length} selected renewal reminder(s).`);
        return { count: sentCount, selectedCount: dueFranchises.length };
    } catch (error) {
        console.error('[CRON ERROR] Error in sendRenewalReminders:', error);
        return { error: error.message };
    } finally {
        if (release) await release();
    }
}

/**
 * Auto-archive franchises that have been expired for over 1 year
 */
async function autoArchiveOldExpired() {
    let release;
    try {
        release = await beginRestoreSensitiveWork();
        if (!release) {
            console.log('[CRON] Skipping autoArchiveOldExpired: database restore in progress.');
            return { modifiedCount: 0, skipped: true };
        }
        const now = getManilaNow();
        await Franchise.updateMany({ status: 'Suspended', suspensionEndDate: { $ne: null, $lte: now } }, { $set: { status: 'Active - Under Warning', suspensionEndDate: null, currentSanction: 'Warning' } }).catch(() => {});
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
    } finally {
        if (release) await release();
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

    // Weekly Automated Database Backup at Sunday 00:00:00 (Asia/Manila)
    cron.schedule('0 0 * * 0', async () => {
        let release;
        try {
            release = await beginRestoreSensitiveWork();
            if (!release) {
                console.log('[CRON] Skipping weekly automated database backup: database restore in progress.');
                return;
            }
            console.log(`[CRON] Running weekly automated database backup at ${new Date().toISOString()} (${MANILA_TIMEZONE})...`);
            const res = await createBackupFile({
                isAutomated: true,
                triggeredBy: 'Weekly Automated Cron',
                notes: 'Automated weekly system maintenance snapshot'
            });
            console.log(`[CRON] Weekly automated database backup completed: ${res.filename} (${(res.sizeBytes / 1024).toFixed(1)} KB)`);
        } catch (backupErr) {
            console.error('[CRON ERROR] Failed to create automated weekly database backup:', backupErr.message);
        } finally {
            if (release) await release();
        }
    }, {
        scheduled: true,
        timezone: MANILA_TIMEZONE
    });

    // Keepalive ping every 10 minutes on Render to prevent cold-start sleep during daytime/UAT
    if (process.env.NODE_ENV !== 'test') {
        const https = require('https');
        const keepAliveUrl = `${(process.env.RENDER_EXTERNAL_URL || 'https://g-trams-web2.onrender.com').replace(/\/+$/, '')}/api/v1/health`;
        cron.schedule('*/10 * * * *', () => {
            https.get(keepAliveUrl, (res) => {
                res.resume();
            }).on('error', () => {});
        }, {
            scheduled: true,
            timezone: MANILA_TIMEZONE
        });
    }

    return midnightTask;
}

module.exports = {
    syncFranchiseStatuses,
    sendRenewalReminders,
    autoArchiveOldExpired,
    startFranchiseCronJobs
};
