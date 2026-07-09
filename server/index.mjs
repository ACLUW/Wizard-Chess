import { createServer } from "node:http";
import { Chess } from "chess.js";
import { Server } from "socket.io";

const port = Number(process.env.PORT ?? 3001);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "*";
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: clientOrigin,
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

function createRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  do {
    code = Array.from({ length: 6 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
  } while (rooms.has(code));

  return code;
}

function emitRoomState(roomCode) {
  const room = rooms.get(roomCode);

  if (!room) {
    return;
  }

  for (const [color, socketId] of Object.entries(room.players)) {
    io.to(socketId).emit("room:state", {
      color,
      fen: room.chess.fen(),
      opponentConnected: Boolean(room.players[color === "w" ? "b" : "w"]),
      roomCode,
    });
  }
}

function leaveCurrentRoom(socket) {
  const { roomCode } = socket.data;

  if (!roomCode) {
    return;
  }

  const room = rooms.get(roomCode);

  if (room) {
    if (room.players.w === socket.id) {
      delete room.players.w;
    }

    if (room.players.b === socket.id) {
      delete room.players.b;
    }

    if (!room.players.w && !room.players.b) {
      rooms.delete(roomCode);
    } else {
      emitRoomState(roomCode);
    }
  }

  socket.leave(roomCode);
  socket.data.roomCode = undefined;
}

io.on("connection", (socket) => {
  socket.on("room:create", () => {
    leaveCurrentRoom(socket);
    const roomCode = createRoomCode();
    rooms.set(roomCode, {
      chess: new Chess(),
      players: { w: socket.id },
    });
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    emitRoomState(roomCode);
  });

  socket.on("room:join", ({ roomCode }) => {
    const normalizedCode = String(roomCode ?? "").trim().toUpperCase();
    const room = rooms.get(normalizedCode);

    if (!room) {
      socket.emit("room:error", "That battle room does not exist.");
      return;
    }

    if (room.players.b) {
      socket.emit("room:error", "That battle room already has two players.");
      return;
    }

    leaveCurrentRoom(socket);
    room.players.b = socket.id;
    socket.join(normalizedCode);
    socket.data.roomCode = normalizedCode;
    emitRoomState(normalizedCode);
  });

  socket.on("game:move", ({ from, promotion, roomCode, to }) => {
    const room = rooms.get(roomCode);

    if (!room || socket.data.roomCode !== roomCode) {
      socket.emit("room:error", "Your battle room is no longer active.");
      return;
    }

    const playerColor = room.players.w === socket.id ? "w" : room.players.b === socket.id ? "b" : null;

    if (!playerColor || room.chess.turn() !== playerColor) {
      socket.emit("move:rejected", "Wait for your turn.");
      return;
    }

    try {
      const move = room.chess.move({ from, to, promotion });

      if (!move) {
        socket.emit("move:rejected", "That move is not legal.");
        return;
      }

      io.to(roomCode).emit("game:move", {
        from: move.from,
        id: `${Date.now()}-${move.before}`,
        promotion: move.promotion,
        to: move.to,
      });
      emitRoomState(roomCode);
    } catch {
      socket.emit("move:rejected", "That move is not legal.");
    }
  });

  socket.on("room:leave", () => leaveCurrentRoom(socket));
  socket.on("disconnect", () => leaveCurrentRoom(socket));
});

httpServer.listen(port, () => {
  console.log(`Wizard Chess multiplayer server listening on port ${port}`);
});
