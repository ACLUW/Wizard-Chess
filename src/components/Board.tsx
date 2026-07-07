import { useEffect, useMemo, useState } from "react";
import { Text } from "@react-three/drei";
import { Chess } from "chess.js";
import type { PieceSymbol, Square } from "chess.js";
import CaptureEffect from "./CaptureEffect";
import Piece from "./Piece";
import { createStoneTexture, stoneTexturePresets } from "../materials/stoneTextures";

export type CapturedPiece = {
  type: PieceSymbol;
  color: "w" | "b";
};

export type GameMove = {
  notation: string;
  effectKind: "move" | "sparks" | "fire";
  captured?: CapturedPiece;
};

type BoardProps = {
  onStatusChange: (status: string) => void;
  onMove: (move: GameMove) => void;
  resetSignal: number;
};

type CaptureAnimation = {
  id: number;
  kind: "sparks" | "fire";
  position: [number, number, number];
};

type MovingPiece = {
  to: Square;
  fromPosition: [number, number, number];
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const royalPieces: PieceSymbol[] = ["r", "n", "b", "q", "k"];

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
  const [movingPiece, setMovingPiece] = useState<MovingPiece | null>(null);
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
    setMovingPiece(null);
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

  const legalTargets = selectedSquare
    ? chess.moves({ square: selectedSquare, verbose: true }).map((move) => move.to)
    : [];

  const squares = [];
  const labels = [];
  const pieces = [];

  const board = chess.board();

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
            onPress={() => handleSquarePress(square, row, col)}
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
      {labels}
      {pieces}
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
    </group>
  );

  function getSquareColor(square: Square, isLight: boolean) {
    if (selectedSquare === square) {
      return "#d6b45a";
    }

    if (legalTargets.includes(square)) {
      return "#77cfa2";
    }

    return isLight ? "#f8f4ec" : "#090909";
  }

  function handleSquarePress(square: Square, row: number, col: number) {
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

    const move = chess.move({
      from: selectedSquare,
      to: square,
      promotion: "q",
    });

    if (!move) {
      setSelectedSquare(null);
      return;
    }

    const capturedPiece = move.captured;
    const effectKind = capturedPiece
      ? royalPieces.includes(capturedPiece)
        ? "fire"
        : "sparks"
      : "move";

    if (capturedPiece) {
      const captureKind = royalPieces.includes(capturedPiece) ? "fire" : "sparks";

      setCaptureAnimations((current) => [
        ...current,
        {
          id: Date.now(),
          kind: captureKind,
          position: toPosition(row, col),
        },
      ]);
    }

    setMovingPiece({
      to: square,
      fromPosition: squareToPosition(selectedSquare),
    });
    setPosition(chess.fen());
    setSelectedSquare(null);
    onMove({
      notation: move.san,
      effectKind,
      captured: capturedPiece
        ? {
            type: capturedPiece,
            color: move.color === "w" ? "b" : "w",
          }
        : undefined,
    });
    onStatusChange(getStatus(chess));
  }
}

export default Board;

