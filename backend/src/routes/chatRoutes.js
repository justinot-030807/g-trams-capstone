const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { ChatMessage, ChatThread } = require('../models/chatModel');
const { emitToUser, emitToAdmins } = require('../config/socket');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const { logAudit } = require('../utils/auditLogger');

const STAFF_ROLES = ['admin', 'administrator', 'Administrator', 'system_admin', 'system admin', 'bplo_staff', 'bplo staff'];
const STAFF_SENDER_ROLE = /^\s*(?:admin|administrator|system(?:_|[\s-]+)admin|bplo(?:_|[\s-]+)staff)\s*$/i;

function isStaffRoleValue(role) {
  const normalized = String(role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  return ['system_admin', 'admin', 'administrator', 'bplo_staff'].includes(normalized);
}

function isStaffUser(user) {
  if (!user || user.isActive === false) return false;
  return isStaffRoleValue(user.role);
}

async function isAuthorizedForThread(thread, user, participantUserMap = null) {
  if (!thread || !user) return false;
  if (isStaffUser(user)) return true;
  if (thread.isAnnouncement) return true;
  const map = participantUserMap || (await buildParticipantUserMap([thread]));
  return canNonStaffAccessSupportThread(thread, user, map);
}

function isOperatorOrPresidentRole(role) {
  const normalized = String(role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  return normalized === 'operator' || normalized === 'toda_president';
}

async function getStaffUsers({ activeOnly = true } = {}) {
  const filter = { role: { $in: STAFF_ROLES } };
  if (activeOnly) filter.isActive = { $ne: false };
  return User.find(filter).select('_id role isActive').lean();
}

function staffInboxFilter(userId, threads) {
  const unknownRoles = [null, /^\s*$/];
  const inbound = [{ senderRole: { $exists: true, $nin: [...unknownRoles, STAFF_SENDER_ROLE] } }];
  // On older messages, a persisted support owner can identify the sender's
  // side of the thread without consulting the user's current role.
  const legacyOwners = threads.filter(thread => thread.owner && !thread.isAnnouncement)
    .map(thread => ({ thread: thread._id, sender: thread.owner._id || thread.owner }));
  if (legacyOwners.length) inbound.push({ senderRole: { $in: unknownRoles }, $or: legacyOwners });
  return { sender: { $ne: userId }, $or: inbound };
}

async function buildParticipantUserMap(threads) {
  const ids = new Set();
  for (const t of threads) {
    if (t && !t.owner && Array.isArray(t.participants)) {
      for (const p of t.participants) {
        if (p && typeof p === 'object' && p.role !== undefined) continue;
        const pid = String(p?._id || p || '');
        if (mongoose.Types.ObjectId.isValid(pid)) ids.add(pid);
      }
    }
  }
  const map = new Map();
  if (ids.size === 0) return map;
  const users = await User.find({ _id: { $in: Array.from(ids) } }).select('_id role isActive').lean();
  for (const u of users) {
    map.set(String(u._id), u);
  }
  return map;
}

function getSingleLegacyOperatorOwnerId(thread, participantUserMap) {
  if (!thread || !Array.isArray(thread.participants) || thread.participants.length === 0) {
    return null;
  }
  const seen = new Set();
  const operatorCandidates = [];
  for (const p of thread.participants) {
    const pid = String(p?._id || p || '');
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);
    const pUser = (p && typeof p === 'object' && p.role !== undefined)
      ? p
      : participantUserMap?.get(pid);
    if (!pUser) continue;
    if (isOperatorOrPresidentRole(pUser.role)) {
      operatorCandidates.push(pid);
    }
  }
  return operatorCandidates.length === 1 ? operatorCandidates[0] : null;
}

function canNonStaffAccessSupportThread(thread, user, participantUserMap) {
  if (!thread || thread.isAnnouncement || !user) return false;
  const uid = String(user._id || user);
  if (thread.owner) {
    return String(thread.owner) === uid;
  }
  if (!isOperatorOrPresidentRole(user.role)) {
    return false;
  }
  const singleOwnerId = getSingleLegacyOperatorOwnerId(thread, participantUserMap);
  return Boolean(singleOwnerId && singleOwnerId === uid);
}

function resolveSupportThreadOwnerId(thread, activeStaffIdSet, participantUserMap) {
  if (thread.owner) return thread.owner;
  const singleOwnerId = getSingleLegacyOperatorOwnerId(thread, participantUserMap);
  if (singleOwnerId) return singleOwnerId;
  if (Array.isArray(thread.participants)) {
    const nonStaff = thread.participants.find(p => {
      const pid = String(p?._id || p);
      if (activeStaffIdSet.has(pid)) return false;
      const pUser = (p && typeof p === 'object' && p.role !== undefined)
        ? p
        : participantUserMap?.get(pid);
      return pUser ? isOperatorOrPresidentRole(pUser.role) : false;
    });
    if (nonStaff) return nonStaff._id || nonStaff;
  }
  return null;
}

router.use(protect);

router.get('/unread-count', async (req, res) => {
  try {
    const isUserAdmin = isStaffUser(req.user);

    let threadIds = [];
    let inboxFilter = { sender: { $ne: req.user._id } };

    if (isUserAdmin) {
      // For active staff: all support threads, and only count inbound messages from operators/non-staff
      const threads = await ChatThread.find({ isAnnouncement: false }).select('_id owner').lean();
      threadIds = threads.map(t => t._id);
      inboxFilter = staffInboxFilter(req.user._id, threads);
    } else {
      // For operators: only their own support threads, excluding announcements
      const candidateThreads = await ChatThread.find({
        isAnnouncement: false,
        $or: [
          { owner: req.user._id },
          { owner: null, participants: req.user._id }
        ]
      }).select('_id owner participants isAnnouncement').lean();

      const participantUserMap = await buildParticipantUserMap(candidateThreads);
      threadIds = candidateThreads
        .filter(t => canNonStaffAccessSupportThread(t, req.user, participantUserMap))
        .map(t => t._id);
    }

    const count = threadIds.length > 0
      ? await ChatMessage.countDocuments({
          thread: { $in: threadIds },
          ...inboxFilter,
          isRead: false
        })
      : 0;

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count' });
  }
});

async function buildAnnouncementAudienceCondition(user) {
  const Franchise = require('../models/franchiseModel');
  const userFranchises = await Franchise.find({
    operator: user._id,
    isArchived: { $ne: true }
  }).select('todaName status').lean();

  const wildCardToda = {
    $or: [{ targetToda: { $exists: false } }, { targetToda: { $in: ['ALL', '', null] } }]
  };
  const wildCardStatus = {
    $or: [{ targetStatus: { $exists: false } }, { targetStatus: { $in: ['ALL', '', null] } }]
  };

  const clauses = [{ $and: [wildCardToda, wildCardStatus] }];

  const permitTodas = new Set();
  const permitStatuses = new Set();
  const permitPairKeys = new Set();
  const permitPairs = [];

  for (const f of userFranchises) {
    const tName = f.todaName ? String(f.todaName).trim() : '';
    const st = f.status ? String(f.status).trim() : '';
    if (tName) permitTodas.add(tName);
    if (st) permitStatuses.add(st);
    if (tName && st) {
      const key = `${tName}\u0000${st}`;
      if (!permitPairKeys.has(key)) {
        permitPairKeys.add(key);
        permitPairs.push({ targetToda: tName, targetStatus: st });
      }
    }
  }

  if (permitTodas.size > 0) {
    clauses.push({ $and: [{ targetToda: { $in: Array.from(permitTodas) } }, wildCardStatus] });
  }
  if (permitStatuses.size > 0) {
    clauses.push({ $and: [wildCardToda, { targetStatus: { $in: Array.from(permitStatuses) } }] });
  }
  for (const pair of permitPairs) {
    clauses.push({ targetToda: pair.targetToda, targetStatus: pair.targetStatus });
  }

  return [{ $or: clauses }];
}

router.get('/threads', async (req, res) => {
  try {
    const isUserAdmin = isStaffUser(req.user);
    const staffUsers = await getStaffUsers({ activeOnly: !isUserAdmin });
    const activeStaffIdSet = new Set(staffUsers.filter(user => user.isActive !== false).map(user => String(user._id)));

    let query;
    if (isUserAdmin) {
      // Active staff see all non-announcement support threads and announcements
      query = {};
    } else {
      // Operators see support threads they own or official broadcasts
      query = {
        $or: [
          { isAnnouncement: true },
          { isAnnouncement: { $ne: true }, owner: req.user._id },
          { isAnnouncement: { $ne: true }, owner: null, participants: req.user._id }
        ]
      };
    }

    const rawThreads = await ChatThread.find(query)
      .populate('participants', 'name profilePic role isActive')
      .sort({ lastMessageAt: -1 });

    const participantUserMap = await buildParticipantUserMap(rawThreads);
    const threads = isUserAdmin
      ? rawThreads
      : rawThreads.filter(t => t.isAnnouncement || canNonStaffAccessSupportThread(t, req.user, participantUserMap));

    const announcementAudienceCond = !isUserAdmin ? await buildAnnouncementAudienceCondition(req.user) : null;

    const threadsWithUnread = await Promise.all(threads.map(async (thread) => {
      const inboxFilter = isUserAdmin ? staffInboxFilter(req.user._id, [thread]) : { sender: { $ne: req.user._id } };
      let unreadCount = 0;

      if (thread.isAnnouncement) {
        const countQuery = {
          thread: thread._id,
          ...inboxFilter,
          readBy: { $ne: req.user._id }
        };
        if (!isUserAdmin && announcementAudienceCond) {
          countQuery.$and = announcementAudienceCond;
        }
        unreadCount = await ChatMessage.countDocuments(countQuery);
      } else {
        unreadCount = await ChatMessage.countDocuments({
          thread: thread._id,
          ...inboxFilter,
          isRead: false
        });
      }

      const threadObj = thread.toObject();
      if (!thread.isAnnouncement && Array.isArray(threadObj.participants)) {
        const ownerId = resolveSupportThreadOwnerId(thread, activeStaffIdSet, participantUserMap);
        threadObj.participants = threadObj.participants.filter(p => {
          const pid = String(p?._id || p);
          return (ownerId && pid === String(ownerId)) || activeStaffIdSet.has(pid);
        });
      }

      if (thread.isAnnouncement && !isUserAdmin && announcementAudienceCond) {
        const latestVisible = await ChatMessage.findOne({
          thread: thread._id,
          $and: announcementAudienceCond
        }).sort({ createdAt: -1 }).select('message createdAt').lean();
        threadObj.lastMessage = latestVisible ? latestVisible.message : '';
        if (latestVisible && latestVisible.createdAt) {
          threadObj.lastMessageAt = latestVisible.createdAt;
        }
      }
      return { ...threadObj, unreadCount };
    }));

    res.json(threadsWithUnread);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching threads' });
  }
});

router.get('/messages/:threadId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.threadId)) {
      return res.status(400).json({ message: 'Invalid thread ID' });
    }

    const isUserAdmin = isStaffUser(req.user);

    const thread = await ChatThread.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const participantUserMap = await buildParticipantUserMap([thread]);
    if (!isUserAdmin && !thread.isAnnouncement && !canNonStaffAccessSupportThread(thread, req.user, participantUserMap)) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const andConditions = [];
    if (thread.isAnnouncement && !isUserAdmin) {
      const audienceCond = await buildAnnouncementAudienceCondition(req.user);
      andConditions.push(...audienceCond);
    }

    if (req.query.before !== undefined && String(req.query.before).trim() !== '') {
      const beforeRaw = String(req.query.before).trim();
      if (mongoose.Types.ObjectId.isValid(beforeRaw)) {
        const cursorMsg = await ChatMessage.findOne({ _id: beforeRaw, thread: thread._id })
          .select('createdAt _id')
          .lean();
        if (cursorMsg) {
          andConditions.push({
            $or: [
              { createdAt: { $lt: cursorMsg.createdAt } },
              { createdAt: cursorMsg.createdAt, _id: { $lt: cursorMsg._id } }
            ]
          });
        } else {
          andConditions.push({ _id: { $lt: new mongoose.Types.ObjectId(beforeRaw) } });
        }
      } else {
        const beforeDate = new Date(beforeRaw);
        if (Number.isNaN(beforeDate.getTime())) {
          return res.status(400).json({ message: 'Invalid before cursor' });
        }
        andConditions.push({ createdAt: { $lt: beforeDate } });
      }
    }

    const parsedLimit = parseInt(req.query.limit, 10);
    const limitNum = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 100;

    const messageQuery = { thread: thread._id };
    if (andConditions.length > 0) {
      messageQuery.$and = andConditions;
    }

    const recentMessages = await ChatMessage.find(messageQuery)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limitNum)
      .populate('sender', 'name profilePic role');

    const ordered = recentMessages.reverse();
    if (thread.isAnnouncement) {
      const uid = String(req.user._id);
      const formatted = ordered.map((m) => {
        const obj = m.toObject();
        obj.isRead = Array.isArray(m.readBy) && m.readBy.some(id => String(id) === uid);
        delete obj.readBy;
        return obj;
      });
      return res.json(formatted);
    }

    res.json(ordered);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

router.post('/messages', async (req, res) => {
  try {
    let { recipientId, message, threadId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Missing message' });
    }

    const isSenderAdmin = isStaffUser(req.user);
    const activeStaff = await getStaffUsers();
    const activeStaffIds = activeStaff.map(a => a._id);
    const activeStaffIdSet = new Set(activeStaffIds.map(id => String(id)));

    let thread = null;
    let participantUserMap = new Map();
    if (threadId && threadId !== 'new') {
      if (!mongoose.Types.ObjectId.isValid(threadId)) {
        return res.status(400).json({ message: 'Invalid thread ID' });
      }
      thread = await ChatThread.findById(threadId);
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }
      participantUserMap = await buildParticipantUserMap([thread]);
      if (!isSenderAdmin && !canNonStaffAccessSupportThread(thread, req.user, participantUserMap)) {
        return res.status(403).json({ message: 'Unauthorized to post in this thread' });
      }
    }

    if (!thread) {
      if (!isSenderAdmin) {
        const existingCandidates = await ChatThread.find({
          isAnnouncement: { $ne: true },
          $or: [
            { owner: req.user._id },
            { owner: null, participants: req.user._id }
          ]
        });
        participantUserMap = await buildParticipantUserMap(existingCandidates);
        thread = existingCandidates.find(t => canNonStaffAccessSupportThread(t, req.user, participantUserMap)) || null;
      }

      if (!thread) {
        if (activeStaffIds.length === 0) {
          return res.status(400).json({ message: 'No active admin found to receive message' });
        }

        if (isSenderAdmin) {
          if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ message: 'Valid recipient required' });
          }
          const recipientUser = await User.findById(recipientId).select('_id isActive').lean();
          if (!recipientUser || recipientUser.isActive === false) {
            return res.status(404).json({ message: 'Recipient user not found or inactive' });
          }
          thread = await ChatThread.create({
            owner: recipientUser._id,
            participants: [recipientUser._id, ...activeStaffIds]
          });
        } else {
          thread = await ChatThread.create({
            owner: req.user._id,
            participants: [req.user._id, ...activeStaffIds]
          });
        }
      }
    }

    if (thread.isAnnouncement && !isSenderAdmin) {
      return res.status(403).json({ message: 'Only staff can post announcements' });
    }

    // Reconcile support thread ownership and participants strictly against current active staff
    if (!thread.owner && participantUserMap.size === 0) {
      participantUserMap = await buildParticipantUserMap([thread]);
    }
    let ownerId = resolveSupportThreadOwnerId(thread, activeStaffIdSet, participantUserMap);
    if (!ownerId && !isSenderAdmin) {
      ownerId = req.user._id;
    }
    if (!thread.owner && ownerId) {
      thread.owner = ownerId;
    }

    const desiredParticipantIds = [];
    const seen = new Set();
    if (ownerId) {
      seen.add(String(ownerId));
      desiredParticipantIds.push(ownerId);
    }
    for (const aId of activeStaffIds) {
      const s = String(aId);
      if (!seen.has(s)) {
        seen.add(s);
        desiredParticipantIds.push(aId);
      }
    }
    if (isSenderAdmin && !seen.has(String(req.user._id))) {
      seen.add(String(req.user._id));
      desiredParticipantIds.push(req.user._id);
    }

    thread.participants = desiredParticipantIds;

    // Recipients are ONLY the thread owner (if active) and currently active staff, excluding sender
    const recipientUsers = await User.find({
      _id: { $in: desiredParticipantIds },
      isActive: { $ne: false }
    }).select('_id role').lean();

    const recipients = recipientUsers
      .filter(u => String(u._id) !== String(req.user._id))
      .filter(u => (ownerId && String(u._id) === String(ownerId)) || isStaffUser(u));

    const newMessage = await ChatMessage.create({
      thread: thread._id,
      sender: req.user._id,
      senderRole: req.user.role,
      message,
      readBy: [req.user._id]
    });

    thread.lastMessage = message;
    thread.lastMessageAt = new Date();
    await thread.save();

    const populatedMessage = await ChatMessage.findById(newMessage._id).populate('sender', 'name profilePic role');

    // Sync to sender's other devices
    emitToUser(req.user._id.toString(), 'chat_message', populatedMessage);

    const { sendPushToUser } = require('../services/pushService');

    // Notify verified active recipients only
    for (const recUser of recipients) {
      const recId = recUser._id;
      emitToUser(recId.toString(), 'chat_message', populatedMessage);

      const isRecAdmin = isStaffUser(recUser);

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
        threadId: thread._id,
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
    if (!isSenderAdmin) {
      let autoReply = null;
      const lowerMsg = message.toLowerCase();

      if (lowerMsg.includes('paano') && lowerMsg.includes('renew')) {
        autoReply = "Automated Reply: Para mag-renew, kailangan ng latest OR/CR, lumang prangkisa, at barangay clearance. Pumunta sa 'Apply Franchise' at piliin ang Renewal.";
      } else if (lowerMsg.includes('requirements') && (lowerMsg.includes('bago') || lowerMsg.includes('prangkisa'))) {
        autoReply = "Automated Reply: Ang requirements para sa bagong prangkisa: 1. OR/CR, 2. Driver's License, 3. Barangay Clearance, 4. TODA Certificate, 5. Sedula.";
      } else if ((lowerMsg.includes('saan') || lowerMsg.includes('paano')) && (lowerMsg.includes('claim') || lowerMsg.includes('kunin') || lowerMsg.includes('bayad') || lowerMsg.includes('cashier') || lowerMsg.includes('stub'))) {
        autoReply = "Automated Reply: Magbayad sa Municipal Cashier / Treasury pagkatapos maaprubahan ang inyong requirements. Kapag napirmahan na ang permit, kunin ang inyong opisyal na MTOP Certificate at sticker sa Office of the Vice Mayor (OVM) / Sangguniang Bayan.";
      }

      if (autoReply && activeStaffIds.length > 0) {
        setTimeout(async () => {
          try {
            const freshStaff = await getStaffUsers();
            const autoReplySender = freshStaff.find(staff => staff._id.equals(activeStaffIds[0])) || freshStaff[0];
            if (!autoReplySender) return;
            const adminSenderId = autoReplySender._id;
            const autoMsg = await ChatMessage.create({
              thread: thread._id,
              sender: adminSenderId,
              senderRole: autoReplySender.role,
              message: autoReply,
              readBy: [adminSenderId]
            });

            thread.lastMessage = autoReply;
            thread.lastMessageAt = new Date();
            await thread.save();

            const popAutoMsg = await ChatMessage.findById(autoMsg._id).populate('sender', 'name profilePic role');

            const emitIds = new Set([String(req.user._id), ...freshStaff.map(s => String(s._id))]);
            for (const pId of emitIds) {
              emitToUser(pId, 'chat_message', popAutoMsg);
            }

            emitToUser(req.user._id.toString(), 'notification', await Notification.create({
              recipient: req.user._id,
              type: 'chat',
              threadId: thread._id,
              title: 'Auto-Reply from GTRAMS',
              message: autoReply
            }));

            sendPushToUser(req.user._id, {
              title: 'Auto-Reply from GTRAMS',
              message: autoReply,
              type: 'chat',
              url: '/operator-dashboard'
            });
          } catch (err) {
            console.error('[Chat Auto-Reply Error]:', err.message);
          }
        }, 1500);
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Error sending message' });
  }
});

async function markThreadNotificationsRead(thread, user, isStaff) {
  const threadMatches = [{ threadId: thread._id }];
  if (!isStaff && thread.createdAt) {
    const candidates = await ChatThread.find(thread.isAnnouncement
      ? { isAnnouncement: true }
      : {
          isAnnouncement: { $ne: true },
          $or: [{ owner: user._id }, { owner: null, participants: user._id }]
        }).select('_id').limit(2).lean();

    if (candidates.length === 1 && String(candidates[0]._id) === String(thread._id)) {
      // Old staff notifications contain only a display name and a preview. Citizen
      // notification templates identify the thread category when there is just one candidate.
      const legacyTemplates = thread.isAnnouncement
        ? [{ title: /^(?:System Announcement|Advisory for .+)$/, message: /^Admin broadcasted an announcement(?: for .+)?$/ }]
        : [
            { title: 'GTRAMS Support', message: 'New message from GTRAMS Support' },
            { title: 'Auto-Reply from GTRAMS', message: /^Automated Reply: / }
          ];
      threadMatches.push({ threadId: null, createdAt: { $gte: thread.createdAt }, $or: legacyTemplates });
    }
  }

  await Notification.updateMany(
    { recipient: user._id, type: 'chat', isRead: false, $or: threadMatches },
    { $set: { isRead: true, threadId: thread._id } }
  );
}

router.put('/messages/:threadId/read', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.threadId)) {
      return res.status(400).json({ message: 'Invalid thread ID' });
    }

    const isUserAdmin = isStaffUser(req.user);
    const thread = await ChatThread.findById(req.params.threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const participantUserMap = await buildParticipantUserMap([thread]);
    if (!isUserAdmin && !thread.isAnnouncement && !canNonStaffAccessSupportThread(thread, req.user, participantUserMap)) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const inboxFilter = isUserAdmin
      ? staffInboxFilter(req.user._id, [thread])
      : { sender: { $ne: req.user._id } };
    const match = { thread: thread._id, ...inboxFilter };
    const update = { $addToSet: { readBy: req.user._id } };
    if (thread.isAnnouncement) {
      match.readBy = { $ne: req.user._id };
      if (!isUserAdmin) match.$and = await buildAnnouncementAudienceCondition(req.user);
    } else {
      match.isRead = false;
      update.$set = { isRead: true };
    }
    await ChatMessage.updateMany(match, update);
    await markThreadNotificationsRead(thread, req.user, isUserAdmin);

    emitToUser(req.user._id.toString(), 'chat_read', { threadId: thread._id });
    if (!thread.isAnnouncement) emitToAdmins('chat_read', { threadId: thread._id });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

router.post('/broadcast', async (req, res) => {
  try {
    const { message, targetToda = 'ALL', targetStatus = 'ALL' } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Missing message' });
    }

    // Ensure only active staff can broadcast
    if (!isStaffUser(req.user)) {
      return res.status(403).json({ message: 'Only admins can broadcast messages' });
    }

    const Franchise = require('../models/franchiseModel');
    let userQuery = {
      role: { $in: ['operator', 'toda_president', 'toda president'] },
      isActive: { $ne: false }
    };

    if (targetStatus && targetStatus !== 'ALL') {
      const franchiseQuery = { status: targetStatus, isArchived: { $ne: true } };
      if (targetToda && targetToda !== 'ALL') {
        franchiseQuery.todaName = targetToda;
      }
      const operatorIds = await Franchise.find(franchiseQuery).distinct('operator');
      userQuery._id = { $in: operatorIds };
    } else if (targetToda && targetToda !== 'ALL') {
      const franchiseOperators = await Franchise.find({ todaName: targetToda, isArchived: { $ne: true } }).distinct('operator');
      userQuery.$or = [
        { role: { $in: ['toda_president', 'toda president'] }, todaAssociation: targetToda },
        { _id: { $in: franchiseOperators } }
      ];
    }

    const users = await User.find(userQuery);

    let thread = await ChatThread.findOne({ isAnnouncement: true });
    if (!thread) {
      thread = await ChatThread.create({
        participants: [req.user._id],
        isAnnouncement: true
      });
    }

    let formattedHeader = '[ANNOUNCEMENT]';
    if (targetToda !== 'ALL' || targetStatus !== 'ALL') {
      const parts = [];
      if (targetToda !== 'ALL') parts.push(`TODA: ${targetToda}`);
      if (targetStatus !== 'ALL') parts.push(`Status: ${targetStatus}`);
      formattedHeader = `[ANNOUNCEMENT - ${parts.join(' | ')}]`;
    }

    const fullMessage = `${formattedHeader}\n\n${message}`;

    const newMessage = await ChatMessage.create({
      thread: thread._id,
      sender: req.user._id,
      senderRole: req.user.role,
      message: fullMessage,
      targetToda,
      targetStatus,
      readBy: [req.user._id]
    });

    thread.lastMessage = fullMessage;
    thread.lastMessageAt = new Date();
    await thread.save();

    const populatedMessage = await ChatMessage.findById(newMessage._id).populate('sender', 'name profilePic role');

    const notifTitle = targetToda !== 'ALL' || targetStatus !== 'ALL'
      ? `Advisory for ${targetToda !== 'ALL' ? targetToda : targetStatus}`
      : 'System Announcement';

    const notificationsToInsert = users.map(user => ({
      recipient: user._id,
      type: 'chat',
      threadId: thread._id,
      title: notifTitle,
      message: `Admin broadcasted an announcement${targetToda !== 'ALL' ? ` for ${targetToda}` : ''}`
    }));

    let insertedNotifications = [];
    if (notificationsToInsert.length > 0) {
      insertedNotifications = await Notification.insertMany(notificationsToInsert);
    }

    users.forEach((user, index) => {
      emitToUser(user._id.toString(), 'chat_message', populatedMessage);
      if (insertedNotifications[index]) {
        emitToUser(user._id.toString(), 'notification', insertedNotifications[index]);
      }
    });

    const { sendPushToUser } = require('../services/pushService');
    const pushPromises = users.map(user => sendPushToUser(user._id, {
      title: notifTitle,
      message: message,
      type: 'announcement',
      url: '/operator-dashboard'
    }));
    await Promise.allSettled(pushPromises);

    res.status(200).json({
      message: `Broadcast successfully dispatched to ${users.length} recipient(s).`,
      recipientCount: users.length
    });
  } catch (error) {
    console.error('Error broadcasting message:', error);
    res.status(500).json({ message: 'Error broadcasting message' });
  }
});

router.delete('/messages/:messageId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }
    const message = await ChatMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const isAdmin = isStaffUser(req.user);
    const thread = await ChatThread.findById(message.thread);
    if (!thread) {
      if (!isAdmin) {
        return res.status(403).json({ message: 'Unauthorized to delete this message' });
      }
    } else {
      const participantUserMap = await buildParticipantUserMap([thread]);
      const hasThreadAccess = await isAuthorizedForThread(thread, req.user, participantUserMap);
      if (!hasThreadAccess) {
        return res.status(403).json({ message: 'Unauthorized to delete messages in this thread' });
      }

      // Announcement messages are official staff communications — only current staff may delete them
      if (thread.isAnnouncement && !isAdmin) {
        return res.status(403).json({ message: 'Only current staff can delete announcement messages' });
      }

      // In support threads, non-staff may only delete messages authored by the current thread owner
      if (!isAdmin) {
        const activeStaff = await getStaffUsers();
        const activeStaffIdSet = new Set(activeStaff.map(a => String(a._id)));
        const ownerId = resolveSupportThreadOwnerId(thread, activeStaffIdSet, participantUserMap);
        if (!ownerId || String(message.sender) !== String(ownerId)) {
          return res.status(403).json({ message: 'Only current staff can delete official staff replies' });
        }
      }
    }

    // If the message records a staff senderRole, only current staff may delete it (blocks demoted former staff)
    const rawSenderRole = typeof message.get === 'function' ? message.get('senderRole') : message.senderRole;
    if (isStaffRoleValue(rawSenderRole) && !isAdmin) {
      return res.status(403).json({ message: 'Only current staff can delete staff messages' });
    }

    if (String(message.sender) !== String(req.user._id) && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to delete this message' });
    }

    await ChatMessage.findByIdAndDelete(req.params.messageId);
    await logAudit(req, {
      action: 'CHAT_MESSAGE_DELETED',
      targetType: 'General',
      targetId: req.params.messageId,
      details: { threadId: String(message.thread) }
    });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message' });
  }
});

router.delete('/threads/:threadId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.threadId)) {
      return res.status(400).json({ message: 'Invalid thread ID' });
    }
    if (!isStaffUser(req.user)) {
      return res.status(403).json({ message: 'Only admins can delete entire threads' });
    }

    await ChatMessage.deleteMany({ thread: req.params.threadId });
    await ChatThread.findByIdAndDelete(req.params.threadId);
    await logAudit(req, {
      action: 'CHAT_THREAD_DELETED',
      targetType: 'General',
      targetId: req.params.threadId,
      details: { threadId: req.params.threadId }
    });

    res.json({ message: 'Thread and all messages deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting thread' });
  }
});

module.exports = router;
