export type PieceKind = "p" | "r" | "n" | "b" | "q" | "k";
export type PieceColor = "white" | "black";
export type PieceModelKey = `${PieceColor}-${PieceKind}`;

export type PieceModelTransform = {
  offset?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

export type PieceModelConfig = PieceModelTransform & {
  path: string;
};

type PieceModelConfigs = Partial<Record<PieceModelKey, PieceModelConfig>>;

const defaultTransform = {
  offset: [0, 0, 0] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  scale: 1,
};

const pieceModelConfigs: PieceModelConfigs = {
  // Example:
  // "white-k": {
  //   path: "/models/white-king.glb",
  //   scale: 0.82,
  //   offset: [0, 0, 0],
  //   rotation: [0, Math.PI, 0],
  // },
};

export function getPieceModelConfig(type: PieceKind, color: PieceColor) {
  const colorSpecificConfig = pieceModelConfigs[`${color}-${type}`];
  const sharedWhiteConfig = pieceModelConfigs[`white-${type}`];
  const config = colorSpecificConfig ?? sharedWhiteConfig;

  if (!config) {
    return undefined;
  }

  return {
    ...defaultTransform,
    ...config,
  };
}
