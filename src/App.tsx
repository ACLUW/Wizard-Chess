import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { playAttackSound } from "./audio";
import "./App.css";
import Board from "./components/Board";
import type { CapturedPiece, GameMove } from "./components/Board";

const pieceSymbols: Record<CapturedPiece["type"], string> = {
  p: "♟",
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
};

function App() {
  const [gameStatus, setGameStatus] = useState("White to move");
  const [moves, setMoves] = useState<GameMove[]>([]);
  const [captures, setCaptures] = useState<CapturedPiece[]>([]);
  const [resetSignal, setResetSignal] = useState(0);

  function handleMove(move: GameMove) {
    playAttackSound(move.effectKind);
    setMoves((currentMoves) => [...currentMoves, move]);

    if (move.captured) {
      setCaptures((currentCaptures) => [...currentCaptures, move.captured!]);
    }
  }

  function resetGame() {
    setGameStatus("White to move");
    setMoves([]);
    setCaptures([]);
    setResetSignal((signal) => signal + 1);
  }

  return (
    <main className="game-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">ACL Arena</p>
          <h1>Wizard Chess</h1>
          <p>{gameStatus}</p>
        </div>

        <button className="reset-button" type="button" onClick={resetGame}>
          New Game
        </button>
      </section>

      <section className="game-stage">
        <Canvas camera={{ position: [0, 6.8, 7.5], fov: 34 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 6, 4]} intensity={1.4} />
          <pointLight position={[-4, 3, -4]} intensity={1.2} color="#41e8ff" />
          <Board
            onStatusChange={setGameStatus}
            onMove={handleMove}
            resetSignal={resetSignal}
          />
          <OrbitControls enablePan={false} />
        </Canvas>
      </section>

      <section className="game-dashboard">
        <article className="dashboard-card">
          <h2>Captured</h2>
          <div className="captured-list">
            {captures.length === 0 ? (
              <span>No captures yet</span>
            ) : (
              captures.map((piece, index) => (
                <span
                  className={piece.color === "w" ? "white-piece" : "black-piece"}
                  key={`${piece.color}-${piece.type}-${index}`}
                >
                  {pieceSymbols[piece.type]}
                </span>
              ))
            )}
          </div>
        </article>

        <article className="dashboard-card">
          <h2>Move Log</h2>
          <ol className="move-log">
            {moves.length === 0 ? (
              <li>Tap a piece to begin</li>
            ) : (
              moves.slice(-8).map((move, index) => (
                <li key={`${move.notation}-${index}`}>{move.notation}</li>
              ))
            )}
          </ol>
        </article>

        <article className="dashboard-card control-hint">
          Tap or click one of your pieces, then tap a highlighted square. Pawn captures
          spark; bigger captures explode.
        </article>
      </section>
    </main>
  );
}

export default App;
