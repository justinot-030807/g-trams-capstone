const axios = require('axios');

/**
 * Normalizes a Philippine mobile phone number to E.164 format (+639XXXXXXXXX)
 * Required by TextBee Android SMS Gateway.
 */
function formatPhoneE164(rawPhone) {
  if (!rawPhone) return null;
  const str = String(rawPhone).trim();
  if (str.includes('@')) return null; // Not a phone number

  const digits = str.replace(/[^0-9+]/g, '');
  if (!digits) return null;

  if (digits.startsWith('+639') && digits.length === 13) {
    return digits;
  }
  if (digits.startsWith('639') && digits.length === 12) {
    return '+' + digits;
  }
  if (digits.startsWith('09') && digits.length === 11) {
    return '+63' + digits.slice(1);
  }
  if (digits.startsWith('9') && digits.length === 10) {
    return '+63' + digits;
  }
  return digits.startsWith('+') ? digits : '+' + digits;
}

function isSuccessfulHttpResponse(response) {
  return Number.isInteger(response?.status) && response.status >= 200 && response.status < 300;
}

function textBeeAccepted(response) {
  const payload = response?.data;
  const result = payload?.data;
  if (!isSuccessfulHttpResponse(response) || !result || payload.success === false || payload.error || result.error) return false;

  // The documented response is either a queued batch or immediate dispatch to the device.
  const queued = result.success === true && typeof result.smsBatchId === 'string' && result.smsBatchId.trim().length > 0;
  const dispatched = result.success === undefined && result.successCount === 1 && result.failureCount === 0;
  return queued || dispatched;
}

function semaphoreAccepted(response) {
  const payload = response?.data;
  if (!isSuccessfulHttpResponse(response) || !Array.isArray(payload) || payload.length !== 1) return false;
  const [item] = payload;
  const id = item?.message_id;
  return (typeof id === 'number' || typeof id === 'string') && /^\d+$/.test(String(id)) &&
    ['queued', 'pending', 'sent'].includes(String(item.status).trim().toLowerCase());
}

/**
 * Sends an SMS message via TextBee (https://textbee.dev) or Semaphore fallback.
 * Environment Variables used on Render / .env:
 *   - TEXTBEE_API_KEY   (Required for TextBee)
 *   - TEXTBEE_DEVICE_ID (Optional; uses the account's default device when omitted)
 */
async function sendSms({ phone, number, message }) {
  const rawTarget = phone || number;
  const formattedPhone = formatPhoneE164(rawTarget);
  if (!formattedPhone || !message) {
    return {
      success: false,
      error: 'Invalid phone number or empty message',
      reason: 'Invalid phone number or empty message'
    };
  }

  if (process.env.NODE_ENV === 'test') {
    return { success: true, simulated: true, provider: 'test' };
  }

  const maskedPhone = formattedPhone.length >= 7
    ? `${formattedPhone.slice(0, 4)}****${formattedPhone.slice(-3)}`
    : '****';

  const textbeeApiKey = (process.env.TEXTBEE_API_KEY || '').trim();
  const textbeeDeviceId = (process.env.TEXTBEE_DEVICE_ID || '').trim();
  let lastError = null;
  let lastDetails = null;
  let canUseFallback = true;

  // 1. Primary Gateway: TextBee (Android SMS Gateway)
  if (textbeeApiKey) {
    const headers = {
      'x-api-key': textbeeApiKey,
      'Content-Type': 'application/json'
    };

    try {
      const res = await axios.post(
        'https://api.textbee.dev/api/v1/gateway/send-sms',
        {
          recipients: [formattedPhone],
          message: String(message),
          ...(textbeeDeviceId ? { deviceId: textbeeDeviceId } : {})
        },
        { headers, timeout: 10000 }
      );
      if (textBeeAccepted(res)) {
        return { success: true, provider: 'textbee', deliveryStatus: 'accepted', data: res.data };
      }
      const result = res?.data?.data;
      canUseFallback = result?.success === false || (result?.successCount === 0 && result?.failureCount === 1);
      lastError = 'TextBee did not confirm SMS acceptance';
    } catch (err) {
      // A timeout or ambiguous response may follow acceptance. A second send could duplicate the SMS.
      const status = err?.response?.status;
      canUseFallback = [400, 401, 403, 404, 429].includes(status);
      lastError = err?.response?.data?.message || err?.response?.data?.error || err.message || 'TextBee SMS request failed';
      lastDetails = err?.response?.data || null;
    }
  }

  // 2. Secondary Fallback: Semaphore SMS API
  const semaphoreApiKey = (process.env.SEMAPHORE_API_KEY || '').trim();
  if (canUseFallback && semaphoreApiKey && semaphoreApiKey !== 'mock_key' && semaphoreApiKey !== 'test_key') {
    try {
      const res = await axios.post(
        'https://api.semaphore.co/api/v4/messages',
        {
          apikey: semaphoreApiKey,
          number: formattedPhone,
          message: String(message)
        },
        { timeout: 8000 }
      );
      const payload = res?.data;
      if (semaphoreAccepted(res)) {
        return { success: true, provider: 'semaphore', deliveryStatus: 'accepted', data: payload };
      }
      lastError = typeof payload?.error === 'string' ? payload.error : 'Semaphore did not confirm SMS acceptance';
      lastDetails = null;
    } catch (semErr) {
      lastError = semErr?.response?.data?.message || semErr?.response?.data?.error || semErr.message || 'Semaphore SMS delivery failed';
      lastDetails = semErr?.response?.data || null;
    }
  }

  if (lastError) {
    console.warn(`[SMS Gateway] Failed to confirm SMS acceptance for ${maskedPhone}: ${lastError}`);
    return {
      success: false,
      error: String(lastError),
      reason: String(lastError),
      ...(lastDetails ? { details: lastDetails } : {})
    };
  }

  console.warn(`[SMS Gateway] Neither TEXTBEE_API_KEY nor SEMAPHORE_API_KEY is configured. SMS to ${maskedPhone} skipped.`);
  return {
    success: false,
    simulated: true,
    error: 'No SMS API key configured',
    reason: 'No SMS API key configured'
  };
}

sendSms.formatPhoneE164 = formatPhoneE164;
module.exports = sendSms;
