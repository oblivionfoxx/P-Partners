const router = require('express').Router();
const ctrl   = require('../controllers');
const auth   = require('../services/auth.middleware');

// Auth
router.post('/auth/signup',  ctrl.signup);
router.post('/auth/login',   ctrl.login);
router.get('/auth/me',       auth, ctrl.getMe);
router.put('/auth/profile',  auth, ctrl.updateProfile);

// Users
router.get('/users',         auth, ctrl.getUsers);
router.get('/users/:id',     auth, ctrl.getUserById);
router.post('/users/:targetId/follow', auth, ctrl.followUser);

// Feed
router.get('/feed',          auth, ctrl.getFeed);
router.post('/feed',         auth, ctrl.createPost);
router.post('/feed/:id/vote',auth, ctrl.votePost);
router.post('/feed/:id/save',auth, ctrl.savePost);
router.delete('/feed/:id',   auth, ctrl.deletePost);
router.post('/feed/:id/poll',auth, ctrl.pollVote);

// Comments
router.get('/feed/:id/comments',              auth, ctrl.getComments);
router.post('/feed/:id/comments',             auth, ctrl.addComment);
router.post('/feed/:id/comments/:commentId/vote', auth, ctrl.voteComment);

// Battles
router.post('/battles',           auth, ctrl.createBattle);
router.get('/battles',            auth, ctrl.getBattles);
router.get('/battles/:id',        auth, ctrl.getBattleById);
router.post('/battles/:id/join',  auth, ctrl.joinBattle);
router.post('/battles/:id/submit',auth, ctrl.submitBattleAnswers);
router.post('/battles/:id/spectate', auth, ctrl.spectate);

// Notifications
router.get('/notifications',      auth, ctrl.getNotifications);
router.post('/notifications/read',auth, ctrl.markNotificationsRead);

// Reports
router.post('/reports',           auth, ctrl.reportContent);
router.get('/reports',            auth, ctrl.getReports);
router.post('/reports/:id/resolve', auth, ctrl.resolveReport);

// Random match queue
router.post('/queue/join',   auth, ctrl.joinQueue);
router.post('/queue/leave',  auth, ctrl.leaveQueue);

// Swipe
router.get('/discover',      auth, ctrl.discover);
router.post('/swipe',        auth, ctrl.swipe);
router.get('/matches',       auth, ctrl.getMatches);

// Study rooms
router.get('/rooms',              auth, ctrl.getRooms);
router.post('/rooms',             auth, ctrl.createRoom);
router.post('/rooms/:id/join',    auth, ctrl.joinRoom);
router.post('/rooms/:id/leave',   auth, ctrl.leaveRoom);
router.get('/rooms/:id/messages', auth, ctrl.getRoomMessages);

// Messages
router.get('/messages/:userId',   auth, ctrl.getConversation);
router.post('/messages',          auth, ctrl.sendMessage);

// Games
router.post('/scores',            auth, ctrl.saveScore);
router.get('/leaderboard',        auth, ctrl.getLeaderboard);

// Sessions
router.post('/sessions/end',      auth, ctrl.endSession);

module.exports = router;
