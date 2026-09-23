const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/notificationModel');

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

router.put('/:id/read', async (req, res) => {
  try {
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

router.delete('/read-all', async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    const { emitToUser } = require('../config/socket');
    emitToUser(req.user._id.toString(), 'notifications_read_all');
    res.json({ message: 'All notifications deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking all notifications as read'});
  }
});

module.exports = router;
