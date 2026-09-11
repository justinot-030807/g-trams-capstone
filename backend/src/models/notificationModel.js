const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['status_change', 'approval', 'renewal_reminder', 'system', 'chat', 'general'], default: 'general' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedFranchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
