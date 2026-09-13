const webpush = require('web-push');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BAi4SCFQMZcgmIaRD2A147Mfh2v3KhzWdnFYn_HbcXSAzo00YZqcJTXxtBmX5aws3Sss5BwrRW3gOyc4KwWHMUQ';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'eA0odXY2WWAbYdxs-fSNjMfKVAqeuDHhwwEQNtUwoJU';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:gtrams.admin@gmail.com';

try {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
} catch (err) {
  console.error('Failed to configure VAPID details for Web Push:', err.message);
}

module.exports = {
  webpush,
  vapidPublicKey
};
