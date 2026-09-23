const { webpush } = require('../config/webPush');
const PushSubscription = require('../models/pushSubscriptionModel');

/**
 * Send a web push notification to all active devices of a user
 * @param {string|ObjectId} userId
 * @param {Object} notificationData { title, body/message, url, type, icon, badge }
 */
const sendPushToUser = async (userId, notificationData) => {
  if (!userId) return { success: false, reason: 'No userId provided' };

  try {
    const subscriptions = await PushSubscription.find({ user: userId });
    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, count: 0, reason: 'No push subscriptions found for user' };
    }

    const {
      title = 'GTRAMS Notification',
      message,
      body,
      url = '/operator-dashboard',
      type = 'general',
      icon = '/icons/icon-192x192.png',
      badge = '/icons/favicon-32x32.png'
    } = notificationData;

    const payload = JSON.stringify({
      title,
      body: body || message || 'You have an update from GTRAMS.',
      url,
      type,
      icon,
      badge,
      timestamp: Date.now()
    });

    const sendPromises = subscriptions.map(async (sub) => {
      // Check user preferences
      if (type === 'status_change' || type === 'approval') {
        if (sub.preferences && sub.preferences.statusUpdates === false) return null;
      } else if (type === 'renewal_reminder') {
        if (sub.preferences && sub.preferences.renewalReminders === false) return null;
      } else if (type === 'announcement') {
        if (sub.preferences && sub.preferences.announcements === false) return null;
      }

      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth
        }
      };

      try {
        await webpush.sendNotification(pushConfig, payload);
        return { success: true, endpoint: sub.endpoint };
      } catch (err) {
        // HTTP 410 (Gone) or 404 means user unsubscribed or revoked permission in browser
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
        return { success: false, error: err.message, statusCode: err.statusCode };
      }
    });

    const results = await Promise.all(sendPromises);
    const successful = results.filter(r => r && r.success).length;

    return {
      success: true,
      sentCount: successful,
      totalCount: subscriptions.length
    };
  } catch (error) {
    console.error('Error in sendPushToUser:', error.message);
    return { success: false};
  }
};

/**
 * Broadcast push notification to all users of a specific role or TODA
 */
const broadcastPushNotification = async ({ role, todaAssociation, title, message, url, type = 'announcement' }) => {
  try {
    const userQuery = {};
    if (role) userQuery.role = role;
    if (todaAssociation && todaAssociation !== 'ALL') userQuery.todaAssociation = todaAssociation;

    const User = require('../models/userModel');
    const users = await User.find(userQuery).select('_id');
    const userIds = users.map(u => u._id);

    const promises = userIds.map(id => sendPushToUser(id, { title, message, url, type }));
    await Promise.allSettled(promises);

    return { success: true, targetedUsers: userIds.length };
  } catch (err) {
    console.error('Error broadcasting push notification:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendPushToUser,
  broadcastPushNotification
};
