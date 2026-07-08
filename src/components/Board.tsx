import { useEffect, useMemo, useState } from "react";
import { Html, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Chess } from "chess.js";
import type { PieceSymbol, Square } from "chess.js";
import AttackTrail from "./AttackTrail";
import CaptureEffect from "./CaptureEffect";
import Piece from "./Piece";
import { createStoneTexture, stoneTexturePresets } from "../materials/stoneTextures";

export type CapturedPiece = {
  type: PieceSymbol;
  color: "w" | "b";
};

export type AttackEffectKind = "move" | "sparks" | "arcane" | "shockwave" | "inferno" | "royal";

export type GameMove = {
  notation: string;
  effectKind: AttackEffectKind;
  outcome?: "check" | "checkmate" | "draw";
  captured?: CapturedPiece;
};

type BoardProps = {
  onStatusChange: (status: string) => void;
  onMove: (move: GameMove) => void;
  resetSignal: number;
};

type CaptureAnimation = {
  id: number;
  kind: Exclude<AttackEffectKind, "move">;
  position: [number, number, number];
};

type AttackTrailAnimation = {
  id: number;
  from: [number, number, number];
  to: [number, number, number];
  kind: Exclude<AttackEffectKind, "move">;
};

type PromotionPiece = "q" | "r" | "b" | "n";

type PendingPromotion = {
  from: Square;
  to: Square;
  row: number;
  col: number;
};

type MovingPiece = {
  to: Square;
  fromPosition: [number, number, number];
  motionKind: "move" | "attack";
};

type LastMove = {
  from: Square;
  to: Square;
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const pieceCaptureEffects: Record<PieceSymbol, Exclude<AttackEffectKind, "move">> = {
  p: "sparks",
  n: "arcane",
  b: "arcane",
  r: "shockwave",
  q: "inferno",
  k: "royal",
};

const promotionOptions: Array<{ type: PromotionPiece; label: string; symbol: string }> = [
  { type: "q", label: "Queen", symbol: "♛" },
  { type: "r", label: "Rook", symbol: "♜" },
  { type: "b", label: "Bishop", symbol: "♝" },
  { type: "n", label: "Knight", symbol: "♞" },
];

function toSquare(row: number, col: number) {
  return `${files[col]}${8 - row}` as Square;
}

function toPosition(row: number, col: number): [number, number, number] {
  return [col - 3.5, 0.15, row - 3.5];
}

function squareToPosition(square: Square): [number, number, number] {
  const col = files.indexOf(square[0]);
  const row = 8 - Number(square[1]);

  return toPosition(row, col);
}

function getStatus(chess: Chess) {
  if (chess.isCheckmate()) {
    return `Checkmate - ${chess.turn() === "w" ? "Black" : "White"} wins`;
  }

  if (chess.isDraw()) {
    return "Draw";
  }

  return `${chess.turn() === "w" ? "White" : "Black"} to move${
    chess.isCheck() ? " - check!" : ""
  }`;
}

function Board({ onStatusChange, onMove, resetSignal }: BoardProps) {
  const [chess] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [, setPosition] = useState(chess.fen());
  const [captureAnimations, setCaptureAnimations] = useState<CaptureAnimation[]>([]);
  const [attackTrails, setAttackTrails] = useState<AttackTrailAnimation[]>([]);
  const [movingPiece, setMovingPiece] = useState<MovingPiece | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);
  const ivoryTileTexture = useMemo(
    () => createStoneTexture("ivoryTile", stoneTexturePresets.ivoryTile),
    [],
  );
  const blackTileTexture = useMemo(
    () => createStoneTexture("blackTile", stoneTexturePresets.blackTile),
    [],
  );

  useEffect(() => {
    chess.reset();
    setSelectedSquare(null);
    setCaptureAnimations([]);
    setAttackTrails([]);
    setMovingPiece(null);
    setPendingPromotion(null);
    setLastMove(null);
    setHoveredSquare(null);
    setPosition(chess.fen());
    onStatusChange(getStatus(chess));
  }, [chess, onStatusChange, resetSignal]);

  useEffect(() => {
    if (!movingPiece) {
      return;
    }

    const timeoutId = window.setTimeout(() => setMovingPiece(null), 450);

    return () => window.clearTimeout(timeoutId);
  }, [movingPiece]);

  const legalMoves = selectedSquare ? chess.moves({ square: selectedSquare, verbose: true }) : [];
  const legalTargets = legalMoves.map((move) => move.to);
  const captureTargets = legalMoves
    .filter((move) => Boolean(move.captured))
    .map((move) => move.to);

  const squares = [];
  const labels = [];
  const pieces = [];

  const board = chess.board();
  const checkedKingSquare = chess.isCheck() ? findKingSquare(chess.turn()) : null;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const square = toSquare(row, col);

      squares.push(
        <mesh
          key={`${row}-${col}`}
          position={[col - 3.5, 0, row - 3.5]}
          onClick={(event) => {
            event.stopPropagation();
            handleSquarePress(square, row, col);
          }}
          onPointerEnter={() => setHoveredSquare(square)}
          onPointerLeave={() => setHoveredSquare((current) => (current === square ? null : current))}
        >
          <boxGeometry args={[0.98, 0.12, 0.98]} />
          <meshStandardMaterial
            color={getSquareColor(square, isLight)}
            envMapIntensity={0.55}
            map={isLight ? ivoryTileTexture : blackTileTexture}
            metalness={0.01}
            roughness={0.42}
          />
        </mesh>
      );

      const piece = board[row][col];

      if (piece) {
        pieces.push(
          <Piece
            key={`${row}-${col}-${piece.type}`}
            type={piece.type}
            color={piece.color === "w" ? "white" : "black"}
            position={toPosition(row, col)}
            previousPosition={
              movingPiece?.to === square ? movingPiece.fromPosition : undefined
            }
            motionKind={movingPiece?.to === square ? movingPiece.motionKind : "move"}
            onPress={() => handleSquarePress(square, row, col)}
            onHoverChange={(isHovered) =>
              setHoveredSquare((current) => {
                if (isHovered) {
                  return square;
                }

                return current === square ? null : current;
              })
            }
          />
        );
      }
    }
  }

  for (let index = 0; index < 8; index++) {
    labels.push(
      <Text
        key={`file-${index}`}
        color="#57f7ff"
        fontSize={0.18}
        position={[index - 3.5, 0.14, 4.18]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {files[index].toUpperCase()}
      </Text>,
      <Text
        key={`rank-${index}`}
        color="#f7ff5c"
        fontSize={0.18}
        position={[-4.18, 0.14, index - 3.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {8 - index}
      </Text>,
    );
  }

  return (
    <group>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[9.35, 0.2, 9.35]} />
        <meshStandardMaterial
          color="#080808"
          envMapIntensity={0.45}
          map={blackTileTexture}
          metalness={0.01}
          roughness={0.48}
        />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[8.55, 0.05, 8.55]} />
        <meshStandardMaterial
          color="#f4efe7"
          envMapIntensity={0.42}
          map={ivoryTileTexture}
          metalness={0.01}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.09, 4.33]}>
        <boxGeometry args={[8.75, 0.18, 0.16]} />
        <meshStandardMaterial color="#111111" map={blackTileTexture} metalness={0.01} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.09, -4.33]}>
        <boxGeometry args={[8.75, 0.18, 0.16]} />
        <meshStandardMaterial color="#111111" map={blackTileTexture} metalness={0.01} roughness={0.55} />
      </mesh>
      <mesh position={[4.33, 0.09, 0]}>
        <boxGeometry args={[0.16, 0.18, 8.75]} />
        <meshStandardMaterial color="#111111" map={blackTileTexture} metalness={0.01} roughness={0.55} />
      </mesh>
      <mesh position={[-4.33, 0.09, 0]}>
        <boxGeometry args={[0.16, 0.18, 8.75]} />
        <meshStandardMaterial color="#111111" map={blackTileTexture} metalness={0.01} roughness={0.55} />
      </mesh>
      {squares}
      {lastMove && (
        <>
          <SquareAura
            color="#ffd166"
            intensity={0.42}
            position={squareToPosition(lastMove.from)}
            size={0.88}
          />
          <SquareAura
            color="#ff9f1c"
            intensity={0.55}
            position={squareToPosition(lastMove.to)}
            size={0.94}
          />
        </>
      )}
      {captureTargets.map((target) => (
        <SquareAura
          key={`capture-${target}`}
          color={hoveredSquare === target ? "#ff4b1f" : "#ff9f1c"}
          intensity={hoveredSquare === target ? 0.82 : 0.48}
          position={squareToPosition(target)}
          size={hoveredSquare === target ? 1.02 : 0.88}
          urgent={hoveredSquare === target}
        />
      ))}
      {checkedKingSquare && (
        <SquareAura
          color="#ff244f"
          intensity={0.92}
          position={squareToPosition(checkedKingSquare)}
          size={1.06}
          urgent
        />
      )}
      {labels}
      {pieces}
      {attackTrails.map((trail) => (
        <AttackTrail
          key={trail.id}
          from={trail.from}
          kind={trail.kind}
          to={trail.to}
          onDone={() =>
            setAttackTrails((current) =>
              current.filter((item) => item.id !== trail.id),
            )
          }
        />
      ))}
      {captureAnimations.map((animation) => (
        <CaptureEffect
          key={animation.id}
          kind={animation.kind}
          position={animation.position}
          onDone={() =>
            setCaptureAnimations((current) =>
              current.filter((item) => item.id !== animation.id),
            )
          }
        />
      ))}
      {pendingPromotion && (
        <PromotionPicker
          color={chess.turn()}
          onCancel={() => {
            setPendingPromotion(null);
            setSelectedSquare(null);
          }}
          onSelect={(promotion) =>
            commitMove(
              pendingPromotion.from,
              pendingPromotion.to,
              pendingPromotion.row,
              pendingPromotion.col,
              promotion,
            )
          }
        />
      )}
    </group>
  );

  function getSquareColor(square: Square, isLight: boolean) {
    if (selectedSquare === square) {
      return "#d6b45a";
    }

    if (legalTargets.includes(square)) {
      if (captureTargets.includes(square)) {
        return hoveredSquare === square ? "#ff7043" : "#c76a32";
      }

      return "#77cfa2";
    }

    return isLight ? "#f2e7d5" : "#16100c";
  }

  function handleSquarePress(square: Square, row: number, col: number) {
    if (pendingPromotion) {
      return;
    }

    const piece = chess.get(square);

    if (!selectedSquare) {
      if (piece?.color === chess.turn()) {
        setSelectedSquare(square);
      }

      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (piece?.color === chess.turn()) {
      setSelectedSquare(square);
      return;
    }

    if (isPromotionMove(selectedSquare, square)) {
      setPendingPromotion({
        from: selectedSquare,
        to: square,
        row,
        col,
      });
      return;
    }

    commitMove(selectedSquare, square, row, col);
  }

  function isPromotionMove(from: Square, to: Square) {
    return chess
      .moves({ square: from, verbose: true })
      .some((move) => move.to === to && Boolean(move.promotion));
  }

  function commitMove(
    from: Square,
    to: Square,
    row: number,
    col: number,
    promotion?: PromotionPiece,
  ) {
    const move = chess.move({
      from,
      to,
      promotion,
    });

    if (!move) {
      setSelectedSquare(null);
      setPendingPromotion(null);
      return;
    }

    const capturedPiece = move.captured;
    const isCheckmate = chess.isCheckmate();
    const isDraw = chess.isDraw();
    const isCheck = chess.isCheck();
    const effectKind: AttackEffectKind = isCheckmate
      ? "royal"
      : capturedPiece
        ? pieceCaptureEffects[capturedPiece]
        : "move";

    if (capturedPiece || isCheckmate) {
      const trailKind = effectKind === "move" ? "sparks" : effectKind;
      const targetPosition = toPosition(row, col);

      setAttackTrails((current) => [
        ...current,
        {
          id: Date.now(),
          from: squareToPosition(from),
          kind: trailKind,
          to: targetPosition,
        },
      ]);
      setCaptureAnimations((current) => [
        ...current,
        {
          id: Date.now() + 1,
          kind: trailKind,
          position: targetPosition,
        },
      ]);
    }

    setMovingPiece({
      to,
      fromPosition: squareToPosition(from),
      motionKind: capturedPiece || isCheckmate ? "attack" : "move",
    });
    setLastMove({ from, to });
    setPosition(chess.fen());
    setSelectedSquare(null);
    setPendingPromotion(null);
    setHoveredSquare(null);
    onMove({
      notation: move.san,
      effectKind,
      outcome: isCheckmate ? "checkmate" : isDraw ? "draw" : isCheck ? "check" : undefined,
      captured: capturedPiece
        ? {
            type: capturedPiece,
            color: move.color === "w" ? "b" : "w",
          }
        : undefined,
    });
    onStatusChange(getStatus(chess));
  }

  function findKingSquare(color: "w" | "b") {
    const currentBoard = chess.board();

    for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
      for (let colIndex = 0; colIndex < 8; colIndex++) {
        const piece = currentBoard[rowIndex][colIndex];

        if (piece?.type === "k" && piece.color === color) {
          return toSquare(rowIndex, colIndex);
        }
      }
    }

    return null;
  }
}

function SquareAura({
  color,
  intensity,
  position,
  size,
  urgent = false,
}: {
  color: string;
  intensity: number;
  position: [number, number, number];
  size: number;
  urgent?: boolean;
}) {
  const [age, setAge] = useState(0);

  useFrame((_, delta) => {
    setAge((currentAge) => currentAge + delta);
  });

  const pulse = urgent ? 0.5 + Math.sin(age * 8) * 0.22 : 0.36 + Math.sin(age * 3.2) * 0.1;
  const opacity = Math.max(0.12, pulse * intensity);
  const ringScale = size + (urgent ? Math.sin(age * 8) * 0.04 : Math.sin(age * 3.2) * 0.025);

  return (
    <group position={[position[0], 0.135, position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringScale * 0.42, ringScale * 0.53, urgent ? 48 : 36]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.16} />
      </mesh>
      {urgent && <pointLight color={color} distance={2.4} intensity={2.2 + Math.sin(age * 8) * 0.85} />}
    </group>
  );
}

function PromotionPicker({
  color,
  onCancel,
  onSelect,
}: {
  color: "w" | "b";
  onCancel: () => void;
  onSelect: (piece: PromotionPiece) => void;
}) {
  return (
    <Html center position={[0, 2.35, 0]}>
      <div className="promotion-panel" onPointerDown={(event) => event.stopPropagation()}>
        <p>{color === "w" ? "White" : "Black"} pawn promotion</p>
        <div className="promotion-options">
          {promotionOptions.map((option) => (
            <button
              key={option.type}
              className={color === "w" ? "promotion-white" : "promotion-black"}
              type="button"
              onClick={() => onSelect(option.type)}
            >
              <span>{option.symbol}</span>
              {option.label}
            </button>
          ))}
        </div>
        <button className="promotion-cancel" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </Html>
  );
}

export default Board;

