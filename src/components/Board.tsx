import { useState } from "react";
import { Chess } from "chess.js";
import type { PieceSymbol, Square } from "chess.js";
import CaptureEffect from "./CaptureEffect";
import Piece from "./Piece";

type BoardProps = {
  onStatusChange: (status: string) => void;
};

type CaptureAnimation = {
  id: number;
  kind: "sparks" | "fire";
  position: [number, number, number];
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const royalPieces: PieceSymbol[] = ["r", "n", "b", "q", "k"];

function toSquare(row: number, col: number) {
  return `${files[col]}${8 - row}` as Square;
}

function toPosition(row: number, col: number): [number, number, number] {
  return [col - 3.5, 0.15, row - 3.5];
}

function getStatus(chess: Chess) {
  if (chess.isCheckmate()) {
    return `Checkmate — ${chess.turn() === "w" ? "Black" : "White"} wins`;
  }

  if (chess.isDraw()) {
    return "Draw";
  }

  return `${chess.turn() === "w" ? "White" : "Black"} to move${
    chess.isCheck() ? " — check!" : ""
  }`;
}

function Board({ onStatusChange }: BoardProps) {
  const [chess] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [, setPosition] = useState(chess.fen());
  const [captureAnimations, setCaptureAnimations] = useState<CaptureAnimation[]>([]);

  const legalTargets = selectedSquare
    ? chess.moves({ square: selectedSquare, verbose: true }).map((move) => move.to)
    : [];

  const squares = [];
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
          <boxGeometry args={[1, 0.15, 1]} />
          <meshStandardMaterial color={getSquareColor(square, isLight)} />
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
            onPress={() => handleSquarePress(square, row, col)}
          />
        );
      }
    }
  }

  return (
    <group>
      {squares}
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
      return "#f7ff5c";
    }

    if (legalTargets.includes(square)) {
      return "#22ff99";
    }

    return isLight ? "#41e8ff" : "#1b2464";
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

    if (capturedPiece) {
      setCaptureAnimations((current) => [
        ...current,
        {
          id: Date.now(),
          kind: royalPieces.includes(capturedPiece) ? "fire" : "sparks",
          position: toPosition(row, col),
        },
      ]);
    }

    setPosition(chess.fen());
    setSelectedSquare(null);
    onStatusChange(getStatus(chess));
  }
}

export default Board;
