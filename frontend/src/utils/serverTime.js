/**
 * G-TRAMS Server-Authoritative Time Engine (Asia/Manila, UTC+8)
 * 
 * Neutralizes client-side laptop/browser clock tampering by computing
 * and applying clock skew offset against server-authoritative timestamps.
 */

const MANILA_TIMEZONE = 'Asia/Manila';

// Clock skew in milliseconds: Client Date.now() - Server epoch
let clientClockSkewMs = 0;
let isClockSynchronized = false;

/**
 * Synchronize skew using an authoritative ISO timestamp from the server
 */
export const syncWithServerTime = (serverTimeIso) => {
  if (!serverTimeIso) return;
  const serverEpoch = new Date(serverTimeIso).getTime();
  if (isNaN(serverEpoch)) return;

  clientClockSkewMs = Date.now() - serverEpoch;
  isClockSynchronized = true;
};

/**
 * Automatically inspects fetch response headers for X-Server-Time
 */
export const recordServerTimeFromResponse = (response) => {
  try {
    if (response?.headers?.get) {
      const serverTime = response.headers.get('x-server-time');
      if (serverTime) {
        syncWithServerTime(serverTime);
      }
    }
  } catch (err) {
    // Non-blocking header inspection
  }
  return response;
};

/**
 * Proactively fetches server-authoritative time from the settings API
 */
export const initServerTimeSync = async (apiUrl = import.meta.env.VITE_API_URL) => {
  if (!apiUrl) return;
  try {
    const res = await fetch(`${apiUrl}/api/v1/settings/time`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.serverTime) {
        syncWithServerTime(data.serverTime);
      }
    }
  } catch (err) {
    console.warn('[SERVER TIME] Could not pre-sync server time:', err.message);
  }
};

/**
 * Returns a Date object representing the authoritative current time
 * unaffected by client laptop clock manipulation.
 */
export const getServerNow = () => {
  return new Date(Date.now() - clientClockSkewMs);
};

/**
 * Returns whether clock skew compensation is active
 */
export const isTimeSynchronized = () => isClockSynchronized;

/**
 * Returns current date string in Asia/Manila (YYYY-MM-DD)
 */
export const getManilaServerDateString = () => {
  const d = getServerNow();
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MANILA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
};

/**
 * Returns midnight (00:00:00) in Asia/Manila for the current server date
 */
export const getManilaServerStartOfDay = () => {
  const dateStr = getManilaServerDateString();
  return new Date(`${dateStr}T00:00:00.000+08:00`);
};

/**
 * Calculates calendar days remaining relative to authoritative server time
 */
export const calculateDaysRemaining = (expiryDate) => {
  if (!expiryDate) return null;
  const exp = new Date(expiryDate);
  if (isNaN(exp.getTime())) return null;

  const now = getServerNow();
  const diffMs = exp.getTime() - now.getTime();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
};

/**
 * Evaluates whether an expiry date has elapsed relative to server time
 */
export const isDateExpired = (expiryDate) => {
  if (!expiryDate) return false;
  const exp = new Date(expiryDate);
  if (isNaN(exp.getTime())) return false;
  return exp.getTime() < getServerNow().getTime();
};

/**
 * Formats a date for display in Manila timezone
 */
export const formatManilaDisplayDate = (dateStr, options = {}) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';

  return d.toLocaleDateString('en-US', {
    timeZone: MANILA_TIMEZONE,
    year: 'numeric',
    month: options.month || 'long',
    day: 'numeric',
    ...options
  });
};
