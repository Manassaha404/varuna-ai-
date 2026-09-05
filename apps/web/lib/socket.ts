"use client";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ["websocket", "polling"],
});

const roomRefCounts = new Map<string, number>();

export function joinRoom(event: string, room: string) {
  const count = roomRefCounts.get(room) ?? 0;
  roomRefCounts.set(room, count + 1);
  if (count === 0) {
    socket.emit(event, room);
  }
}

export function leaveRoom(event: string, room: string) {
  const count = roomRefCounts.get(room) ?? 0;
  if (count <= 1) {
    roomRefCounts.delete(room);
    socket.emit(event, room);
  } else {
    roomRefCounts.set(room, count - 1);
  }
}

export default socket;