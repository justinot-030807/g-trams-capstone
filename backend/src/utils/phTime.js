/**
 * Philippine Standard Time (PST, UTC+8 / Asia/Manila) Utility
 * 
 * Server-authoritative date and time helper ensuring consistent date boundaries
 * regardless of host runtime timezone or client clock settings.
 */

const MANILA_TIMEZONE = 'Asia/Manila';

/**
 * Returns current timestamp in UTC
 */
function getManilaNow() {
    return new Date();
}

/**
 * Formats a date into YYYY-MM-DD string within Asia/Manila timezone
 */
function getManilaDateString(date = new Date()) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: MANILA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(d);
}

/**
 * Returns the exact start of day (00:00:00.000+08:00) in Asia/Manila
 */
function getManilaStartOfDay(date = new Date()) {
    const dateStr = getManilaDateString(date);
    if (!dateStr) return null;
    return new Date(`${dateStr}T00:00:00.000+08:00`);
}

/**
 * Returns the exact end of day (23:59:59.999+08:00) in Asia/Manila
 */
function getManilaEndOfDay(date = new Date()) {
    const dateStr = getManilaDateString(date);
    if (!dateStr) return null;
    return new Date(`${dateStr}T23:59:59.999+08:00`);
}

/**
 * Computes franchise expiration date (default 1 year) ending at 23:59:59.999 Manila time
 */
function computeManilaExpiryDate(startDate = new Date(), years = 1) {
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return null;

    const dateStr = getManilaDateString(d);
    if (!dateStr) return null;

    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const targetYear = parseInt(yearStr, 10) + years;

    // Handle leap year edge case (Feb 29 -> Feb 28 on non-leap target year)
    let safeDay = dayStr;
    if (monthStr === '02' && dayStr === '29') {
        const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
        if (!isLeap) safeDay = '28';
    }

    const expiryStr = `${targetYear}-${monthStr}-${safeDay}`;
    return new Date(`${expiryStr}T23:59:59.999+08:00`);
}

/**
 * Calculates calendar days remaining until expiry relative to current Manila time
 */
function calculateDaysRemaining(expiryDate, fromDate = new Date()) {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime())) return null;

    const diffMs = exp.getTime() - new Date(fromDate).getTime();
    return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Evaluates whether an expiry date has elapsed relative to current Manila time
 */
function isExpired(expiryDate, fromDate = new Date()) {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime())) return false;
    return exp.getTime() < new Date(fromDate).getTime();
}

/**
 * Format date for human display in Manila timezone
 */
function formatManilaDate(date, options = {}) {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    
    return d.toLocaleDateString('en-US', {
        timeZone: MANILA_TIMEZONE,
        year: 'numeric',
        month: options.month || 'long',
        day: 'numeric',
        ...options
    });
}

module.exports = {
    MANILA_TIMEZONE,
    getManilaNow,
    getManilaDateString,
    getManilaStartOfDay,
    getManilaEndOfDay,
    computeManilaExpiryDate,
    calculateDaysRemaining,
    isExpired,
    formatManilaDate
};
