import { spawn } from "node:child_process";
import { io } from "socket.io-client";

const server = spawn(process.execPath, ["server/index.mjs"], {
  env: { ...process.env, PORT: "3011" },
  stdio: ["ignore", "pipe", "inherit"],
});

const timeout = setTimeout(() => finish(new Error("Multiplayer smoke test timed out.")), 8000);
let white;
let black;
let finished = false;

server.stdout.once("data", () => {
  white = io("http://localhost:3011");
  black = io("http://localhost:3011");

  white.once("connect", () => white.emit("room:create"));
  white.once("room:state", (whiteRoom) => {
    const joinRoom = () => black.emit("room:join", { roomCode: whiteRoom.roomCode });

    if (black.connected) {
      joinRoom();
    } else {
      black.once("connect", joinRoom);
    }

    black.once("room:state", (blackRoom) => {
      if (blackRoom.color !== "b") {
        finish(new Error("Joining player was not assigned Black."));
        return;
      }

      let confirmedMoves = 0;
      const confirmMove = (move) => {
        if (move.from !== "e2" || move.to !== "e4") {
          finish(new Error("Server broadcast the wrong move."));
          return;
        }

        confirmedMoves += 1;

        if (confirmedMoves === 2) {
          finish();
        }
      };

      white.once("game:move", confirmMove);
      black.once("game:move", confirmMove);
      white.emit("game:move", {
        from: "e2",
        roomCode: whiteRoom.roomCode,
        to: "e4",
      });
    });
  });
});

function finish(error) {
  if (finished) {
    return;
  }

  finished = true;
  clearTimeout(timeout);
  white?.disconnect();
  black?.disconnect();
  server.kill();

  if (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  console.log("Multiplayer room and move synchronization passed.");
}
