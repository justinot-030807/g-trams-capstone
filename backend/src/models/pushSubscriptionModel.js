const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  preferences: {
    statusUpdates: { type: Boolean, default: true },
    renewalReminders: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true }
  },
  userAgent: {
    type: String,
    default: ''
  },
  deviceType: {
    type: String,
    default: 'Mobile Device'
  }
}, { timestamps: true });

pushSubscriptionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
