const jwt          = require('jsonwebtoken');
const { User, RoomMessage, Message, MatchingQueue, StudySession } = require('../models');

// Compatibility scoring algorithm
const compatibilityScore = (userA, userB) => {
  let score = 0;
  // Subject match (40%)
  const subjectOverlap = userA.subjects.filter(s => userB.subjects.includes(s)).length;
  score += (subjectOverlap / Math.max(userA.subjects.length || 1, 1)) * 40;
  // Education level match (20%)
  if (userA.educationLevel === userB.educationLevel) score += 20;
  // Language match (20%)
  const langOverlap = userA.languages.filter(l => userB.languages.includes(l)).length;
  score += (langOverlap / Math.max(userA.languages.length || 1, 1)) * 20;
  // Activity (random for demo, 20%)
  score += Math.random() * 20;
  return score;
};

module.exports = (io) => {
  // Auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-passwordHash');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // Track online users and matching queue in memory
  const onlineUsers  = new Map();  // socketId → user
  const matchQueue   = new Map();  // userId → { socket, user, joinedAt }

  io.on('connection', (socket) => {
    const user = socket.user;
    onlineUsers.set(socket.id, user);

    // Update user status online
    User.findByIdAndUpdate(user._id, { status: 'online' }).exec();
    io.emit('user:online', { userId: user._id });
    console.log(`[Socket] ${user.name} connected (${socket.id})`);

    // ── RANDOM MATCHING ───────────────────────────────────────────────────────
    socket.on('queue:join', async (data) => {
      const queueEntry = { socket, user, subjects: data?.subjects || user.subjects, languages: data?.languages || user.languages, educationLevel: user.educationLevel, joinedAt: Date.now() };
      matchQueue.set(user._id.toString(), queueEntry);
      socket.emit('queue:joined', { message: 'You are in the matching queue' });

      // Try to find a match
      for (const [candidateId, candidate] of matchQueue.entries()) {
        if (candidateId === user._id.toString()) continue;
        const score = compatibilityScore(queueEntry, candidate);
        if (score > 20) {
          // Create session
          const session = await StudySession.create({ user1Id: user._id, user2Id: candidate.user._id });
          matchQueue.delete(user._id.toString());
          matchQueue.delete(candidateId);

          const sessionData = { sessionId: session._id, partner: candidate.user, session };
          socket.emit('match:found', { ...sessionData, partner: candidate.user });
          candidate.socket.emit('match:found', { sessionId: session._id, partner: user, session });

          // Put both in a private room
          const roomName = `session:${session._id}`;
          socket.join(roomName);
          candidate.socket.join(roomName);
          break;
        }
      }
    });

    socket.on('queue:leave', () => {
      matchQueue.delete(user._id.toString());
      socket.emit('queue:left');
    });

    // ── SESSION CHAT ──────────────────────────────────────────────────────────
    socket.on('session:message', ({ sessionId, text }) => {
      const roomName = `session:${sessionId}`;
      const msg = { senderId: user._id, senderName: user.name, text, time: new Date() };
      io.to(roomName).emit('session:message', msg);
    });

    socket.on('session:end', async ({ sessionId, duration }) => {
      const roomName = `session:${sessionId}`;
      io.to(roomName).emit('session:ended', { sessionId });
      socket.leave(roomName);
      if (sessionId) {
        await StudySession.findByIdAndUpdate(sessionId, { status: 'ended', endTime: new Date(), duration: duration || 0 });
      }
    });

    // ── WEBRTC SIGNALING ──────────────────────────────────────────────────────
    socket.on('webrtc:offer', ({ sessionId, offer }) => {
      socket.to(`session:${sessionId}`).emit('webrtc:offer', { offer, from: socket.id });
    });
    socket.on('webrtc:answer', ({ sessionId, answer }) => {
      socket.to(`session:${sessionId}`).emit('webrtc:answer', { answer, from: socket.id });
    });
    socket.on('webrtc:ice', ({ sessionId, candidate }) => {
      socket.to(`session:${sessionId}`).emit('webrtc:ice', { candidate, from: socket.id });
    });

    // ── STUDY ROOMS ───────────────────────────────────────────────────────────
    socket.on('room:join', async ({ roomId }) => {
      socket.join(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('room:user_joined', { user: { _id: user._id, name: user.name, color: user.color, emoji: user.emoji } });
      socket.emit('room:joined', { roomId });
    });

    socket.on('room:leave', ({ roomId }) => {
      socket.leave(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('room:user_left', { userId: user._id });
    });

    socket.on('room:message', async ({ roomId, content }) => {
      try {
        const message = await RoomMessage.create({ roomId, senderId: user._id, content });
        const populated = await message.populate('senderId', 'name color emoji');
        io.to(`room:${roomId}`).emit('room:message', populated);
      } catch (err) {
        console.error('[Socket] room:message error:', err.message);
      }
    });

    // ── DIRECT MESSAGES ───────────────────────────────────────────────────────
    socket.on('dm:send', async ({ receiverId, content }) => {
      try {
        const message = await Message.create({ senderId: user._id, receiverId, content });
        // Find receiver's socket and emit
        for (const [sid, u] of onlineUsers.entries()) {
          if (u._id.toString() === receiverId) {
            io.to(sid).emit('dm:received', { message, sender: { _id: user._id, name: user.name, color: user.color, emoji: user.emoji } });
            break;
          }
        }
        socket.emit('dm:sent', { message });
      } catch (err) {
        console.error('[Socket] dm:send error:', err.message);
      }
    });

    // ── TYPING ────────────────────────────────────────────────────────────────
    socket.on('typing:start', ({ roomId }) => {
      socket.to(`room:${roomId}`).emit('typing:start', { userId: user._id, name: user.name });
    });
    socket.on('typing:stop', ({ roomId }) => {
      socket.to(`room:${roomId}`).emit('typing:stop', { userId: user._id });
    });

    // ── POMODORO (shared in session) ──────────────────────────────────────────
    socket.on('pomodoro:start', ({ sessionId, duration }) => {
      socket.to(`session:${sessionId}`).emit('pomodoro:start', { duration, startedBy: user.name });
    });
    socket.on('pomodoro:pause', ({ sessionId }) => {
      socket.to(`session:${sessionId}`).emit('pomodoro:pause', { pausedBy: user.name });
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      matchQueue.delete(user._id.toString());
      User.findByIdAndUpdate(user._id, { status: 'offline' }).exec();
      io.emit('user:offline', { userId: user._id });
      console.log(`[Socket] ${user.name} disconnected`);
    });
  });
};
