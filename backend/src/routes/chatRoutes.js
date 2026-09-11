const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { ChatMessage, ChatThread } = require('../models/chatModel');
const { emitToUser } = require('../config/socket');
const Notification = require('../models/notificationModel');

router.use(protect);

router.get('/threads', async (req, res) => {
  try {
    const threads = await ChatThread.find({ participants: req.user._id })
      .populate('participants', 'name profilePic role')
      .sort({ lastMessageAt: -1 });

    const threadsWithUnread = await Promise.all(threads.map(async (thread) => {
      const unreadCount = await ChatMessage.countDocuments({
        thread: thread._id,
        sender: { $ne: req.user._id },
        isRead: false
      });
      return { ...thread.toObject(), unreadCount };
    }));

    res.json(threadsWithUnread);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching threads', error: error.message });
  }
});

router.get('/messages/:threadId', async (req, res) => {
  try {
    const thread = await ChatThread.findOne({ _id: req.params.threadId, participants: req.user._id });
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const messages = await ChatMessage.find({ thread: thread._id })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate('sender', 'name profilePic role');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

router.post('/messages', async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    if (!recipientId || !message) return res.status(400).json({ message: 'Missing recipientId or message' });

    let thread = await ChatThread.findOne({
      participants: { $all: [req.user._id, recipientId] }
    });

    if (!thread) {
      thread = await ChatThread.create({ participants: [req.user._id, recipientId] });
    }

    const newMessage = await ChatMessage.create({
      thread: thread._id,
      sender: req.user._id,
      message
    });

    thread.lastMessage = message;
    thread.lastMessageAt = new Date();
    await thread.save();

    const populatedMessage = await ChatMessage.findById(newMessage._id).populate('sender', 'name profilePic role');

    emitToUser(recipientId, 'chat_message', populatedMessage);

    const notification = await Notification.create({
      recipient: recipientId,
      type: 'chat',
      title: 'New Message',
      message: `You received a new message from ${req.user.name}`
    });
    emitToUser(recipientId, 'notification', notification);

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

router.put('/messages/:threadId/read', async (req, res) => {
  try {
    const thread = await ChatThread.findOne({ _id: req.params.threadId, participants: req.user._id });
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    await ChatMessage.updateMany(
      { thread: thread._id, sender: { $ne: req.user._id }, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
});

module.exports = router;
