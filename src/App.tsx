import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { playAttackSound } from "./audio";
import "./App.css";
import Board from "./components/Board";
import FireArena from "./components/FireArena";
import type { CapturedPiece, GameMove } from "./components/Board";

const pieceSymbols: Record<CapturedPiece["type"], string> = {
  p: "\u265F",
  r: "\u265C",
  n: "\u265E",
  b: "\u265D",
  q: "\u265B",
  k: "\u265A",
};

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const isPhone = size.width < 700;
    const isShortScreen = size.height < 560;
    const isLandscape = size.width > size.height;
    const y = isPhone ? 9.8 : 8.15;
    const z = isPhone ? 10.8 : 8.8;

    camera.position.set(0, isShortScreen || isLandscape ? y + 0.6 : y, z);
    camera.lookAt(0, 0, 0);

    if ("fov" in camera) {
      camera.fov = isPhone ? 48 : 39;
      camera.updateProjectionMatrix();
    }
  }, [camera, size.height, size.width]);

  return null;
}

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
        <Canvas
          camera={{ position: [0, 8.15, 8.8], fov: 39 }}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <ResponsiveCamera />
          <Environment preset="night" />
          <color args={["#060303"]} attach="background" />
          <fog attach="fog" args={["#090303", 8, 18]} />
          <ambientLight intensity={0.28} />
          <directionalLight color="#8a3a20" position={[3, 6, 4]} intensity={0.85} />
          <spotLight
            angle={0.56}
            color="#ffd39a"
            intensity={2.8}
            penumbra={0.72}
            position={[0, 7.2, 2.3]}
          />
          <pointLight position={[0, 3.2, 0]} intensity={1.1} color="#ffb15a" distance={8} />
          <pointLight position={[-4, 2.2, -4]} intensity={0.65} color="#c33212" />
          <FireArena />
          <Board
            onStatusChange={setGameStatus}
            onMove={handleMove}
            resetSignal={resetSignal}
          />
          <OrbitControls
            dampingFactor={0.08}
            enableDamping
            enablePan={false}
            maxDistance={15}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={7.4}
            minPolarAngle={Math.PI / 5}
            rotateSpeed={0.7}
            target={[0, 0, 0]}
            zoomSpeed={0.65}
          />
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
          Tap/click a piece, then choose a highlighted square. Drag to orbit the
          board; pinch or scroll to zoom.
        </article>
      </section>
    </main>
  );
}

export default App;
