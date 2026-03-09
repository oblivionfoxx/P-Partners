import { io } from "socket.io-client";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;
  socket = io(BASE, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  socket.on("connect", () => console.log("[Socket] Connected"));
  socket.on("disconnect", () => console.log("[Socket] Disconnected"));
  socket.on("connect_error", (e) => console.error("[Socket] Error:", e.message));
  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const getSocket = () => socket;
