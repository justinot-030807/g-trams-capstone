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

// Save or update a push subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, preferences, deviceType } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: 'Invalid push subscription payload' });
    }

    const { endpoint, keys } = subscription;
    const userAgent = req.headers['user-agent'] || '';

    // Update if endpoint exists, otherwise insert
    const updatedSub = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: req.user._id,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth
        },
        preferences: preferences || {
          statusUpdates: true,
          renewalReminders: true,
          announcements: true
        },
        userAgent,
        deviceType: deviceType || 'Mobile Device'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Push notification subscription saved successfully',
      subscription: updatedSub
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ message: 'Error saving push subscription', error: error.message });
  }
});

// Unsubscribe a device
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await PushSubscription.deleteOne({ endpoint, user: req.user._id });
    } else {
      // If no specific endpoint provided, remove all for this user
      await PushSubscription.deleteMany({ user: req.user._id });
    }

    res.json({ success: true, message: 'Unsubscribed from push notifications successfully' });
  } catch (error) {
    console.error('Error unsubscribing push:', error);
    res.status(500).json({ message: 'Error unsubscribing', error: error.message });
  }
});

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
    res.status(500).json({ message: 'Error checking subscription status', error: error.message });
  }
});

// Update notification preferences across user subscriptions
router.put('/preferences', async (req, res) => {
  try {
    const { preferences } = req.body;
    if (!preferences) {
      return res.status(400).json({ message: 'Preferences required' });
    }

    await PushSubscription.updateMany(
      { user: req.user._id },
      { $set: { preferences } }
    );

    res.json({ success: true, message: 'Preferences updated successfully', preferences });
  } catch (error) {
    res.status(500).json({ message: 'Error updating preferences', error: error.message });
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

    if (result.sentCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Walang aktibong subscription na natagpuan para sa device na ito. I-enable muna ang push notification.'
      });
    }

    res.json({
      success: true,
      message: 'Matagumpay na naipadala ang test push alert sa iyong telepono!',
      result
    });
  } catch (error) {
    console.error('Error sending test push:', error);
    res.status(500).json({ message: 'Error sending test notification', error: error.message });
  }
});

module.exports = router;
