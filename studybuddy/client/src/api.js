const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getToken = () => localStorage.getItem("pp_token");

const headers = (extra = {}) => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const request = async (method, path, body) => {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

export const api = {
  // Auth
  signup:  (body) => request("POST", "/auth/signup", body),
  login:   (body) => request("POST", "/auth/login", body),
  getMe:   ()     => request("GET",  "/auth/me"),
  updateProfile: (body) => request("PUT", "/auth/profile", body),

  // Users
  getUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/users${q ? "?" + q : ""}`);
  },
  getUserById: (id) => request("GET", `/users/${id}`),

  // Matching queue
  joinQueue:  (body) => request("POST", "/queue/join", body),
  leaveQueue: ()     => request("POST", "/queue/leave"),

  // Swipe
  discover: ()     => request("GET",  "/discover"),
  swipe:    (body) => request("POST", "/swipe", body),
  getMatches: ()   => request("GET",  "/matches"),

  // Study rooms
  getRooms:     (params = {}) => { const q = new URLSearchParams(params).toString(); return request("GET", `/rooms${q ? "?" + q : ""}`); },
  createRoom:   (body) => request("POST", "/rooms", body),
  joinRoom:     (id)   => request("POST", `/rooms/${id}/join`),
  leaveRoom:    (id)   => request("POST", `/rooms/${id}/leave`),
  getRoomMessages: (id) => request("GET", `/rooms/${id}/messages`),

  // Messages
  getConversation: (userId) => request("GET",  `/messages/${userId}`),
  sendMessage:     (body)   => request("POST", "/messages", body),

  // Games
  saveScore:      (body)   => request("POST", "/scores", body),
  getLeaderboard: (params = {}) => { const q = new URLSearchParams(params).toString(); return request("GET", `/leaderboard${q ? "?" + q : ""}`); },

  // Sessions
  endSession: (body) => request("POST", "/sessions/end", body),

  // Token helpers
  setToken: (t) => localStorage.setItem("pp_token", t),
  clearToken: () => localStorage.removeItem("pp_token"),
  hasToken: () => !!localStorage.getItem("pp_token"),
};
