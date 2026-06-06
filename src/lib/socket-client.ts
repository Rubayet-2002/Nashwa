import io from "socket.io-client";
import type { Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000", {
      path: "/api/socketio",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
