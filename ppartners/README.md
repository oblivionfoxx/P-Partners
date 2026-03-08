# 🎓 P Partners

**Global Collaborative Learning Platform**

Connect with students worldwide to study together, practice languages, and participate in collaborative learning.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **npm** or **yarn**

---

## 📁 Project Structure

```
ppartners/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx          # Main application (all components)
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── server/                  # Node.js + Express backend
    ├── index.js             # Server entry point
    ├── models/index.js      # All Mongoose schemas
    ├── controllers/index.js # All route handlers
    ├── routes/index.js      # API route definitions
    ├── sockets/index.js     # Socket.io event handlers
    ├── services/
    │   └── auth.middleware.js
    └── .env.example
```

---

## ⚙️ Setup Instructions

### 1. Clone & Install

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Configure Environment

```bash
# In /server, copy the example env file
cp .env.example .env
```

Edit `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ppartners
JWT_SECRET=change_this_to_a_long_random_secret
CLIENT_URL=http://localhost:3000
```

> For **MongoDB Atlas**, replace the URI with your connection string:
> `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ppartners`

### 3. Start the Backend

```bash
cd server
npm run dev      # Uses nodemon for hot reload
# or
npm start        # Production
```

Server starts at: `http://localhost:5000`

### 4. Start the Frontend

```bash
cd client
npm run dev
```

App opens at: `http://localhost:3000`

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login with email/password |
| GET  | `/api/auth/me` | Get current user (auth) |
| PUT  | `/api/auth/profile` | Update profile (auth) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (filterable) |
| GET | `/api/users/:id` | Get user by ID |

### Matching
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/queue/join` | Join random match queue |
| POST | `/api/queue/leave` | Leave queue |
| GET  | `/api/discover` | Get profiles to swipe |
| POST | `/api/swipe` | Record a swipe |
| GET  | `/api/matches` | Get all matches |

### Study Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/rooms` | List all rooms |
| POST | `/api/rooms` | Create a room |
| POST | `/api/rooms/:id/join` | Join a room |
| POST | `/api/rooms/:id/leave` | Leave a room |
| GET  | `/api/rooms/:id/messages` | Get room chat history |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/messages/:userId` | Get conversation |
| POST | `/api/messages` | Send a message |

### Games & Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scores` | Save game score |
| GET  | `/api/leaderboard` | Get leaderboard |
| POST | `/api/sessions/end` | End study session |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `queue:join` | `{ subjects, languages }` | Join random match queue |
| `queue:leave` | — | Leave queue |
| `session:message` | `{ sessionId, text }` | Send chat in session |
| `session:end` | `{ sessionId, duration }` | End session |
| `room:join` | `{ roomId }` | Join study room |
| `room:leave` | `{ roomId }` | Leave study room |
| `room:message` | `{ roomId, content }` | Send room chat message |
| `dm:send` | `{ receiverId, content }` | Send direct message |
| `webrtc:offer` | `{ sessionId, offer }` | WebRTC offer |
| `webrtc:answer` | `{ sessionId, answer }` | WebRTC answer |
| `webrtc:ice` | `{ sessionId, candidate }` | ICE candidate |
| `pomodoro:start` | `{ sessionId, duration }` | Start shared Pomodoro |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `match:found` | `{ sessionId, partner }` | Match was made |
| `session:message` | `{ senderId, text, time }` | New session chat |
| `session:ended` | `{ sessionId }` | Session ended |
| `room:message` | message object | New room message |
| `room:user_joined` | `{ user }` | User joined room |
| `dm:received` | `{ message, sender }` | Received a DM |
| `user:online` | `{ userId }` | User came online |
| `user:offline` | `{ userId }` | User went offline |

---

## 🎮 Features

| Feature | Description |
|---------|-------------|
| 🔐 **Auth** | JWT-based auth, bcrypt passwords, multi-step signup |
| ⚡ **Random Match** | Real-time compatibility-scored partner matching |
| 💫 **Swipe Discover** | Tinder-style profile discovery with mutual matching |
| 🏛 **Study Rooms** | Category-based group rooms with live chat |
| 💬 **Messaging** | Real-time direct messaging between matched users |
| 🎮 **Language Games** | 6 games: Vocab Quiz, Flashcards, Memory, Word Match, Speed Round, Spelling |
| 📹 **WebRTC Video** | Peer-to-peer video calls via WebRTC signaling |
| ⏱ **Pomodoro Timer** | Shared study timer in sessions |
| 🏆 **Gamification** | Badges, streaks, study hours tracking |

---

## 🚀 Deploy to Production

### Frontend (Vercel / Netlify)
```bash
cd client
npm run build
# Upload /dist to Vercel or Netlify
```

### Backend (Railway / Render / Fly.io)
1. Push `server/` to a GitHub repo
2. Connect to Railway or Render
3. Set environment variables
4. Deploy!

### MongoDB
Use **MongoDB Atlas** free tier for cloud database.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, CSS Variables |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Real-time | Socket.io |
| Video | WebRTC (signaling via Socket.io) |
| Auth | JWT, bcryptjs |

---

*Built with ❤️ — P Partners*
