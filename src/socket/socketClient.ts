import { io, Socket } from "socket.io-client";

// The backend serves REST from VITE_API_URL (e.g. http://localhost:5000/api)
// and Socket.IO from the same host/port without the /api suffix.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
    /\/api\/?$/,
    "",
  );

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
