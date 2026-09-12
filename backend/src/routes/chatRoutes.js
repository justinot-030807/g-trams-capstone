const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { ChatMessage, ChatThread } = require('../models/chatModel');
const { emitToUser } = require('../config/socket');
const Notification = require('../models/notificationModel');

router.use(protect);

router.get('/threads', async (req, res) => {
  try {
    const threads = await ChatThread.find({
      $and: [
        {
          $or: [
            { participants: req.user._id },
            { isAnnouncement: true }
          ]
        },
        // Filter out legacy announcement threads that were sent individually
        { lastMessage: { $not: /^\[ANNOUNCEMENT\]/ } }
      ]
    })
      .populate('participants', 'name profilePic role')
      .sort({ lastMessageAt: -1 });

    // Re-fetch the true announcement thread separately if it exists and got filtered out by the regex
    const announcementThread = await ChatThread.findOne({ isAnnouncement: true })
      .populate('participants', 'name profilePic role');

    if (announcementThread) {
      // Add it back
      threads.unshift(announcementThread);
    }

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
    const thread = await ChatThread.findOne({ 
      _id: req.params.threadId,
      $or: [ { participants: req.user._id }, { isAnnouncement: true } ]
    });
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
    let { recipientId, message } = req.body;
    
    if (!message) return res.status(400).json({ message: 'Missing message' });
    
    const User = require('../models/userModel');
    let recipients = [];
    
    // If no recipientId is provided, default to ALL admins.
    if (!recipientId) {
      const admins = await User.find({ role: { $in: ['admin', 'administrator', 'Administrator'] } });
      if (!admins.length) return res.status(400).json({ message: 'No admin found to receive message' });
      recipients = admins.map(a => a._id);
    } else {
      recipients = [recipientId];
    }

    const participants = [req.user._id, ...recipients];

    let thread = await ChatThread.findOne({
      participants: { $all: participants, $size: participants.length }
    });

    if (!thread) {
      thread = await ChatThread.create({ participants });
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

    // Notify all recipients
    for (const recId of recipients) {
      emitToUser(recId, 'chat_message', populatedMessage);

      const notification = await Notification.create({
        recipient: recId,
        type: 'chat',
        title: 'New Message',
        message: `You received a new message from ${req.user.name}`
      });
      emitToUser(recId, 'notification', notification);
    }

    const populatedThread = await ChatThread.findById(thread._id).populate('participants', 'name profilePic role');

    res.status(201).json({ message: populatedMessage, thread: populatedThread });

    // --- AUTO-REPLY LOGIC ---
    // If sender is not an admin, check for FAQ keywords
    const senderRole = String(req.user.role || '').toLowerCase();
    if (!senderRole.includes('admin')) {
      let autoReply = null;
      const lowerMsg = message.toLowerCase();
      
      if (lowerMsg.includes('paano') && lowerMsg.includes('renew')) {
        autoReply = "Automated Reply: Para mag-renew, kailangan ng latest OR/CR, lumang prangkisa, at barangay clearance. Pumunta sa 'Apply Franchise' at piliin ang Renewal.";
      } else if (lowerMsg.includes('requirements') && (lowerMsg.includes('bago') || lowerMsg.includes('prangkisa'))) {
        autoReply = "Automated Reply: Ang requirements para sa bagong prangkisa: 1. OR/CR, 2. Driver's License, 3. Barangay Clearance, 4. TODA Certificate, 5. Sedula.";
      } else if (lowerMsg.includes('saan') && lowerMsg.includes('claim')) {
        autoReply = "Automated Reply: Ang Claim Stub ay makukuha sa Mayor's Office pagkatapos ma-approve ang application.";
      }

      if (autoReply && recipients.length > 0) {
        // Find an admin sender (just use the first recipient admin)
        const adminSenderId = recipients[0];
        
        // Wait 1.5 seconds for realism
        setTimeout(async () => {
          const autoMsg = await ChatMessage.create({
            thread: thread._id,
            sender: adminSenderId,
            message: autoReply
          });
          
          thread.lastMessage = autoReply;
          thread.lastMessageAt = new Date();
          await thread.save();

          const popAutoMsg = await ChatMessage.findById(autoMsg._id).populate('sender', 'name profilePic role');
          
          // Emit to operator
          emitToUser(req.user._id.toString(), 'chat_message', popAutoMsg);
          emitToUser(req.user._id.toString(), 'notification', await Notification.create({
            recipient: req.user._id,
            type: 'chat',
            title: 'Auto-Reply',
            message: `You received an automated reply`
          }));
        }, 1500);
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

router.put('/messages/:threadId/read', async (req, res) => {
  try {
    const thread = await ChatThread.findOne({ 
      _id: req.params.threadId,
      $or: [ { participants: req.user._id }, { isAnnouncement: true } ]
    });
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

router.post('/broadcast', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Missing message' });

    // Ensure only admins can broadcast
    const role = String(req.user.role || '').toLowerCase().replace(/_/g, ' ');
    if (role !== 'admin' && role !== 'administrator') {
      return res.status(403).json({ message: 'Only admins can broadcast messages' });
    }

    const User = require('../models/userModel');
    // Find all operators and TODA presidents
    const users = await User.find({ role: { $in: ['operator', 'toda_president', 'toda president'] } });

    let thread = await ChatThread.findOne({ isAnnouncement: true });
    if (!thread) {
      thread = await ChatThread.create({ 
        participants: [req.user._id],
        isAnnouncement: true 
      });
    }

    const newMessage = await ChatMessage.create({
      thread: thread._id,
      sender: req.user._id,
      message: `[ANNOUNCEMENT]\n\n${message}`
    });

    thread.lastMessage = `[ANNOUNCEMENT]\n\n${message}`;
    thread.lastMessageAt = new Date();
    await thread.save();

    const populatedMessage = await ChatMessage.findById(newMessage._id).populate('sender', 'name profilePic role');
    const { emitToUser } = require('../config/socket');
    const Notification = require('../models/notificationModel');

    for (const user of users) {
      emitToUser(user._id.toString(), 'chat_message', populatedMessage);

      const notification = await Notification.create({
        recipient: user._id,
        type: 'chat',
        title: 'System Announcement',
        message: `Admin broadcasted an announcement`
      });
      emitToUser(user._id.toString(), 'notification', notification);
    }

    res.status(200).json({ message: 'Broadcast channel updated and notifications sent successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error broadcasting message', error: error.message });
  }
});

router.delete('/messages/:messageId', async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    // Only sender or admin can delete
    const isAdmin = String(req.user.role).toLowerCase().includes('admin');
    if (String(message.sender) !== String(req.user._id) && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to delete this message' });
    }

    await ChatMessage.findByIdAndDelete(req.params.messageId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
});

router.delete('/threads/:threadId', async (req, res) => {
  try {
    const isAdmin = String(req.user.role).toLowerCase().includes('admin');
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can delete entire threads' });

    await ChatMessage.deleteMany({ thread: req.params.threadId });
    await ChatThread.findByIdAndDelete(req.params.threadId);
    
    res.json({ message: 'Thread and all messages deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting thread', error: error.message });
  }
});

module.exports = router;
