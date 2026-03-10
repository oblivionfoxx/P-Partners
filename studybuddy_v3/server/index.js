require('dotenv').config();
const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const mongoose  = require('mongoose');
const cors      = require('cors');
const routes    = require('./routes');
const initSockets = require('./sockets');

const app    = express();
const server = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logging ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Socket handlers ───────────────────────────────────────────────────────────
initSockets(io);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT       = process.env.PORT || 5000;
const MONGO_URI  = process.env.MONGODB_URI || 'mongodb://localhost:27017/studybuddy';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('[MongoDB] Connected to', MONGO_URI);
    server.listen(PORT, () => {
      console.log(`[Server] StudyBuddy API running on http://localhost:${PORT}`);
      console.log(`[Socket] WebSocket server ready`);
    });
  })
  .catch(err => {
    console.error('[MongoDB] Connection failed:', err.message);
    process.exit(1);
  });
