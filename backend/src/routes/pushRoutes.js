const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { vapidPublicKey } = require('../config/webPush');
const PushSubscription = require('../models/pushSubscriptionModel');
const { sendPushToUser } = require('../services/pushService');

// Public route to get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidPublicKey });
});

// All routes below require authentication
router.use(protect);

function sanitizePreferences(rawPrefs) {
  const prefs = rawPrefs && typeof rawPrefs === 'object' ? rawPrefs : {};
  return {
    statusUpdates: prefs.statusUpdates !== undefined ? Boolean(prefs.statusUpdates) : true,
    renewalReminders: prefs.renewalReminders !== undefined ? Boolean(prefs.renewalReminders) : true,
    announcements: prefs.announcements !== undefined ? Boolean(prefs.announcements) : true
  };
}

// Save or update a push subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, preferences, deviceType } = req.body || {};
    const { endpoint, keys } = subscription || {};

    if (![endpoint, keys?.p256dh, keys?.auth].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ message: 'Invalid push subscription payload' });
    }

    try {
      const parsedEndpoint = new URL(endpoint);
      const allowedHostSuffixes = ['.googleapis.com', '.google.com', '.mozilla.com', '.push.apple.com', '.notify.windows.com'];
      if (parsedEndpoint.protocol !== 'https:' || !allowedHostSuffixes.some(s => parsedEndpoint.hostname.endsWith(s))) {
        return res.status(400).json({ message: 'Invalid or untrusted push service endpoint URL' });
      }
    } catch {
      return res.status(400).json({ message: 'Malformed push subscription endpoint URL' });
    }
    const user = req.user._id;
    const existingSub = await PushSubscription.findOne({ endpoint }).select('user keys __v').lean();
    const rebound = Boolean(existingSub && String(existingSub.user) !== String(user));

    // A shared browser can transfer its binding by presenting the subscription's existing keys.
    if (rebound && (existingSub.keys?.p256dh !== keys.p256dh || existingSub.keys?.auth !== keys.auth)) {
      return res.status(403).json({ message: 'Subscription credentials do not match the existing binding' });
    }

    const binding = {
      user,
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      preferences: sanitizePreferences(preferences),
      userAgent: req.headers['user-agent'] || '',
      deviceType: typeof deviceType === 'string' && deviceType.trim() ? deviceType.trim().slice(0, 64) : 'Mobile Device'
    };
    const updatedSub = existingSub
      ? await PushSubscription.findOneAndUpdate(
        { _id: existingSub._id, user: existingSub.user, __v: existingSub.__v ?? { $exists: false } },
        { $set: binding, $inc: { __v: 1 } },
        { returnDocument: 'after' }
      )
      : await PushSubscription.create(binding);

    if (!updatedSub) {
      return res.status(409).json({ message: 'Subscription binding changed. Please try again.' });
    }

    res.status(200).json({
      success: true,
      rebound,
      message: 'Push notification subscription saved successfully',
      subscription: updatedSub
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Subscription binding changed. Please try again.' });
    }
    console.error('Error saving push subscription:', error);
    res.status(500).json({ message: 'Error saving push subscription'});
  }
});

// Unsubscribe a device
const handleUnsubscribe = async (req, res) => {
  try {
    const endpoint = req.body?.endpoint || req.query?.endpoint;
    if (endpoint) {
      await PushSubscription.deleteOne({ endpoint: String(endpoint), user: req.user._id });
    } else {
      // If no specific endpoint provided, remove all for this user
      await PushSubscription.deleteMany({ user: req.user._id });
    }

    res.json({ success: true, message: 'Unsubscribed from push notifications successfully' });
  } catch (error) {
    console.error('Error unsubscribing push:', error);
    res.status(500).json({ message: 'Error unsubscribing'});
  }
};

router.post('/unsubscribe', handleUnsubscribe);
router.delete('/subscribe', handleUnsubscribe);

// Get push subscription status & preferences for current user
router.get('/status', async (req, res) => {
  try {
    const subs = await PushSubscription.find({ user: req.user._id });
    const isSubscribed = subs.length > 0;
    const latestSub = subs[subs.length - 1];

    res.json({
      isSubscribed,
      subscriptionCount: subs.length,
      preferences: latestSub ? latestSub.preferences : {
        statusUpdates: true,
        renewalReminders: true,
        announcements: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking subscription status'});
  }
});

// Update notification preferences across user subscriptions
router.put('/preferences', async (req, res) => {
  try {
    const { preferences } = req.body;
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ message: 'Preferences required' });
    }

    const safePreferences = sanitizePreferences(preferences);
    await PushSubscription.updateMany(
      { user: req.user._id },
      { $set: { preferences: safePreferences } }
    );

    res.json({ success: true, message: 'Preferences updated successfully', preferences: safePreferences });
  } catch (error) {
    res.status(500).json({ message: 'Error updating preferences'});
  }
});

// Send an immediate test notification to verify delivery on the user's phone
router.post('/test', async (req, res) => {
  try {
    const result = await sendPushToUser(req.user._id, {
      title: 'GTRAMS Push Test',
      message: 'Kumusta! Gumagana nang maayos ang push notifications sa iyong telepono.',
      url: '/operator/settings',
      type: 'general'
    });

    if (!result || !result.sentCount) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found for this device. Please enable push notifications first.'
      });
    }

    res.json({
      success: true,
      message: 'Test push alert sent successfully to your device!',
      result
    });
  } catch (error) {
    console.error('Error sending test push:', error);
    res.status(500).json({ message: 'Error sending test notification'});
  }
});

module.exports = router;
