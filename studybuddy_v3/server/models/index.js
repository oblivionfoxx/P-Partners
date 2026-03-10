const mongoose = require('mongoose');

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
  following:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  studyHours:     { type: Number, default: 0 },
  studyStreak:    { type: Number, default: 0 },
  lastStudyDate:  { type: Date },
  badges:         { type: [String], default: [] },
  status:         { type: String, enum: ['online','offline','studying','searching','battling'], default: 'offline' },
  color:          { type: String, default: '#6c63ff' },
  emoji:          { type: String, default: '⭐' },
  xp:             { type: Number, default: 0 },
  battleWins:     { type: Number, default: 0 },
  battleLosses:   { type: Number, default: 0 },
  isBanned:       { type: Boolean, default: false },
  isVerified:     { type: Boolean, default: false },
  role:           { type: String, enum: ['user','moderator','admin'], default: 'user' },
  savedPosts:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
}, { timestamps: true });
UserSchema.index({ email: 1 });

const PostSchema = new mongoose.Schema({
  authorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:         { type: String, enum: ['text','image','battle_result','streak','badge','room_activity','poll'], required: true },
  content:      { type: String, default: '' },
  images:       { type: [String], default: [] },
  subject:      { type: String, default: '' },
  tags:         { type: [String], default: [] },
  upvotes:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  saves:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentCount: { type: Number, default: 0 },
  shareCount:   { type: Number, default: 0 },
  isRemoved:    { type: Boolean, default: false },
  removedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  removeReason: { type: String, default: '' },
  reports:      [{ userId: mongoose.Schema.Types.ObjectId, reason: String, createdAt: { type: Date, default: Date.now } }],
  isPinned:     { type: Boolean, default: false },
  battleId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },
  poll: {
    question: String,
    options:  [{ text: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
    endsAt:   Date,
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ subject: 1, createdAt: -1 });

const CommentSchema = new mongoose.Schema({
  postId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  authorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true },
  parentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  upvotes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isRemoved: { type: Boolean, default: false },
  reports:   [{ userId: mongoose.Schema.Types.ObjectId, reason: String }],
}, { timestamps: true });
CommentSchema.index({ postId: 1, createdAt: 1 });

const BattleSchema = new mongoose.Schema({
  challengerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opponentId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject:           { type: String, required: true },
  difficulty:        { type: String, enum: ['easy','medium','hard'], default: 'medium' },
  duration:          { type: Number, default: 180 },
  questions:         [{ question: String, options: [String], correctIndex: Number, explanation: String }],
  challengerAnswers: [{ questionIndex: Number, answerIndex: Number, timeMs: Number }],
  opponentAnswers:   [{ questionIndex: Number, answerIndex: Number, timeMs: Number }],
  challengerScore:   { type: Number, default: 0 },
  opponentScore:     { type: Number, default: 0 },
  winnerId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:            { type: String, enum: ['waiting','active','completed','cancelled'], default: 'waiting' },
  spectators:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  xpAwarded:         { type: Number, default: 0 },
  startedAt:         { type: Date },
  endedAt:           { type: Date },
  isPublic:          { type: Boolean, default: true },
}, { timestamps: true });
BattleSchema.index({ status: 1 });

const NotificationSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, required: true },
  fromId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  battleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },
  message:  { type: String, required: true },
  read:     { type: Boolean, default: false },
}, { timestamps: true });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const StudySessionSchema = new mongoose.Schema({
  user1Id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2Id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject:   { type: String, default: 'General' },
  startTime: { type: Date, default: Date.now },
  endTime:   { type: Date },
  duration:  { type: Number, default: 0 },
  status:    { type: String, enum: ['active','ended'], default: 'active' },
}, { timestamps: true });

const MatchingQueueSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  subjects:       { type: [String], default: [] },
  educationLevel: { type: String, default: '' },
  languages:      { type: [String], default: [] },
  status:         { type: String, enum: ['searching','matched'], default: 'searching' },
  joinedAt:       { type: Date, default: Date.now },
});

const SwipeSchema = new mongoose.Schema({
  swiperId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  direction:    { type: String, enum: ['left','right'], required: true },
}, { timestamps: true });
SwipeSchema.index({ swiperId: 1, targetUserId: 1 }, { unique: true });

const MatchSchema = new mongoose.Schema({
  user1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const StudyRoomSchema = new mongoose.Schema({
  roomName:        { type: String, required: true, trim: true },
  category:        { type: String, required: true },
  creatorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxParticipants: { type: Number, default: 20 },
  icon:            { type: String, default: '📚' },
  color:           { type: String, default: '#6c63ff' },
  isPublic:        { type: Boolean, default: true },
}, { timestamps: true });

const RoomMessageSchema = new mongoose.Schema({
  roomId:   { type: mongoose.Schema.Types.ObjectId, ref: 'StudyRoom', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:  { type: String, required: true },
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:    { type: String, required: true },
  read:       { type: Boolean, default: false },
}, { timestamps: true });

const GameScoreSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameType: { type: String, required: true },
  score:    { type: Number, required: true },
  level:    { type: Number, default: 1 },
  language: { type: String, default: '' },
}, { timestamps: true });

const ReportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['post','comment','user'], required: true },
  targetId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  reason:     { type: String, required: true },
  status:     { type: String, enum: ['pending','resolved','dismissed'], default: 'pending' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = {
  User:          mongoose.model('User',          UserSchema),
  Post:          mongoose.model('Post',          PostSchema),
  Comment:       mongoose.model('Comment',       CommentSchema),
  Battle:        mongoose.model('Battle',        BattleSchema),
  Notification:  mongoose.model('Notification',  NotificationSchema),
  StudySession:  mongoose.model('StudySession',  StudySessionSchema),
  MatchingQueue: mongoose.model('MatchingQueue', MatchingQueueSchema),
  Swipe:         mongoose.model('Swipe',         SwipeSchema),
  Match:         mongoose.model('Match',         MatchSchema),
  StudyRoom:     mongoose.model('StudyRoom',     StudyRoomSchema),
  RoomMessage:   mongoose.model('RoomMessage',   RoomMessageSchema),
  Message:       mongoose.model('Message',       MessageSchema),
  GameScore:     mongoose.model('GameScore',     GameScoreSchema),
  Report:        mongoose.model('Report',        ReportSchema),
};
