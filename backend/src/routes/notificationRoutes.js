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

// Mark all as read & auto-delete notifications
router.put(['/read-all', '/mark-all-read'], async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    const { emitToUser } = require('../config/socket');
    emitToUser(req.user._id.toString(), 'notifications_read_all');
    res.json({ message: 'All notifications cleared and marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing all notifications'});
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

// Delete individual notification
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });
    if (!deleted) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    const { emitToUser } = require('../config/socket');
    emitToUser(req.user._id.toString(), 'notification_deleted', { id: req.params.id });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

// Retrieve SMS dispatch audit logs (System Admin, Admin, BPLO Staff)
const { authorize } = require('../middleware/authMiddleware');
router.get('/sms-logs', authorize('system_admin', 'admin', 'bplo_staff'), async (req, res) => {
  try {
    const { getSmsLogs } = require('../services/notificationService');
    const result = await getSmsLogs({
      page: req.query.page,
      limit: req.query.limit,
      type: req.query.type,
      search: req.query.search
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching SMS dispatch logs:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve SMS logs' });
  }
});

// Trigger a live simulated 30-day expiration SMS alert (for defense demo)
router.post('/simulate-sms', authorize('system_admin', 'admin', 'bplo_staff'), async (req, res) => {
  try {
    const { simulateTestDispatch } = require('../services/notificationService');
    const { operatorName, phone, plateNo, bodyNumber, daysRemaining } = req.body;
    const log = await simulateTestDispatch({
      operatorName: operatorName || 'Juan Dela Cruz',
      phone: phone || '09178923401',
      plateNo: plateNo || '4528-TC',
      bodyNumber: bodyNumber || '042',
      daysRemaining: Number(daysRemaining) || 30
    });
    res.json({ 
      success: true, 
      message: 'Simulated 30-day expiration SMS alert dispatched successfully.', 
      data: log 
    });
  } catch (error) {
    console.error('Error triggering simulated SMS:', error);
    res.status(500).json({ success: false, message: 'Failed to simulate SMS dispatch' });
  }
});

module.exports = router;
