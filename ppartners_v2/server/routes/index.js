const router  = require('express').Router();
const ctrl    = require('../controllers');
const auth    = require('../services/auth.middleware');

// Auth (public)
router.post('/auth/signup',  ctrl.signup);
router.post('/auth/login',   ctrl.login);
router.get('/auth/me',       auth, ctrl.getMe);
router.put('/auth/profile',  auth, ctrl.updateProfile);

// Users
router.get('/users',         auth, ctrl.getUsers);
router.get('/users/:id',     auth, ctrl.getUserById);

// Random match queue
router.post('/queue/join',   auth, ctrl.joinQueue);
router.post('/queue/leave',  auth, ctrl.leaveQueue);

// Swipe / discover
router.get('/discover',      auth, ctrl.getDiscoverProfiles);
router.post('/swipe',        auth, ctrl.swipe);
router.get('/matches',       auth, ctrl.getMatches);

// Study rooms
router.get('/rooms',         auth, ctrl.getRooms);
router.post('/rooms',        auth, ctrl.createRoom);
router.post('/rooms/:id/join',  auth, ctrl.joinRoom);
router.post('/rooms/:id/leave', auth, ctrl.leaveRoom);
router.get('/rooms/:id/messages', auth, ctrl.getRoomMessages);

// Direct messages
router.get('/messages/:userId',  auth, ctrl.getConversation);
router.post('/messages',         auth, ctrl.sendMessage);

// Games
router.post('/scores',           auth, ctrl.saveScore);
router.get('/leaderboard',       auth, ctrl.getLeaderboard);

// Sessions
router.post('/sessions/end',     auth, ctrl.endSession);

module.exports = router;
