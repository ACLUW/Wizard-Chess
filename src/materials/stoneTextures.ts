import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

type StoneTextureOptions = {
  base: [number, number, number];
  vein: [number, number, number];
  accent: [number, number, number];
  scale?: number;
  contrast?: number;
};

const textureCache = new Map<string, CanvasTexture>();

export function createStoneTexture(key: string, options: StoneTextureOptions) {
  const cachedTexture = textureCache.get(key);

  if (cachedTexture) {
    return cachedTexture;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create stone texture context.");
  }

  const image = context.createImageData(canvas.width, canvas.height);
  const scale = options.scale ?? 14;
  const contrast = options.contrast ?? 0.6;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const normalizedX = x / canvas.width;
      const normalizedY = y / canvas.height;
      const wave =
        Math.sin((normalizedX * scale + Math.sin(normalizedY * 13) * 0.8) * Math.PI) *
        0.5;
      const grain =
        Math.sin((normalizedX + normalizedY) * 82) * 0.12 +
        Math.sin((normalizedX * 31 - normalizedY * 47) * Math.PI) * 0.08;
      const veinAmount = smoothStep(0.38, 0.78, Math.abs(wave + grain));
      const accentAmount = smoothStep(0.88, 1, Math.abs(wave + grain * 1.7));
      const shade = 1 + (grain + wave * 0.12) * contrast;
      const pixelIndex = (y * canvas.width + x) * 4;
      const mixed = mixColor(
        mixColor(options.base, options.vein, veinAmount),
        options.accent,
        accentAmount,
      );

      image.data[pixelIndex] = clamp(mixed[0] * shade);
      image.data[pixelIndex + 1] = clamp(mixed[1] * shade);
      image.data[pixelIndex + 2] = clamp(mixed[2] * shade);
      image.data[pixelIndex + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  texture.needsUpdate = true;
  textureCache.set(key, texture);

  return texture;
}

export const stoneTexturePresets = {
  whiteMarble: {
    base: [230, 226, 216],
    vein: [170, 166, 156],
    accent: [255, 255, 250],
    scale: 17,
    contrast: 0.45,
  },
  blackOnyx: {
    base: [10, 10, 12],
    vein: [55, 55, 58],
    accent: [120, 116, 108],
    scale: 15,
    contrast: 0.55,
  },
  ivoryTile: {
    base: [244, 239, 231],
    vein: [205, 196, 182],
    accent: [255, 255, 248],
    scale: 10,
    contrast: 0.32,
  },
  blackTile: {
    base: [8, 8, 9],
    vein: [45, 45, 48],
    accent: [95, 92, 84],
    scale: 12,
    contrast: 0.48,
  },
} satisfies Record<string, StoneTextureOptions>;

function smoothStep(edge0: number, edge1: number, value: number) {
  const amount = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));

  return amount * amount * (3 - 2 * amount);
}

function mixColor(
  first: [number, number, number],
  second: [number, number, number],
  amount: number,
): [number, number, number] {
  return [
    first[0] + (second[0] - first[0]) * amount,
    first[1] + (second[1] - first[1]) * amount,
    first[2] + (second[2] - first[2]) * amount,
  ];
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, value));
}
