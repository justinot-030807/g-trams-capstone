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
    return { success: false, reason: 'Invalid phone number or empty message' };
  }

  if (process.env.NODE_ENV === 'test') {
    return { success: true, simulated: true, provider: 'test' };
  }

  const textbeeApiKey = (process.env.TEXTBEE_API_KEY || '').trim();
  const textbeeDeviceId = (process.env.TEXTBEE_DEVICE_ID || '').trim();

  // 1. Primary Gateway: TextBee (Android SMS Gateway)
  if (textbeeApiKey) {
    const headers = {
      'x-api-key': textbeeApiKey,
      'Content-Type': 'application/json'
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
        return { success: true, provider: 'textbee', data: res.data };
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
          return { success: true, provider: 'textbee', data: res.data };
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }
    } else {
      // No deviceId specified — use default active device on TextBee account
      const gatewayUrl = 'https://api.textbee.dev/api/v1/gateway/send-sms';
      const res = await axios.post(
        gatewayUrl,
        {
          recipients: [formattedPhone],
          message: String(message)
        },
        { headers, timeout: 10000 }
      );
      return { success: true, provider: 'textbee', data: res.data };
    }
  }

  // 2. Secondary Fallback: Semaphore SMS API
  const semaphoreApiKey = (process.env.SEMAPHORE_API_KEY || '').trim();
  if (semaphoreApiKey && semaphoreApiKey !== 'mock_key' && semaphoreApiKey !== 'test_key') {
    const res = await axios.post(
      'https://api.semaphore.co/api/v4/messages',
      {
        apikey: semaphoreApiKey,
        number: formattedPhone,
        message: String(message)
      },
      { timeout: 8000 }
    );
    return { success: true, provider: 'semaphore', data: res.data };
  }

  console.warn(`[SMS Gateway] Neither TEXTBEE_API_KEY nor SEMAPHORE_API_KEY is configured. SMS to ${formattedPhone} skipped.`);
  return { success: false, simulated: true, reason: 'No SMS API key configured' };
}

sendSms.formatPhoneE164 = formatPhoneE164;
module.exports = sendSms;
