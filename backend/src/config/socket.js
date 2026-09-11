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
      next(new Error('Invalid token'));
    }
  });

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

    socket.on('disconnect', () => {
      // Cleanup if needed
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
