import { Server as SocketIOServer, Socket } from "socket.io";
import http from "http";

let io: SocketIOServer | null = null;

export function initSocket(server: http.Server) {
  io = new SocketIOServer(server, {
    pingTimeout: 60000,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}
