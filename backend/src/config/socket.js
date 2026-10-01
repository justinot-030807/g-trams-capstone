const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        callback(new Error('CORS not allowed'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // JWT authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
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
    
    // Admins join admin room
    const role = String(socket.userRole || '').toLowerCase().replace(/_/g, ' ');
    if (role === 'admin' || role === 'administrator') {
      socket.join('admin');
    }

    // Chat typing indicator
    socket.on('chat_typing', ({ threadId, recipientId }) => {
      if (recipientId) {
        io.to(`user_${recipientId}`).emit('chat_typing', {
          threadId,
          userId: socket.userId
        });
      }
    });

    // Concurrency: Review Locking
    socket.on('review:join', ({ franchiseId, userName }, callback) => {
      if (!franchiseId) return;
      const now = Date.now();
      const existing = activeReviewLocks.get(franchiseId);

      // Check if another staff holds an active non-expired lock
      if (existing && (now - existing.lockedAt < LOCK_TTL_MS) && existing.userId !== socket.userId) {
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

      // Claim or refresh lock
      const lockData = {
        socketId: socket.id,
        userId: socket.userId,
        userName: userName || 'Another Administrator',
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
    });

    socket.on('review:leave', ({ franchiseId }) => {
      if (!franchiseId) return;
      const existing = activeReviewLocks.get(franchiseId);
      if (existing && (existing.socketId === socket.id || existing.userId === socket.userId)) {
        activeReviewLocks.delete(franchiseId);
        io.to('admin').emit('review:unlocked', { franchiseId });
      }
    });

    socket.on('disconnect', () => {
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

module.exports = { initSocket, getIO, emitToUser, emitToAdmins };
