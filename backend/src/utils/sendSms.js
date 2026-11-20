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

/**
 * Sends an SMS message via TextBee (https://textbee.dev) or Semaphore fallback.
 * Environment Variables used on Render / .env:
 *   - TEXTBEE_API_KEY   (Required for TextBee)
 *   - TEXTBEE_DEVICE_ID (Required/Recommended for TextBee)
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

  // 1. Primary Gateway: TextBee (Android SMS Gateway)
  if (textbeeApiKey) {
    const headers = {
      'x-api-key': textbeeApiKey,
      'Content-Type': 'application/json'
    };

    const isTextBeePayloadSuccess = (res) => {
      if (!res || res.status < 200 || res.status >= 300) return false;
      if (res.data && typeof res.data === 'object') {
        if (res.data.success === false || res.data.error) return false;
        if (res.data.data && res.data.data.success === false) return false;
      }
      return true;
    };

    // If TEXTBEE_DEVICE_ID is provided, try device-specific endpoint first, then gateway fallback
    if (textbeeDeviceId) {
      try {
        const deviceUrl = `https://api.textbee.dev/api/v1/gateway/devices/${textbeeDeviceId}/send-sms`;
        const res = await axios.post(
          deviceUrl,
          {
            recipients: [formattedPhone],
            message: String(message)
          },
          { headers, timeout: 10000 }
        );
        if (isTextBeePayloadSuccess(res)) {
          return { success: true, provider: 'textbee', data: res.data };
        }
        lastError = res?.data?.message || res?.data?.error || 'TextBee device endpoint returned failure';
        lastDetails = res?.data || null;
      } catch (deviceErr) {
        // Fallback to general gateway endpoint if device endpoint differs
        try {
          const gatewayUrl = 'https://api.textbee.dev/api/v1/gateway/send-sms';
          const res = await axios.post(
            gatewayUrl,
            {
              recipients: [formattedPhone],
              message: String(message),
              deviceId: textbeeDeviceId
            },
            { headers, timeout: 10000 }
          );
          if (isTextBeePayloadSuccess(res)) {
            return { success: true, provider: 'textbee', data: res.data };
          }
          lastError = res?.data?.message || res?.data?.error || 'TextBee gateway returned failure';
          lastDetails = res?.data || null;
        } catch (fallbackErr) {
          lastError = fallbackErr?.response?.data?.message || fallbackErr?.response?.data?.error || fallbackErr.message || 'TextBee SMS delivery failed';
          lastDetails = fallbackErr?.response?.data || null;
        }
      }
    } else {
      // No deviceId specified — use default active device on TextBee account
      try {
        const gatewayUrl = 'https://api.textbee.dev/api/v1/gateway/send-sms';
        const res = await axios.post(
          gatewayUrl,
          {
            recipients: [formattedPhone],
            message: String(message)
          },
          { headers, timeout: 10000 }
        );
        if (isTextBeePayloadSuccess(res)) {
          return { success: true, provider: 'textbee', data: res.data };
        }
        lastError = res?.data?.message || res?.data?.error || 'TextBee gateway returned failure';
        lastDetails = res?.data || null;
      } catch (gatewayErr) {
        lastError = gatewayErr?.response?.data?.message || gatewayErr?.response?.data?.error || gatewayErr.message || 'TextBee SMS delivery failed';
        lastDetails = gatewayErr?.response?.data || null;
      }
    }
  }

  // 2. Secondary Fallback: Semaphore SMS API
  const semaphoreApiKey = (process.env.SEMAPHORE_API_KEY || '').trim();
  if (semaphoreApiKey && semaphoreApiKey !== 'mock_key' && semaphoreApiKey !== 'test_key') {
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
      const isSemaphoreError =
        !res ||
        res.status < 200 ||
        res.status >= 300 ||
        (payload && !Array.isArray(payload) && (payload.error || payload.status === 'error' || payload.success === false));
      if (!isSemaphoreError) {
        return { success: true, provider: 'semaphore', data: payload };
      }
      lastError = (typeof payload?.error === 'string' ? payload.error : JSON.stringify(payload?.error || payload)) || 'Semaphore SMS delivery failed';
      lastDetails = payload || null;
    } catch (semErr) {
      lastError = semErr?.response?.data?.message || semErr?.response?.data?.error || semErr.message || 'Semaphore SMS delivery failed';
      lastDetails = semErr?.response?.data || null;
    }
  }

  if (lastError) {
    console.warn(`[SMS Gateway] Failed to deliver SMS to ${maskedPhone}: ${lastError}`);
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
