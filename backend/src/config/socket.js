const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

let io;

const ALLOWED_SOCKET_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://g-trams-official.vercel.app',
  'https://g-trams-web2.vercel.app',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL.replace(/\/$/, '')] : [])
];

const isSocketOriginAllowed = (origin) => {
  if (!origin) return true;
  if (ALLOWED_SOCKET_ORIGINS.includes(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.(vercel\.app|workers\.dev|onrender\.com)$/i.test(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i.test(origin)) return true;
  return false;
};

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
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('role isActive').lean();
      if (!user || user.isActive === false) {
        return next(new Error('Account is inactive or not found'));
      }
      socket.userId = String(decoded.id);
      socket.userRole = user.role || decoded.role;
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
    const role = String(socket.userRole || '').toLowerCase().replace(/[\s-]+/g, '_');
    const isAdminOrStaff = role === 'admin' || role === 'administrator' || role === 'system_admin' || role === 'bplo_staff';
    if (isAdminOrStaff) {
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

    // Concurrency: Review Locking (Staff / Admin only)
    socket.on('review:join', ({ franchiseId, userName }, callback) => {
      if (!franchiseId || !isAdminOrStaff) return;
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
      if (!franchiseId || !isAdminOrStaff) return;
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
