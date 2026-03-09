const mongoose = require('mongoose');

// ── User ──────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:   { type: String, required: true },
  country:        { type: String, default: '' },
  educationLevel: { type: String, default: '' },
  subjects:       { type: [String], default: [] },
  languages:      { type: [String], default: [] },
  profilePicture: { type: String, default: '' },
  bio:            { type: String, default: '' },
  friends:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  studyHours:     { type: Number, default: 0 },
  studyStreak:    { type: Number, default: 0 },
  lastStudyDate:  { type: Date },
  badges:         { type: [String], default: [] },
  status:         { type: String, enum: ['online','offline','studying','searching'], default: 'offline' },
  color:          { type: String, default: '#6c63ff' },
  emoji:          { type: String, default: '⭐' },
}, { timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ subjects: 1 });

// ── StudySession ──────────────────────────────────────────────────────────────
const StudySessionSchema = new mongoose.Schema({
  user1Id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2Id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject:   { type: String, default: 'General' },
  startTime: { type: Date,   default: Date.now },
  endTime:   { type: Date },
  duration:  { type: Number, default: 0 },   // seconds
  status:    { type: String, enum: ['active','ended'], default: 'active' },
}, { timestamps: true });

// ── MatchingQueue ─────────────────────────────────────────────────────────────
const MatchingQueueSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  subjects:       { type: [String], default: [] },
  educationLevel: { type: String, default: '' },
  languages:      { type: [String], default: [] },
  status:         { type: String, enum: ['searching','matched'], default: 'searching' },
  joinedAt:       { type: Date, default: Date.now },
});

// ── Swipe ─────────────────────────────────────────────────────────────────────
const SwipeSchema = new mongoose.Schema({
  swiperId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  direction:    { type: String, enum: ['left','right'], required: true },
}, { timestamps: true });

SwipeSchema.index({ swiperId: 1, targetUserId: 1 }, { unique: true });

// ── Match ─────────────────────────────────────────────────────────────────────
const MatchSchema = new mongoose.Schema({
  user1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// ── StudyRoom ─────────────────────────────────────────────────────────────────
const StudyRoomSchema = new mongoose.Schema({
  roomName:     { type: String, required: true, trim: true },
  category:     { type: String, required: true },
  creatorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxParticipants: { type: Number, default: 20 },
  icon:         { type: String, default: '📚' },
  color:        { type: String, default: '#6c63ff' },
  isPublic:     { type: Boolean, default: true },
}, { timestamps: true });

// ── RoomMessage ───────────────────────────────────────────────────────────────
const RoomMessageSchema = new mongoose.Schema({
  roomId:   { type: mongoose.Schema.Types.ObjectId, ref: 'StudyRoom', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
  content:  { type: String, required: true },
}, { timestamps: true });

RoomMessageSchema.index({ roomId: 1, createdAt: -1 });

// ── DirectMessage ─────────────────────────────────────────────────────────────
const MessageSchema = new mongoose.Schema({
  senderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:     { type: String, required: true },
  attachments: { type: [String], default: [] },
  read:        { type: Boolean, default: false },
}, { timestamps: true });

MessageSchema.index({ senderId: 1, receiverId: 1 });

// ── GameScore ─────────────────────────────────────────────────────────────────
const GameScoreSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameType: { type: String, required: true },
  score:    { type: Number, required: true },
  level:    { type: Number, default: 1 },
  language: { type: String, default: '' },
}, { timestamps: true });

// ── Badge ─────────────────────────────────────────────────────────────────────
const BadgeSchema = new mongoose.Schema({
  badgeId:     { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  description: { type: String },
  icon:        { type: String },
  requirement: { type: String },
});

module.exports = {
  User:          mongoose.model('User',          UserSchema),
  StudySession:  mongoose.model('StudySession',  StudySessionSchema),
  MatchingQueue: mongoose.model('MatchingQueue', MatchingQueueSchema),
  Swipe:         mongoose.model('Swipe',         SwipeSchema),
  Match:         mongoose.model('Match',         MatchSchema),
  StudyRoom:     mongoose.model('StudyRoom',     StudyRoomSchema),
  RoomMessage:   mongoose.model('RoomMessage',   RoomMessageSchema),
  Message:       mongoose.model('Message',       MessageSchema),
  GameScore:     mongoose.model('GameScore',     GameScoreSchema),
  Badge:         mongoose.model('Badge',         BadgeSchema),
};
