import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Square } from "chess.js";

export type OnlineMove = {
  id: string;
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
};

type RoomState = {
  color: "w" | "b";
  fen: string;
  opponentConnected: boolean;
  roomCode: string;
};

const serverUrl = import.meta.env.VITE_MULTIPLAYER_URL ?? "http://localhost:3001";

export function useMultiplayer() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [incomingMove, setIncomingMove] = useState<OnlineMove | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = io(serverUrl, { autoConnect: true });
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("room:state", (nextRoom: RoomState) => {
      setRoom(nextRoom);
      setError("");
    });
    socket.on("room:error", (message: string) => setError(message));
    socket.on("move:rejected", (message: string) => setError(message));
    socket.on("game:move", (move: OnlineMove) => {
      setIncomingMove(move);
      setError("");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    createRoom() {
      setError("");
      socketRef.current?.emit("room:create");
    },
    error,
    incomingMove,
    isConnected,
    joinRoom(roomCode: string) {
      setError("");
      socketRef.current?.emit("room:join", { roomCode });
    },
    leaveRoom() {
      socketRef.current?.emit("room:leave");
      setRoom(null);
      setIncomingMove(null);
      setError("");
    },
    room,
    sendMove(move: Omit<OnlineMove, "id">) {
      if (!room) {
        return;
      }

      socketRef.current?.emit("game:move", {
        ...move,
        roomCode: room.roomCode,
      });
    },
  };
}
