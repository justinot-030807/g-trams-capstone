const axios = require('axios');
const SmsLog = require('../models/smsLogModel');
const { emitToUser, getIO } = require('../config/socket');
const { getManilaNow, formatManilaDate } = require('../utils/phTime');

/**
 * Normalizes a phone number to standard Philippine mobile formats:
 * Converts 09XXXXXXXXX -> +639XXXXXXXXX
 */
function normalizePhoneNumber(raw) {
    if (!raw) return '+639170000000';
    let clean = String(raw).replace(/[^0-9+]/g, '');
    if (clean.startsWith('09')) {
        clean = '+63' + clean.substring(1);
    } else if (clean.startsWith('639')) {
        clean = '+' + clean;
    } else if (!clean.startsWith('+63') && clean.length === 10 && clean.startsWith('9')) {
        clean = '+63' + clean;
    }
    return clean;
}

/**
 * Dispatches an automated 30-day expiration SMS alert (live or simulated)
 * and records the dispatch in the SmsLog audit database.
 */
async function dispatchExpirationSms({
    franchise,
    daysRemaining = 30,
    simulated = true,
    customPhone = null
}) {
    try {
        const now = getManilaNow();
        const operator = franchise?.operator || {};
        const recipientPhone = normalizePhoneNumber(customPhone || operator.contact || franchise?.contact || '09170001234');
        const recipientName = operator.name || franchise?.fullName || 'Tricycle Operator';
        const plateNo = franchise?.plateNo || 'Tricycle Unit';
        const bodyNumber = franchise?.bodyNumber || '';
        const expiryDateStr = franchise?.expiryDate ? formatManilaDate(franchise.expiryDate) : 'sa loob ng 30 araw';

        const message = `[G-TRAMS LGU] Paalala: Ang inyong MTOP prangkisa para sa unit ${plateNo}${bodyNumber ? ` (Body #${bodyNumber})` : ''} ay mag-e-expire sa loob ng ${daysRemaining} araw (${expiryDateStr}). Mangyaring mag-renew sa BPLO Gasan upang maiwasan ang multa at pagkahuli.`;

        let status = 'SIMULATED';
        const apiKey = process.env.SEMAPHORE_API_KEY;

        // If live API key is present and simulation is explicitly turned off
        if (apiKey && !simulated && apiKey !== 'mock_key' && apiKey !== 'test_key') {
            try {
                await axios.post('https://api.semaphore.co/api/v4/messages', {
                    apikey: apiKey,
                    number: recipientPhone,
                    message: message,
                    sendername: 'GTRAMS'
                }, { timeout: 8000 });
                status = 'DELIVERED';
            } catch (apiErr) {
                console.warn('[notificationService] Semaphore SMS gateway call failed, logging as simulated fallback:', apiErr.message);
                status = 'SIMULATED';
            }
        }

        // Create timestamped audit record
        const logEntry = await SmsLog.create({
            recipientPhone,
            recipientName,
            plateNo,
            bodyNumber,
            message,
            type: '30_DAY_EXPIRATION_ALERT',
            status,
            daysRemaining,
            franchiseId: franchise?._id,
            operatorId: operator?._id || franchise?.operator,
            dispatchedAt: now
        });

        console.log(`[SMS DISPATCH] ${status} alert sent to ${recipientPhone} (${recipientName}, Unit ${plateNo}): "${message}"`);

        // Broadcast real-time socket event to active admin/staff dashboards
        try {
            const io = getIO();
            if (io) {
                io.emit('sms_dispatched', logEntry);
            }
        } catch (sockErr) {
            // Non-critical socket notification
        }

        return logEntry;
    } catch (error) {
        console.error('[notificationService] Error dispatching expiration SMS:', error);
        return null;
    }
}

/**
 * Retrieves paginated SMS logs
 */
async function getSmsLogs({ page = 1, limit = 20, type = null, search = '' } = {}) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (p - 1) * lim;

    const filter = {};
    if (type && type !== 'All') {
        filter.type = type;
    }
    if (search && search.trim()) {
        const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
            { recipientName: regex },
            { recipientPhone: regex },
            { plateNo: regex },
            { bodyNumber: regex },
            { message: regex }
        ];
    }

    const totalRecords = await SmsLog.countDocuments(filter);
    const logs = await SmsLog.find(filter)
        .sort({ dispatchedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean();

    return {
        logs,
        pagination: {
            totalRecords,
            totalPages: Math.ceil(totalRecords / lim) || 1,
            currentPage: p,
            limit: lim
        }
    };
}

/**
 * Manually simulate an SMS dispatch for live defense demonstrations
 */
async function simulateTestDispatch({
    operatorName = 'Juan Dela Cruz',
    phone = '09178923401',
    plateNo = '4528-TC',
    bodyNumber = '042',
    daysRemaining = 30
}) {
    const fakeFranchise = {
        _id: null,
        plateNo,
        bodyNumber,
        fullName: operatorName,
        contact: phone,
        expiryDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000),
        operator: {
            name: operatorName,
            contact: phone
        }
    };

    return await dispatchExpirationSms({
        franchise: fakeFranchise,
        daysRemaining,
        simulated: true,
        customPhone: phone
    });
}

module.exports = {
    normalizePhoneNumber,
    dispatchExpirationSms,
    getSmsLogs,
    simulateTestDispatch
};
