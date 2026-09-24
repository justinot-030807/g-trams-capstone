const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/notificationModel');

const mongoose = require('mongoose');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('relatedFranchise', 'plateNo status');
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications'});
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count'});
  }
});

// Mark all as read (must be defined BEFORE /:id/read to prevent CastError)
router.put(['/read-all', '/mark-all-read'], async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    const { emitToUser } = require('../config/socket');
    emitToUser(req.user._id.toString(), 'notifications_read_all');
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking all notifications as read'});
  }
});

// Delete / clear all notifications
router.delete(['/read-all', '/clear-all'], async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    const { emitToUser } = require('../config/socket');
    emitToUser(req.user._id.toString(), 'notifications_read_all');
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing all notifications'});
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    const { emitToUser } = require('../config/socket');
    emitToUser(req.user._id.toString(), 'notification_read', { id: notification._id });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read'});
  }
});

module.exports = router;
