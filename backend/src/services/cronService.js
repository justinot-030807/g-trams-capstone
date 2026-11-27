const cron = require('node-cron');
const { Types } = require('mongoose');
const Franchise = require('../models/franchiseModel');
const Violation = require('../models/violationModel');
const Notification = require('../models/notificationModel');
const SystemSettings = require('../models/systemSettingsModel');
const { emitToUser } = require('../config/socket');
const { sendPushToUser } = require('./pushService');
const { beginRestoreSensitiveWork, createBackupFile } = require('./backupService');
const { OPERATING_STATUSES, CURRENT_TERM_STATUSES, issuedPermitSnapshotQuery } = require('../utils/issuedPermit');
const { 
    MANILA_TIMEZONE, 
    getManilaNow, 
    calculateDaysRemaining, 
    formatManilaDate,
    computeManilaExpiryDate
} = require('../utils/phTime');

const withoutIssuedSnapshot = { $nor: [issuedPermitSnapshotQuery()] };
const issuedPermitFields = [
    { scope: withoutIssuedSnapshot, statusField: 'status', expiryField: 'expiryDate' },
    { scope: issuedPermitSnapshotQuery(), statusField: 'previousStatus', expiryField: 'previousExpiryDate' }
];
const completedSuspension = { suspensionEndDate: null, suspensionReason: '', currentSanction: 'Warning' };
const expiryNotificationTitle = 'Franchise Permit Expired';

async function deliverPendingExpiryNotifications() {
    const pendingFranchises = await Franchise.find({ 'pendingExpiryNotifications.0': { $exists: true } })
        .select('_id pendingExpiryNotifications').lean();

    for (const franchise of pendingFranchises) {
        for (const pending of franchise.pendingExpiryNotifications) {
            let notification;
            try {
                notification = await Notification.create({
                    _id: pending._id,
                    recipient: pending.recipient,
                    type: 'status_change',
                    title: expiryNotificationTitle,
                    message: pending.message,
                    relatedFranchise: franchise._id
                });
            } catch (error) {
                // The event ID is also the notification ID, so retries and concurrent workers share one insert.
                if (error.code !== 11000 || error.keyPattern?._id !== 1) {
                    console.error('[CRON] Error persisting expiry notification:', error.message);
                    continue;
                }
            }

            await Franchise.updateOne(
                { _id: franchise._id, 'pendingExpiryNotifications._id': pending._id },
                { $pull: { pendingExpiryNotifications: { _id: pending._id } } },
                { timestamps: false }
            ).catch(error => console.error('[CRON] Error clearing delivered expiry notification:', error.message));

            if (!notification) continue;
            try {
                emitToUser(String(pending.recipient), 'notification', notification);
                await sendPushToUser(pending.recipient, {
                    title: expiryNotificationTitle,
                    message: pending.message,
                    url: `/renew-franchise/${franchise._id}`,
                    type: 'status_change'
                });
            } catch (error) {
                console.warn('[CRON] Expiry notification delivery failed:', error.message);
            }
        }
    }
}

/**
 * Reconcile issued-permit expiration and completed suspensions in MongoDB.
 * An ended suspension restores operating status only while the issued term is still valid.
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

        const settings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean().catch(() => null);
        const validityNew = Number(settings?.validityNew) > 0 ? Number(settings.validityNew) : 3;
        const validityRenew = Number(settings?.validityRenew) > 0 ? Number(settings.validityRenew) : 1;

        // Backfill legacy issued permits using the configured term validity.
        const missingExpiryDocs = await Franchise.find({
            ...withoutIssuedSnapshot,
            status: { $in: CURRENT_TERM_STATUSES },
            expiryDate: null
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
                        ...withoutIssuedSnapshot,
                        status: { $in: CURRENT_TERM_STATUSES },
                        expiryDate: null,
                        approvalDate: doc.approvalDate ?? null,
                        dateApplied: doc.dateApplied ?? null,
                        applicationType: doc.applicationType ?? null
                    },
                    { $set: { expiryDate: computedExpiry } }
                );
            }
        }

        // Never auto-reinstate a Suspended franchise whose suspension fine is still unpaid.
        const unpaidSuspensionFranchiseIds = await Violation.distinct('franchise', {
            status: 'Active',
            'sanction.type': 'Suspension',
            'sanction.fineAmount': { $gt: 0 }
        });

        let synchronizedCount = 0;
        for (const { scope, statusField, expiryField } of issuedPermitFields) {
            const endedSuspension = {
                [statusField]: 'Suspended',
                suspensionEndDate: { $ne: null, $lte: now }
            };
            await Franchise.updateMany(
                {
                    ...scope,
                    ...endedSuspension,
                    ...(unpaidSuspensionFranchiseIds.length > 0 ? { _id: { $nin: unpaidSuspensionFranchiseIds } } : {}),
                    [expiryField]: { $gt: now }
                },
                {
                    $set: {
                        [statusField]: 'Active - Under Warning',
                        ...completedSuspension
                    }
                }
            );

            // A suspension remains in force for its full duration, even if the term ends first.
            const operating = { [statusField]: { $in: OPERATING_STATUSES } };
            const candidates = await Franchise.find({
                ...scope,
                $and: [{ $or: [operating, endedSuspension] }],
                [expiryField]: { $ne: null, $lte: now }
            }).select(`_id operator plateNo ${statusField} ${expiryField}`).lean();

            for (const doc of candidates) {
                const suspensionEnded = doc[statusField] === 'Suspended';
                const effectiveExpiry = doc[expiryField];
                const pendingNotification = doc.operator && {
                    _id: new Types.ObjectId(),
                    recipient: doc.operator,
                    message: `Your franchise permit for unit ${doc.plateNo || 'Tricycle'} expired on ${formatManilaDate(effectiveExpiry)}. Please submit your renewal application to avoid penalties and continue operations.`
                };
                // Recheck the observed term so a concurrent release or validity correction wins.
                const result = await Franchise.updateOne(
                    {
                        ...scope,
                        ...(suspensionEnded ? endedSuspension : operating),
                        _id: doc._id,
                        [expiryField]: effectiveExpiry,
                        operator: doc.operator ?? null
                    },
                    {
                        $set: {
                            [statusField]: 'Expired',
                            ...(suspensionEnded ? completedSuspension : {})
                        },
                        ...(pendingNotification && { $push: { pendingExpiryNotifications: pendingNotification } })
                    }
                );
                synchronizedCount += result.modifiedCount;
            }
        }

        await deliverPendingExpiryNotifications();
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

        // Retrieve configured warning window from System Settings
        const settings = await SystemSettings.findOne().lean();
        const warningDays = Number(settings?.expiryWarningDays) || 30;

        const warningThreshold = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Find active franchises within the renewal window that haven't received a reminder in the last 7 days
        const dueFranchises = await Franchise.find({
            ...withoutIssuedSnapshot,
            status: { $in: OPERATING_STATUSES },
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
                    ...withoutIssuedSnapshot,
                    status: { $in: OPERATING_STATUSES },
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
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const result = await Franchise.updateMany(
            { 
                ...withoutIssuedSnapshot,
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
    syncFranchiseStatuses()
        .then(() => sendRenewalReminders())
        .catch(err => console.error('[CRON] Startup maintenance error:', err));

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
