export type PieceKind = "p" | "r" | "n" | "b" | "q" | "k";
export type PieceColor = "white" | "black";

type PieceModelPaths = Partial<Record<`${PieceColor}-${PieceKind}`, string>>;

const pieceModelPaths: PieceModelPaths = {};

export function getPieceModelPath(type: PieceKind, color: PieceColor) {
  return pieceModelPaths[`${color}-${type}`] ?? pieceModelPaths[`white-${type}`];
}
