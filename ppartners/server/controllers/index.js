const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { User, StudySession, MatchingQueue, Swipe, Match, StudyRoom, RoomMessage, Message, GameScore } = require('../models');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── AUTH ──────────────────────────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password, country, educationLevel, subjects, languages, bio } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, country, educationLevel, subjects, languages, bio });

    const token = generateToken(user._id);
    res.status(201).json({ token, user: { ...user.toObject(), passwordHash: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await User.findByIdAndUpdate(user._id, { status: 'online' });
    const token = generateToken(user._id);
    res.json({ token, user: { ...user.toObject(), passwordHash: undefined } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, country, educationLevel, subjects, languages } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id,
      { name, bio, country, educationLevel, subjects, languages },
      { new: true, select: '-passwordHash' }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── USERS ─────────────────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { subjects, language, educationLevel } = req.query;
    const filter = { _id: { $ne: req.user._id } };
    if (subjects)       filter.subjects       = { $in: subjects.split(',') };
    if (language)       filter.languages      = { $in: [language] };
    if (educationLevel) filter.educationLevel = educationLevel;

    const users = await User.find(filter).select('-passwordHash').limit(50);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── RANDOM MATCH ──────────────────────────────────────────────────────────────
exports.joinQueue = async (req, res) => {
  try {
    const { subjects, languages } = req.body;
    await MatchingQueue.findOneAndUpdate(
      { userId: req.user._id },
      { userId: req.user._id, subjects: subjects || req.user.subjects, educationLevel: req.user.educationLevel, languages: languages || req.user.languages, status: 'searching', joinedAt: new Date() },
      { upsert: true, new: true }
    );
    await User.findByIdAndUpdate(req.user._id, { status: 'searching' });
    res.json({ message: 'Joined matching queue' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.leaveQueue = async (req, res) => {
  try {
    await MatchingQueue.deleteOne({ userId: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { status: 'online' });
    res.json({ message: 'Left matching queue' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── SWIPE ─────────────────────────────────────────────────────────────────────
exports.swipe = async (req, res) => {
  try {
    const { targetUserId, direction } = req.body;
    if (!targetUserId || !direction)
      return res.status(400).json({ error: 'targetUserId and direction required' });

    await Swipe.findOneAndUpdate(
      { swiperId: req.user._id, targetUserId },
      { swiperId: req.user._id, targetUserId, direction },
      { upsert: true, new: true }
    );

    let matched = false;
    if (direction === 'right') {
      const reverse = await Swipe.findOne({ swiperId: targetUserId, targetUserId: req.user._id, direction: 'right' });
      if (reverse) {
        const exists = await Match.findOne({
          $or: [{ user1Id: req.user._id, user2Id: targetUserId }, { user1Id: targetUserId, user2Id: req.user._id }]
        });
        if (!exists) {
          await Match.create({ user1Id: req.user._id, user2Id: targetUserId });
          matched = true;
        }
      }
    }
    res.json({ matched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ user1Id: req.user._id }, { user2Id: req.user._id }]
    }).populate('user1Id user2Id', '-passwordHash');
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDiscoverProfiles = async (req, res) => {
  try {
    const alreadySwiped = await Swipe.find({ swiperId: req.user._id }).select('targetUserId');
    const swipedIds = alreadySwiped.map(s => s.targetUserId);
    const users = await User.find({ _id: { $ne: req.user._id, $nin: swipedIds } }).select('-passwordHash').limit(20);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── STUDY ROOMS ───────────────────────────────────────────────────────────────
exports.getRooms = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const rooms = await StudyRoom.find(filter).populate('participants', 'name');
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { roomName, category, icon, color, maxParticipants } = req.body;
    if (!roomName || !category) return res.status(400).json({ error: 'roomName and category required' });
    const room = await StudyRoom.create({ roomName, category, icon, color, maxParticipants, creatorId: req.user._id, participants: [req.user._id] });
    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const room = await StudyRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.participants.length >= room.maxParticipants) return res.status(400).json({ error: 'Room is full' });
    if (!room.participants.includes(req.user._id)) {
      room.participants.push(req.user._id);
      await room.save();
    }
    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.leaveRoom = async (req, res) => {
  try {
    await StudyRoom.findByIdAndUpdate(req.params.id, { $pull: { participants: req.user._id } });
    res.json({ message: 'Left room' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRoomMessages = async (req, res) => {
  try {
    const messages = await RoomMessage.find({ roomId: req.params.id })
      .populate('senderId', 'name color emoji')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── MESSAGES ──────────────────────────────────────────────────────────────────
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id },
      ]
    }).sort({ createdAt: 1 }).limit(100);
    await Message.updateMany({ senderId: userId, receiverId: req.user._id, read: false }, { read: true });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ error: 'receiverId and content required' });
    const message = await Message.create({ senderId: req.user._id, receiverId, content });
    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GAME SCORES ───────────────────────────────────────────────────────────────
exports.saveScore = async (req, res) => {
  try {
    const { gameType, score, level, language } = req.body;
    const entry = await GameScore.create({ userId: req.user._id, gameType, score, level, language });

    // Check badge conditions
    if (score >= 100 && !req.user.badges.includes('game_master')) {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { badges: 'game_master' } });
    }
    res.status(201).json({ entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { gameType } = req.query;
    const filter = gameType ? { gameType } : {};
    const scores = await GameScore.find(filter)
      .populate('userId', 'name color emoji')
      .sort({ score: -1 })
      .limit(20);
    res.json({ scores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── SESSIONS ──────────────────────────────────────────────────────────────────
exports.endSession = async (req, res) => {
  try {
    const { sessionId, duration } = req.body;
    if (sessionId) {
      await StudySession.findByIdAndUpdate(sessionId, { status: 'ended', endTime: new Date(), duration });
    }

    const durationHours = (duration || 0) / 3600;
    const user = await User.findById(req.user._id);

    // Update study hours
    const newHours = user.studyHours + durationHours;
    // Update streak
    const today = new Date().toDateString();
    const lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let newStreak = user.studyStreak;
    if (lastStudy === yesterday) newStreak += 1;
    else if (lastStudy !== today) newStreak = 1;

    // Check badges
    const badges = [...user.badges];
    if (!badges.includes('first_session'))             badges.push('first_session');
    if (newStreak >= 7   && !badges.includes('streak_7'))   badges.push('streak_7');
    if (newStreak >= 30  && !badges.includes('streak_30'))  badges.push('streak_30');
    if (newHours  >= 10  && !badges.includes('hours_10'))   badges.push('hours_10');
    if (newHours  >= 100 && !badges.includes('hours_100'))  badges.push('hours_100');

    await User.findByIdAndUpdate(req.user._id, { studyHours: newHours, studyStreak: newStreak, lastStudyDate: new Date(), badges });
    res.json({ message: 'Session ended', studyHours: newHours, studyStreak: newStreak, badges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
