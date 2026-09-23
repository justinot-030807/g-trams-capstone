const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { ChatMessage, ChatThread } = require('../models/chatModel');
const { emitToUser, emitToAdmins } = require('../config/socket');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

router.use(protect);

router.get('/unread-count', async (req, res) => {
  try {
    const isUserAdmin = String(req.user.role || '').toLowerCase().includes('admin');
    const adminUsers = await User.find({ role: { $in: ['admin', 'administrator', 'Administrator'] } }).select('_id');
    const adminIds = adminUsers.map(a => a._id);

    let threadQuery;
    let senderFilter;

    if (isUserAdmin) {
      // For admins: all support threads, and only count inbound messages from operators/non-admins
      threadQuery = {
        $or: [
          { participants: req.user._id },
          { isAnnouncement: false }
        ]
      };
      senderFilter = { $nin: adminIds };
    } else {
      // For operators: their threads, excluding announcements
      threadQuery = {
        participants: req.user._id,
        isAnnouncement: false
      };
      senderFilter = { $ne: req.user._id };
    }

    const threads = await ChatThread.find(threadQuery).select('_id');
    const threadIds = threads.map(t => t._id);

    const count = await ChatMessage.countDocuments({
      thread: { $in: threadIds },
      sender: senderFilter,
      isRead: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count'});
  }
});

router.get('/threads', async (req, res) => {
  try {
    const isUserAdmin = String(req.user.role || '').toLowerCase().includes('admin');
    const adminUsers = await User.find({ role: { $in: ['admin', 'administrator', 'Administrator'] } }).select('_id');
    const adminIds = adminUsers.map(a => a._id);

    let query;
    if (isUserAdmin) {
      // Admins see all non-announcement support threads and announcements
      query = {};
    } else {
      // Operators see threads they participate in or official broadcasts
      query = {
        $or: [
          { participants: req.user._id },
          { isAnnouncement: true }
        ]
      };
    }

    const threads = await ChatThread.find(query)
      .populate('participants', 'name profilePic role')
      .sort({ lastMessageAt: -1 });

    const threadsWithUnread = await Promise.all(threads.map(async (thread) => {
      // For admins: unread messages are only those sent by non-admins (operators)
      // For operators: unread messages are those sent by admins or others
      const senderFilter = isUserAdmin ? { $nin: adminIds } : { $ne: req.user._id };
      const unreadCount = await ChatMessage.countDocuments({
        thread: thread._id,
        sender: senderFilter,
        isRead: false
      });
      return { ...thread.toObject(), unreadCount };
    }));

    res.json(threadsWithUnread);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching threads'});
  }
});

router.get('/messages/:threadId', async (req, res) => {
  try {
    const isUserAdmin = String(req.user.role || '').toLowerCase().includes('admin');
    const threadFilter = isUserAdmin
      ? { _id: req.params.threadId }
      : { _id: req.params.threadId, $or: [ { participants: req.user._id }, { isAnnouncement: true } ] };

    const thread = await ChatThread.findOne(threadFilter);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const messages = await ChatMessage.find({ thread: thread._id })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate('sender', 'name profilePic role');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages'});
  }
});

router.post('/messages', async (req, res) => {
  try {
    let { recipientId, message, threadId } = req.body;
    
    if (!message) return res.status(400).json({ message: 'Missing message' });
    
    let thread = null;
    let recipients = [];
    const senderRole = String(req.user.role || '').toLowerCase();
    const isSenderAdmin = senderRole.includes('admin');
    
    if (threadId && threadId !== 'new') {
      thread = await ChatThread.findById(threadId);
    }

    if (!thread) {
      if (!isSenderAdmin) {
        // Operator starting or sending to support: look for existing support thread
        thread = await ChatThread.findOne({
          participants: req.user._id,
          isAnnouncement: { $ne: true }
        });
      }

      if (!thread) {
        const admins = await User.find({ role: { $in: ['admin', 'administrator', 'Administrator'] } });
        if (!admins.length) return res.status(400).json({ message: 'No admin found to receive message' });
        const adminIds = admins.map(a => a._id);

        if (isSenderAdmin) {
          if (!recipientId) return res.status(400).json({ message: 'Recipient required' });
          thread = await ChatThread.create({
            participants: [recipientId, ...adminIds]
          });
        } else {
          // Operator starting support thread
          thread = await ChatThread.create({
            participants: [req.user._id, ...adminIds]
          });
        }
      }
    }

    // Ensure all current admins and sender are included in participants
    const admins = await User.find({ role: { $in: ['admin', 'administrator', 'Administrator'] } }).select('_id');
    const existingStrs = new Set((thread.participants || []).map(p => p.toString()));
    let threadModified = false;
    for (const a of admins) {
      if (!existingStrs.has(a._id.toString())) {
        thread.participants.push(a._id);
        threadModified = true;
      }
    }
    if (!existingStrs.has(req.user._id.toString())) {
      thread.participants.push(req.user._id);
      threadModified = true;
    }
    if (threadModified) {
      await thread.save();
    }

    // Recipients are everyone in participants except the sender
    recipients = (thread.participants || []).filter(pId => pId.toString() !== req.user._id.toString());

    const newMessage = await ChatMessage.create({
      thread: thread._id,
      sender: req.user._id,
      message
    });

    thread.lastMessage = message;
    thread.lastMessageAt = new Date();
    await thread.save();

    const populatedMessage = await ChatMessage.findById(newMessage._id).populate('sender', 'name profilePic role');

    // Sync to sender's other devices
    emitToUser(req.user._id.toString(), 'chat_message', populatedMessage);

    const { sendPushToUser } = require('../services/pushService');

    // Notify recipients
    for (const recId of recipients) {
      // Real-time socket message to all participants
      emitToUser(recId.toString(), 'chat_message', populatedMessage);

      // Check recipient's role
      const recUser = await User.findById(recId).select('role');
      const isRecAdmin = recUser && String(recUser.role || '').toLowerCase().includes('admin');

      // Do NOT create notifications or push notifications for fellow admins when an admin sends a message!
      if (isSenderAdmin && isRecAdmin) {
        continue;
      }

      const notifTitle = isRecAdmin ? `New Message from ${req.user.name}` : 'GTRAMS Support';
      const notifMsg = isRecAdmin 
        ? `${req.user.name}: ${message.length > 80 ? message.substring(0, 77) + '...' : message}` 
        : `New message from GTRAMS Support`;
      const notifUrl = isRecAdmin ? '/admin/tickets' : '/operator-dashboard';

      const notification = await Notification.create({
        recipient: recId,
        type: 'chat',
        title: notifTitle,
        message: notifMsg
      });
      emitToUser(recId.toString(), 'notification', notification);
      
      sendPushToUser(recId, {
        title: notifTitle,
        message: message,
        type: 'chat',
        url: notifUrl
      });
    }

    const populatedThread = await ChatThread.findById(thread._id).populate('participants', 'name profilePic role');

    res.status(201).json({ message: populatedMessage, thread: populatedThread });

    // --- AUTO-REPLY LOGIC ---
    // If sender is not an admin, check for FAQ keywords
    if (!isSenderAdmin) {
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
        // Find an admin user to attribute auto-reply
        const adminUser = await User.findOne({ role: { $in: ['admin', 'administrator', 'Administrator'] } });
        const adminSenderId = adminUser ? adminUser._id : recipients[0];
        
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
          
          // Emit to all participants in the thread so admins see the auto-reply too
          const allParticipants = thread.participants;
          for (const pId of allParticipants) {
            emitToUser(pId.toString(), 'chat_message', popAutoMsg);
          }

          // But only notify the operator
          emitToUser(req.user._id.toString(), 'notification', await Notification.create({
            recipient: req.user._id,
            type: 'chat',
            title: 'Auto-Reply from GTRAMS',
            message: autoReply
          }));
          
          const { sendPushToUser } = require('../services/pushService');
          sendPushToUser(req.user._id, {
            title: 'Auto-Reply from GTRAMS',
            message: autoReply,
            type: 'chat',
            url: '/operator-dashboard'
          });
        }, 1500);
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Error sending message'});
  }
});

router.put('/messages/:threadId/read', async (req, res) => {
  try {
    const isUserAdmin = String(req.user.role || '').toLowerCase().includes('admin');
    const threadFilter = isUserAdmin
      ? { _id: req.params.threadId }
      : { _id: req.params.threadId, $or: [ { participants: req.user._id }, { isAnnouncement: true } ] };

    const thread = await ChatThread.findOne(threadFilter);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    if (isUserAdmin) {
      const adminUsers = await User.find({ role: { $in: ['admin', 'administrator', 'Administrator'] } }).select('_id');
      const adminIds = adminUsers.map(a => a._id);

      // Admin reading: ONLY mark messages from OPERATORS (non-admins) as read!
      // Do NOT touch outbound admin messages sent to the operator!
      await ChatMessage.updateMany(
        { thread: thread._id, sender: { $nin: adminIds }, isRead: false },
        { isRead: true }
      );

      // Notify all admins and sender
      emitToAdmins('chat_read', { threadId: thread._id });
      emitToUser(req.user._id.toString(), 'chat_read', { threadId: thread._id });
    } else {
      // Operator reading: mark all incoming messages as read
      await ChatMessage.updateMany(
        { thread: thread._id, sender: { $ne: req.user._id }, isRead: false },
        { isRead: true }
      );

      emitToUser(req.user._id.toString(), 'chat_read', { threadId: thread._id });
      emitToAdmins('chat_read', { threadId: thread._id });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read'});
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

    // Bulk create notifications to prevent event loop blocking
    const notificationsToInsert = users.map(user => ({
      recipient: user._id,
      type: 'chat',
      title: 'System Announcement',
      message: `Admin broadcasted an announcement`
    }));
    
    const insertedNotifications = await Notification.insertMany(notificationsToInsert);

    // Emit socket events
    users.forEach((user, index) => {
      emitToUser(user._id.toString(), 'chat_message', populatedMessage);
      emitToUser(user._id.toString(), 'notification', insertedNotifications[index]);
    });
    
    // Trigger push notifications
    const { broadcastPushNotification } = require('../services/pushService');
    broadcastPushNotification({
      role: { $in: ['operator', 'toda_president', 'toda president'] },
      title: 'System Announcement',
      message: message,
      type: 'announcement',
      url: '/operator-dashboard'
    });

    res.status(200).json({ message: 'Broadcast channel updated and notifications sent successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error broadcasting message'});
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
    res.status(500).json({ message: 'Error deleting message'});
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
    res.status(500).json({ message: 'Error deleting thread'});
  }
});

module.exports = router;
