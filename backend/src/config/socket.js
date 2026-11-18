const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/userModel');

let io;

const CLIENT_ORIGINS = String(process.env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const EXTRA_ALLOWED_ORIGINS = String(process.env.EXTRA_ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const ALLOWED_SOCKET_ORIGINS = [
  'https://g-trams-official.vercel.app',
  'https://g-trams-web2.vercel.app',
  ...(process.env.NODE_ENV !== 'production' ? [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ] : []),
  ...CLIENT_ORIGINS,
  ...EXTRA_ALLOWED_ORIGINS
];

const isSocketOriginAllowed = (origin) => {
  if (!origin) return true;
  if (ALLOWED_SOCKET_ORIGINS.includes(origin)) return true;
  if (
    process.env.ALLOW_VERCEL_PREVIEWS === 'true' &&
    /^https:\/\/g-trams(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin)
  ) {
    return true;
  }
  if (
    process.env.NODE_ENV !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i.test(origin)
  ) {
    return true;
  }
  return false;
};

function isStaffRole(rawRole) {
  const role = String(rawRole || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  return ['admin', 'administrator', 'system_admin', 'bplo_staff'].includes(role);
}

function isOperatorOrTodaRole(rawRole) {
  const role = String(rawRole || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  return role === 'operator' || role === 'toda_president';
}

function isLegitimateOperatorParticipant(thread, userDoc) {
  if (!thread || !userDoc || userDoc.isActive === false) return false;
  const uid = String(userDoc._id);
  if (thread.owner) {
    return String(thread.owner) === uid;
  }
  return (
    Array.isArray(thread.participants) &&
    thread.participants.length > 0 &&
    String(thread.participants[0]) === uid &&
    isOperatorOrTodaRole(userDoc.role)
  );
}

function leaveAllSocketRooms(socket) {
  if (!socket || !socket.rooms) return;
  for (const room of Array.from(socket.rooms)) {
    if (room !== socket.id) {
      try {
        socket.leave(room);
      } catch {
        // Ignore room leave errors during forced disconnect
      }
    }
  }
}

const disconnectUserSockets = (userId) => {
  if (!io || !userId) return 0;
  const targetId = String(userId);
  let disconnected = 0;
  for (const socket of io.sockets.sockets.values()) {
    const socketOwnerId = socket.data?.userId || socket.userId;
    if (socketOwnerId && String(socketOwnerId) === targetId) {
      leaveAllSocketRooms(socket);
      socket.emit('session_revoked', { reason: 'Session expired due to security update. Please login again.' });
      socket.disconnect(true);
      disconnected += 1;
    }
  }
  return disconnected;
};

const ensureSocketSessionActive = async (socket) => {
  if (!socket || !socket.connected) return null;
  const targetId = socket.data?.userId || socket.userId;
  const tokenVersion = socket.data?.tokenVersion;
  const tokenExpMs = socket.data?.tokenExpMs;

  if (!targetId || typeof tokenVersion !== 'number') {
    leaveAllSocketRooms(socket);
    socket.disconnect(true);
    return null;
  }

  if (typeof tokenExpMs === 'number' && Date.now() > tokenExpMs) {
    leaveAllSocketRooms(socket);
    socket.emit('session_revoked', { reason: 'Token expired. Please login again.' });
    socket.disconnect(true);
    return null;
  }

  const currentUser = await User.findById(targetId).select('name role isActive tokenVersion').lean().catch(() => null);
  if (!currentUser || currentUser.isActive === false || (currentUser.tokenVersion || 0) !== tokenVersion) {
    leaveAllSocketRooms(socket);
    socket.emit('session_revoked', { reason: 'Session expired due to security update. Please login again.' });
    socket.disconnect(true);
    return null;
  }

  if (!isStaffRole(currentUser.role) && socket.rooms?.has('admin')) {
    socket.leave('admin');
  }
  socket.userRole = currentUser.role;
  if (socket.user) {
    socket.user.role = currentUser.role;
  }

  return currentUser;
};

function createSocketRateLimiter(maxEvents, windowMs) {
  const timestamps = [];
  return () => {
    const now = Date.now();
    while (timestamps.length > 0 && now - timestamps[0] >= windowMs) {
      timestamps.shift();
    }
    if (timestamps.length >= maxEvents) {
      return false;
    }
    timestamps.push(now);
    return true;
  };
}

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isSocketOriginAllowed(origin)) {
          return callback(null, true);
        }
        callback(new Error('CORS not allowed'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // JWT authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error('Server authentication configuration error'));
      }
      const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      if (
        (decoded.tokenType !== undefined && decoded.tokenType !== 'access') ||
        (decoded.purpose !== undefined && decoded.purpose !== 'access')
      ) {
        return next(new Error('Invalid token type'));
      }
      const user = await User.findById(decoded.id).select('name role isActive tokenVersion').lean();
      if (!user || user.isActive === false) {
        return next(new Error('Account is inactive or not found'));
      }
      if (typeof decoded.tokenVersion !== 'number' || (user.tokenVersion || 0) !== decoded.tokenVersion) {
        return next(new Error('Session expired due to security update. Please login again.'));
      }
      socket.user = {
        id: String(user._id),
        name: user.name || 'Staff Member',
        role: user.role
      };
      socket.userId = socket.user.id;
      socket.userRole = user.role;
      socket.data = socket.data || {};
      socket.data.userId = socket.user.id;
      socket.data.tokenVersion = decoded.tokenVersion;
      socket.data.tokenExpMs = typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Token expired. Please login again.'));
      }
      next(new Error('Invalid token'));
    }
  });

  // In-memory active review locks to prevent concurrent staff decisions
  const activeReviewLocks = new Map();
  const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

  io.on('connection', (socket) => {
    // Join personal room
    socket.join(`user_${socket.userId}`);

    // Admins and BPLO Staff join administrative room
    const isAdminOrStaff = isStaffRole(socket.user?.role);
    if (isAdminOrStaff) {
      socket.join('admin');
    }

    const sessionCheckInterval = setInterval(() => {
      ensureSocketSessionActive(socket).catch(() => {});
    }, 60 * 1000);
    if (typeof sessionCheckInterval.unref === 'function') {
      sessionCheckInterval.unref();
    }

    const allowTypingEvent = createSocketRateLimiter(15, 5000);
    const allowLockEvent = createSocketRateLimiter(20, 10000);

    // Chat typing indicator (strict thread & role authorization + per-socket rate limit)
    socket.on('chat_typing', async (data) => {
      const senderUser = await ensureSocketSessionActive(socket);
      if (!senderUser) return;
      if (!allowTypingEvent()) return;
      if (!data || typeof data !== 'object') return;
      const { threadId, recipientId } = data;
      if (!recipientId || typeof recipientId !== 'string' || !mongoose.Types.ObjectId.isValid(recipientId)) return;
      if (!threadId || typeof threadId !== 'string' || !mongoose.Types.ObjectId.isValid(threadId)) return;
      if (String(recipientId) === socket.userId) return;

      try {
        const [{ ChatThread }, recipientUser] = await Promise.all([
          Promise.resolve(require('../models/chatModel')),
          User.findById(recipientId).select('role isActive').lean()
        ]);

        if (!recipientUser || recipientUser.isActive === false) return;

        const thread = await ChatThread.findById(threadId)
          .select('_id participants owner isAnnouncement')
          .lean();
        if (!thread || thread.isAnnouncement) return;

        const senderIsStaff = isStaffRole(senderUser.role);
        const recipientIsStaff = isStaffRole(recipientUser.role);

        if (senderIsStaff) {
          const isRecipientAllowed =
            isLegitimateOperatorParticipant(thread, recipientUser) ||
            (recipientIsStaff && Array.isArray(thread.participants) && thread.participants.some(p => String(p) === String(recipientId)));
          if (!isRecipientAllowed) return;
        } else {
          if (!isLegitimateOperatorParticipant(thread, senderUser) || !recipientIsStaff) return;
        }

        io.to(`user_${recipientId}`).emit('chat_typing', {
          threadId,
          userId: socket.userId
        });
      } catch {
        // Ignore transient typing lookup errors
      }
    });

    // Concurrency: Review Locking (Staff / Admin only, identity derived strictly from socket.user)
    const handleLockApplication = async (data, callback) => {
      const currentUser = await ensureSocketSessionActive(socket);
      if (!currentUser || !isStaffRole(currentUser.role)) return;
      if (!allowLockEvent()) {
        if (typeof callback === 'function') {
          callback({ isLocked: false, rateLimited: true });
        }
        return;
      }
      if (!data || typeof data !== 'object') return;
      const { franchiseId } = data;
      if (!franchiseId || typeof franchiseId !== 'string') return;

      const serverStaffId = String(currentUser._id);
      const serverStaffName = currentUser.name || socket.user?.name || 'Administrator';

      const now = Date.now();
      const existing = activeReviewLocks.get(franchiseId);

      // Check if another staff holds an active non-expired lock
      if (existing && (now - existing.lockedAt < LOCK_TTL_MS) && existing.userId !== serverStaffId) {
        if (typeof callback === 'function') {
          callback({
            isLocked: true,
            reviewerName: existing.userName,
            reviewerId: existing.userId,
            lockedAt: existing.lockedAt
          });
        }
        return;
      }

      // Claim or refresh lock using server-verified staff identity
      const lockData = {
        socketId: socket.id,
        userId: serverStaffId,
        userName: serverStaffName,
        lockedAt: now
      };
      activeReviewLocks.set(franchiseId, lockData);

      if (typeof callback === 'function') {
        callback({ isLocked: false });
      }

      // Notify other admins that this franchise is now being reviewed
      socket.to('admin').emit('review:locked', {
        franchiseId,
        reviewerName: lockData.userName,
        reviewerId: lockData.userId
      });
    };

    socket.on('review:join', handleLockApplication);
    socket.on('lock_application', handleLockApplication);

    const handleUnlockApplication = async (data) => {
      const currentUser = await ensureSocketSessionActive(socket);
      if (!currentUser || !isStaffRole(currentUser.role)) return;
      if (!allowLockEvent()) return;
      if (!data || typeof data !== 'object') return;
      const { franchiseId } = data;
      if (!franchiseId || typeof franchiseId !== 'string') return;
      const existing = activeReviewLocks.get(franchiseId);
      if (existing && (existing.socketId === socket.id || existing.userId === socket.userId)) {
        activeReviewLocks.delete(franchiseId);
        io.to('admin').emit('review:unlocked', { franchiseId });
      }
    };

    socket.on('review:leave', handleUnlockApplication);
    socket.on('unlock_application', handleUnlockApplication);

    socket.on('disconnect', () => {
      clearInterval(sessionCheckInterval);
      // Release any review locks held by this disconnected socket
      for (const [franchiseId, lock] of activeReviewLocks.entries()) {
        if (lock.socketId === socket.id) {
          activeReviewLocks.delete(franchiseId);
          io.to('admin').emit('review:unlocked', { franchiseId });
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

const emitToAdmins = (event, data) => {
  if (io) {
    io.to('admin').emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToAdmins,
  disconnectUserSockets,
  ensureSocketSessionActive
};
