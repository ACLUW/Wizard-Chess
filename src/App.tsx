import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { playAttackSound } from "./audio";
import "./App.css";
import Board from "./components/Board";
import CapturedGraveyard from "./components/CapturedGraveyard";
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

const pieceNames: Record<CapturedPiece["type"], string> = {
  p: "Pawn",
  r: "Rook",
  n: "Knight",
  b: "Bishop",
  q: "Queen",
  k: "King",
};

const captureTaunts: Record<CapturedPiece["type"], string[]> = {
  p: [
    "Tiny soldier down. The road just got cleaner.",
    "One pawn less, one plan ruined.",
  ],
  r: [
    "Hahaha, now I have got my edges covered. What else can you do?",
    "Your fortress lost a tower. The walls are listening to me now.",
  ],
  n: [
    "That horse stopped jumping. Try a straight answer next time.",
    "No more sneaky L-shapes. I saw that circus trick coming.",
  ],
  b: [
    "Your diagonal prophet just ran out of sermons.",
    "That bishop blessed the wrong square.",
  ],
  q: [
    "The crown jewel is gone. Your kingdom just got very quiet.",
    "Queen captured. I hope your backup plan has teeth.",
  ],
  k: [
    "The throne is empty. Bow to the blast radius.",
    "King down. The arena accepts your resignation.",
  ],
};

const effectLabels: Record<GameMove["effectKind"], string> = {
  move: "Move",
  sparks: "Spark hit",
  arcane: "Arcane strike",
  shockwave: "Shockwave",
  inferno: "Inferno",
  royal: "Royal blast",
};

const impactStrength: Record<GameMove["effectKind"], number> = {
  move: 0,
  sparks: 0.035,
  arcane: 0.05,
  shockwave: 0.075,
  inferno: 0.095,
  royal: 0.13,
};

type CameraImpact = {
  id: number;
  duration: number;
  strength: number;
};

type CinematicBannerState = {
  id: number;
  tone: "check" | "checkmate" | "draw" | "capture";
  title: string;
  detail: string;
};

type TauntPopupState = {
  id: number;
  pieceType: CapturedPiece["type"];
  title: string;
  quote: string;
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

function CameraImpactShake({ impact }: { impact: CameraImpact }) {
  const { camera } = useThree();
  const remainingRef = useRef(0);
  const strengthRef = useRef(0);
  const offsetRef = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    remainingRef.current = impact.duration;
    strengthRef.current = impact.strength;
  }, [impact]);

  useFrame((_, delta) => {
    const [previousX, previousY, previousZ] = offsetRef.current;
    camera.position.x -= previousX;
    camera.position.y -= previousY;
    camera.position.z -= previousZ;

    if (remainingRef.current <= 0 || strengthRef.current <= 0) {
      offsetRef.current = [0, 0, 0];
      return;
    }

    remainingRef.current = Math.max(0, remainingRef.current - delta);
    const falloff = remainingRef.current / impact.duration;
    const strength = strengthRef.current * falloff * falloff;
    const nextOffset: [number, number, number] = [
      (Math.random() - 0.5) * strength,
      (Math.random() - 0.5) * strength * 0.55,
      (Math.random() - 0.5) * strength,
    ];

    camera.position.x += nextOffset[0];
    camera.position.y += nextOffset[1];
    camera.position.z += nextOffset[2];
    camera.lookAt(0, 0, 0);
    offsetRef.current = nextOffset;
  });

  return null;
}

function App() {
  const [gameStatus, setGameStatus] = useState("White to move");
  const [moves, setMoves] = useState<GameMove[]>([]);
  const [captures, setCaptures] = useState<CapturedPiece[]>([]);
  const [resetSignal, setResetSignal] = useState(0);
  const [undoSignal, setUndoSignal] = useState(0);
  const [stageLighting, setStageLighting] = useState(1);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [cameraImpact, setCameraImpact] = useState<CameraImpact>({
    id: 0,
    duration: 0,
    strength: 0,
  });
  const [cinematicBanner, setCinematicBanner] = useState<CinematicBannerState | null>(null);
  const [tauntPopup, setTauntPopup] = useState<TauntPopupState | null>(null);

  useEffect(() => {
    if (!cinematicBanner) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setCinematicBanner((current) => (current?.id === cinematicBanner.id ? null : current)),
      cinematicBanner.tone === "checkmate" ? 3200 : 1900,
    );

    return () => window.clearTimeout(timeoutId);
  }, [cinematicBanner]);

  useEffect(() => {
    if (!tauntPopup) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setTauntPopup((current) => (current?.id === tauntPopup.id ? null : current)),
      3600,
    );

    return () => window.clearTimeout(timeoutId);
  }, [tauntPopup]);

  function getCaptureTaunt(move: GameMove) {
    if (!move.captured || move.captured.type === "p") {
      return null;
    }

    const taunts = captureTaunts[move.captured.type];
    const tauntIndex = (move.notation.length + (move.capturedSquare?.charCodeAt(0) ?? 0)) % taunts.length;

    return {
      id: Date.now() + 11,
      pieceType: move.captured.type,
      title: `${pieceNames[move.captured.type]} captured${move.capturedSquare ? ` on ${move.capturedSquare}` : ""}`,
      quote: taunts[tauntIndex],
    };
  }

  function handleMove(move: GameMove) {
    playAttackSound(move.effectKind);
    setMoves((currentMoves) => [...currentMoves, move]);

    if (move.captured) {
      setCaptures((currentCaptures) => [...currentCaptures, move.captured!]);

      const taunt = getCaptureTaunt(move);

      if (taunt) {
        setTauntPopup(taunt);
      }
    }

    const outcomeImpact = move.outcome === "checkmate" ? 0.16 : move.outcome === "check" ? 0.06 : 0;
    const strength = Math.max(impactStrength[move.effectKind], outcomeImpact);

    if (strength > 0) {
      setCameraImpact({
        id: Date.now(),
        duration: move.outcome === "checkmate" ? 1.1 : 0.65,
        strength,
      });
    }

    if (move.outcome === "checkmate") {
      setCinematicBanner({
        id: Date.now(),
        tone: "checkmate",
        title: "Checkmate",
        detail: `${move.notation} ends the battle`,
      });
    } else if (move.outcome === "check") {
      setCinematicBanner({
        id: Date.now(),
        tone: "check",
        title: "Check",
        detail: `${move.notation} threatens the king`,
      });
    } else if (move.outcome === "draw") {
      setCinematicBanner({
        id: Date.now(),
        tone: "draw",
        title: "Draw",
        detail: "The duel ends in balance",
      });
    } else if (move.effectKind !== "move") {
      setCinematicBanner({
        id: Date.now(),
        tone: "capture",
        title: effectLabels[move.effectKind],
        detail: `${move.notation} lands successfully`,
      });
    }
  }

  function resetGame() {
    setGameStatus("White to move");
    setMoves([]);
    setCaptures([]);
    setCinematicBanner(null);
    setTauntPopup(null);
    setCameraImpact({ id: Date.now(), duration: 0, strength: 0 });
    setResetSignal((signal) => signal + 1);
  }

  function undoMove() {
    const lastMove = moves.at(-1);

    if (!lastMove) {
      return;
    }

    setMoves((currentMoves) => currentMoves.slice(0, -1));

    if (lastMove.captured) {
      setCaptures((currentCaptures) => currentCaptures.slice(0, -1));
    }

    setCinematicBanner(null);
    setTauntPopup(null);
    setCameraImpact({ id: Date.now(), duration: 0, strength: 0 });
    setUndoSignal((signal) => signal + 1);
  }

  const lightPercent = Math.round(stageLighting * 100);

  return (
    <main className="game-page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">ACL Arena</p>
          <h1>Wizard Chess</h1>
          <p>{gameStatus}</p>
        </div>

        <div className="hero-controls">
          <div className="lighting-panel" aria-label="Stage lighting controls">
            <label htmlFor="stage-lighting">
              <span>Stage Lighting</span>
              <strong>{lightPercent}%</strong>
            </label>
            <input
              id="stage-lighting"
              max="1.45"
              min="0.55"
              onChange={(event) => setStageLighting(Number(event.target.value))}
              step="0.05"
              type="range"
              value={stageLighting}
            />
          </div>

          <div className="game-action-buttons">
            <button
              className="undo-button"
              disabled={moves.length === 0}
              type="button"
              onClick={undoMove}
            >
              Undo Move
            </button>
            <button className="reset-button" type="button" onClick={resetGame}>
              New Game
            </button>
          </div>
        </div>
      </section>

      <section className="game-stage">
        {cinematicBanner && (
          <div className={`cinematic-banner cinematic-${cinematicBanner.tone}`}>
            <strong>{cinematicBanner.title}</strong>
            <span>{cinematicBanner.detail}</span>
          </div>
        )}
        {tauntPopup && (
          <div className={`taunt-popup taunt-${tauntPopup.pieceType}`}>
            <span className="taunt-piece">{pieceSymbols[tauntPopup.pieceType]}</span>
            <div>
              <strong>{tauntPopup.title}</strong>
              <p>{tauntPopup.quote}</p>
            </div>
          </div>
        )}
        <Canvas
          camera={{ position: [0, 8.15, 8.8], fov: 39 }}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <ResponsiveCamera />
          <CameraImpactShake impact={cameraImpact} />
          <Environment preset="night" />
          <color args={["#140806"]} attach="background" />
          <fog attach="fog" args={["#160906", 10, 24]} />
          <ambientLight intensity={0.46 * stageLighting} />
          <hemisphereLight args={["#ffc48a", "#2a0d08", 0.75 * stageLighting]} />
          <directionalLight color="#b85b2d" position={[3, 6, 4]} intensity={1.15 * stageLighting} />
          <spotLight
            angle={0.68}
            color="#ffe0b3"
            intensity={4.1 * stageLighting}
            penumbra={0.78}
            position={[0, 8.2, 2.8]}
          />
          <pointLight position={[0, 3.8, 0]} intensity={2.1 * stageLighting} color="#ffc06d" distance={9.5} />
          <pointLight position={[-4, 2.2, -4]} intensity={0.95 * stageLighting} color="#d94a18" />
          <FireArena lighting={stageLighting} />
          <CapturedGraveyard captures={captures} />
          <Board
            onStatusChange={setGameStatus}
            onMove={handleMove}
            resetSignal={resetSignal}
            undoSignal={undoSignal}
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
                <li key={`${move.notation}-${index}`}>
                  <span>{move.notation}</span>
                  {move.effectKind !== "move" && (
                    <em className={`effect-badge effect-${move.effectKind}`}>
                      {effectLabels[move.effectKind]}
                    </em>
                  )}
                </li>
              ))
            )}
          </ol>
        </article>

        <article className="dashboard-card control-hint">
          <h2>Need Help?</h2>
          <p>New to chess or the arena effects?</p>
          <button className="hint-button" type="button" onClick={() => setIsTutorialOpen(true)}>
            Open Beginner Guide
          </button>
        </article>
      </section>

      {isTutorialOpen && (
        <section
          aria-labelledby="tutorial-title"
          aria-modal="true"
          className="tutorial-backdrop"
          role="dialog"
        >
          <div className="tutorial-panel">
            <button
              aria-label="Close tutorial"
              className="tutorial-close"
              type="button"
              onClick={() => setIsTutorialOpen(false)}
            >
              ×
            </button>

            <p className="eyebrow">Beginner Guide</p>
            <h2 id="tutorial-title">Welcome to Wizard Chess</h2>
            <p className="tutorial-intro">
              Play normal chess rules on a dramatic 3D arena. Select a piece,
              follow the highlighted legal moves, and use captures to trigger
              sparks, blasts, and magical attack trails.
            </p>

            <div className="tutorial-grid">
              <article>
                <strong>1. Select</strong>
                <p>Tap or click one of your pieces. Gold means selected.</p>
              </article>
              <article>
                <strong>2. Move</strong>
                <p>Green squares are legal moves. Orange squares are captures.</p>
              </article>
              <article>
                <strong>3. Capture</strong>
                <p>Capture higher-value pieces for stronger effects and camera impact.</p>
              </article>
              <article>
                <strong>4. Check</strong>
                <p>A red aura warns when a king is under attack.</p>
              </article>
              <article>
                <strong>5. Promote</strong>
                <p>When a pawn reaches the far side, choose Queen, Rook, Bishop, or Knight.</p>
              </article>
              <article>
                <strong>6. Win</strong>
                <p>Checkmate the enemy king to end the battle.</p>
              </article>
            </div>

            <h3 className="tutorial-subtitle">How the pieces move</h3>
            <div className="piece-guide-grid">
              <article>
                <span>♙ Pawn</span>
                <p>
                  Moves forward one square, or two from its starting rank. It captures one
                  square diagonally forward and promotes when it reaches the far side.
                </p>
              </article>
              <article>
                <span>♖ Rook</span>
                <p>
                  Moves any number of squares in straight lines: forward, backward, left,
                  or right. Great for open files and castling protection.
                </p>
              </article>
              <article>
                <span>♘ Knight</span>
                <p>
                  Moves in an L-shape: two squares in one direction, then one sideways.
                  It is the only piece that can jump over other pieces.
                </p>
              </article>
              <article>
                <span>♗ Bishop</span>
                <p>
                  Moves any number of squares diagonally. Each bishop stays forever on
                  the same color square it started on.
                </p>
              </article>
              <article>
                <span>♕ Queen</span>
                <p>
                  Moves any number of squares in any straight or diagonal direction. She
                  is your strongest attacker and defender.
                </p>
              </article>
              <article>
                <span>♔ King</span>
                <p>
                  Moves one square in any direction. Protect him at all costs: if he is
                  trapped in check, the game is checkmate.
                </p>
              </article>
            </div>

            <div className="tutorial-tips">
              <span>Drag to orbit</span>
              <span>Scroll or pinch to zoom</span>
              <span>Use New Game to reset</span>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
