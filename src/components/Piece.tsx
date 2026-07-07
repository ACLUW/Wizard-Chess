import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import type { Group, Object3D } from "three";
import { Vector3 } from "three";
import { createStoneTexture, stoneTexturePresets } from "../materials/stoneTextures";
import { getPieceModelConfig } from "../pieceModelConfig";
import type { PieceColor, PieceKind } from "../pieceModelConfig";

type PieceProps = {
  type: PieceKind;
  color: PieceColor;
  position: [number, number, number];
  previousPosition?: [number, number, number];
  onPress?: () => void;
};

type MarblePalette = {
  stone: string;
  shadow: string;
  carving: string;
  accent: string;
};

type StoneMaterialProps = {
  color: string;
  accent?: string;
  glow?: number;
  finish?: "stone" | "polished" | "shadow" | "accent";
};

const pieceScale = 0.78;

function Piece({ type, color, position, previousPosition, onPress }: PieceProps) {
  const groupRef = useRef<Group>(null);
  const targetRef = useRef(new Vector3(...position));
  const palette = getPalette(color);
  const modelConfig = getPieceModelConfig(type, color);

  useEffect(() => {
    if (!groupRef.current || !previousPosition) {
      return;
    }

    groupRef.current.position.set(...previousPosition);
  }, [previousPosition]);

  useEffect(() => {
    targetRef.current.set(...position);
  }, [position]);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.position.lerp(targetRef.current, Math.min(1, delta * 9));
  });

  return (
    <group
      ref={groupRef}
      position={previousPosition ?? position}
      scale={[pieceScale, pieceScale, pieceScale]}
      onClick={(event) => {
        event.stopPropagation();
        onPress?.();
      }}
    >
      {modelConfig ? (
        <Suspense fallback={<ProceduralMarblePiece type={type} palette={palette} />}>
          <LoadedModelPiece
            modelPath={modelConfig.path}
            offset={modelConfig.offset}
            rotation={modelConfig.rotation}
            scale={modelConfig.scale}
          />
        </Suspense>
      ) : (
        <ProceduralMarblePiece type={type} palette={palette} />
      )}
    </group>
  );
}

function LoadedModelPiece({
  modelPath,
  offset,
  rotation,
  scale,
}: {
  modelPath: string;
  offset: [number, number, number];
  rotation: [number, number, number];
  scale: number | [number, number, number];
}) {
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo<Object3D>(() => scene.clone(true), [scene]);

  return (
    <primitive
      object={clonedScene}
      position={offset}
      rotation={rotation}
      scale={typeof scale === "number" ? [scale, scale, scale] : scale}
    />
  );
}

function ProceduralMarblePiece({ type, palette }: { type: PieceKind; palette: MarblePalette }) {
  return (
    <>
      <CarvedBase palette={palette} />
      <OrnateColumn palette={palette} />
      <PieceCrown type={type} palette={palette} />
      <ReliefSwirls palette={palette} />
    </>
  );
}

function getPalette(color: PieceColor): MarblePalette {
  if (color === "white") {
    return {
      stone: "#f3f0e8",
      shadow: "#cbc6bb",
      carving: "#ffffff",
      accent: "#d9d2c2",
    };
  }

  return {
    stone: "#2f2925",
    shadow: "#120c09",
    carving: "#6b5a4a",
    accent: "#8b6a46",
  };
}

function StoneMaterial({
  color,
  accent = "#ffffff",
  glow = 0,
  finish = "stone",
}: StoneMaterialProps) {
  const textureKey = isDarkHex(color) ? "blackOnyx" : "whiteMarble";
  const texture = useMemo(
    () => createStoneTexture(textureKey, stoneTexturePresets[textureKey]),
    [textureKey],
  );
  const settings = {
    stone: { metalness: 0.02, roughness: 0.48, envMapIntensity: 0.55 },
    polished: { metalness: 0.03, roughness: 0.34, envMapIntensity: 0.72 },
    shadow: { metalness: 0.01, roughness: 0.58, envMapIntensity: 0.38 },
    accent: { metalness: 0.03, roughness: 0.4, envMapIntensity: 0.65 },
  }[finish];

  return (
    <meshStandardMaterial
      color={color}
      emissive={accent}
      emissiveIntensity={glow}
      map={texture}
      {...settings}
    />
  );
}

function isDarkHex(color: string) {
  const hex = color.replace("#", "");

  if (hex.length !== 6) {
    return false;
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return red * 0.299 + green * 0.587 + blue * 0.114 < 90;
}

function CarvedBase({ palette }: { palette: MarblePalette }) {
  return (
    <>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.43, 0.48, 0.12, 56]} />
        <StoneMaterial color={palette.shadow} finish="polished" />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.38, 0.43, 0.1, 56]} />
        <StoneMaterial color={palette.stone} finish="polished" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <torusGeometry args={[0.34, 0.03, 12, 56]} />
        <StoneMaterial color={palette.accent} finish="accent" />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.31, 0.36, 0.09, 56]} />
        <StoneMaterial color={palette.stone} finish="polished" />
      </mesh>
    </>
  );
}

function OrnateColumn({ palette }: { palette: MarblePalette }) {
  return (
    <>
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 0.5, 44]} />
        <StoneMaterial color={palette.stone} />
      </mesh>
      <mesh position={[0, 0.86, 0]}>
        <sphereGeometry args={[0.25, 32, 20]} />
        <StoneMaterial color={palette.stone} finish="polished" />
      </mesh>
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.21, 0.24, 0.12, 44]} />
        <StoneMaterial color={palette.stone} />
      </mesh>
    </>
  );
}

function ReliefSwirls({ palette }: { palette: MarblePalette }) {
  return (
    <>
      {[0, 1, 2, 3].map((index) => {
        const angle = (index / 4) * Math.PI * 2;
        const x = Math.cos(angle) * 0.255;
        const z = Math.sin(angle) * 0.255;

        return (
          <group key={index} position={[x, 0.62, z]} rotation={[Math.PI / 2, 0, -angle]}>
            <mesh>
              <torusGeometry args={[0.11, 0.012, 8, 28, Math.PI * 1.35]} />
              <StoneMaterial color={palette.carving} finish="accent" />
            </mesh>
            <mesh position={[0.06, 0.08, 0]}>
              <torusGeometry args={[0.06, 0.01, 8, 24, Math.PI * 1.25]} />
              <StoneMaterial color={palette.accent} finish="accent" />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function PieceCrown({ type, palette }: { type: PieceKind; palette: MarblePalette }) {
  if (type === "p") {
    return (
      <>
        <mesh position={[0, 0.98, 0]}>
          <cylinderGeometry args={[0.16, 0.2, 0.18, 28]} />
          <StoneMaterial color={palette.stone} finish="polished" />
        </mesh>
        <mesh position={[0, 1.18, 0]}>
          <sphereGeometry args={[0.16, 30, 20]} />
          <StoneMaterial color={palette.stone} finish="polished" />
        </mesh>
        <mesh position={[0, 1.34, 0]}>
          <sphereGeometry args={[0.045, 16, 12]} />
          <StoneMaterial color={palette.carving} finish="accent" />
        </mesh>
      </>
    );
  }

  if (type === "r") {
    return (
      <>
        <mesh position={[0, 1.18, 0]}>
          <cylinderGeometry args={[0.28, 0.25, 0.2, 44]} />
          <StoneMaterial color={palette.stone} finish="polished" />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <mesh
            key={index}
            position={[
              Math.cos((index / 6) * Math.PI * 2) * 0.22,
              1.34,
              Math.sin((index / 6) * Math.PI * 2) * 0.22,
            ]}
          >
            <boxGeometry args={[0.09, 0.14, 0.09]} />
            <StoneMaterial color={palette.stone} finish="polished" />
          </mesh>
        ))}
      </>
    );
  }

  if (type === "n") {
    return (
      <>
        <mesh position={[0.02, 1.12, -0.02]} rotation={[0.06, 0, -0.22]}>
          <boxGeometry args={[0.26, 0.34, 0.2]} />
          <StoneMaterial color={palette.stone} finish="polished" />
        </mesh>
        <mesh position={[0.18, 1.32, -0.02]} rotation={[0, 0, -0.8]}>
          <coneGeometry args={[0.1, 0.22, 4]} />
          <StoneMaterial color={palette.stone} finish="polished" />
        </mesh>
        <mesh position={[0.22, 1.17, 0.1]}>
          <sphereGeometry args={[0.035, 12, 10]} />
          <StoneMaterial color={palette.shadow} finish="shadow" />
        </mesh>
        <mesh position={[0.25, 1.06, 0.02]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.16, 0.055, 0.09]} />
          <StoneMaterial color={palette.shadow} finish="shadow" />
        </mesh>
        <mesh position={[-0.12, 1.04, 0]}>
          <torusGeometry args={[0.2, 0.018, 8, 28, Math.PI * 1.25]} />
          <StoneMaterial color={palette.carving} finish="accent" />
        </mesh>
        <mesh position={[-0.18, 1.2, 0.02]} rotation={[0, 0, 0.7]}>
          <coneGeometry args={[0.06, 0.18, 3]} />
          <StoneMaterial color={palette.carving} finish="accent" />
        </mesh>
      </>
    );
  }

  if (type === "b") {
    return (
      <>
        <mesh position={[0, 1.08, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 0.16, 34]} />
          <StoneMaterial color={palette.stone} finish="polished" />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.2, 32, 24]} />
          <StoneMaterial color={palette.stone} finish="polished" />
        </mesh>
        <mesh position={[0.02, 1.43, 0]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.055, 0.42, 0.08]} />
          <StoneMaterial color={palette.shadow} finish="shadow" />
        </mesh>
        <mesh position={[0, 1.48, 0]}>
          <coneGeometry args={[0.15, 0.3, 32]} />
          <StoneMaterial color={palette.stone} finish="polished" />
        </mesh>
        <mesh position={[0, 1.65, 0]}>
          <sphereGeometry args={[0.045, 14, 10]} />
          <StoneMaterial color={palette.carving} finish="accent" />
        </mesh>
      </>
    );
  }

  if (type === "q") {
    return (
      <>
        <mesh position={[0, 1.18, 0]}>
          <cylinderGeometry args={[0.23, 0.28, 0.18, 44]} />
          <StoneMaterial color={palette.stone} finish="polished" />
        </mesh>
        {[0, 1, 2, 3, 4].map((index) => (
          <mesh
            key={index}
            position={[
              Math.cos((index / 5) * Math.PI * 2) * 0.2,
              1.42,
              Math.sin((index / 5) * Math.PI * 2) * 0.2,
            ]}
          >
            <sphereGeometry args={[0.075, 16, 12]} />
            <StoneMaterial color={palette.carving} finish="accent" />
          </mesh>
        ))}
        <mesh position={[0, 1.34, 0]}>
          <torusGeometry args={[0.22, 0.025, 10, 42]} />
          <StoneMaterial color={palette.accent} finish="accent" />
        </mesh>
      </>
    );
  }

  return (
    <>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.22, 44]} />
        <StoneMaterial color={palette.stone} finish="polished" />
      </mesh>
      <mesh position={[0, 1.48, 0]}>
        <boxGeometry args={[0.08, 0.38, 0.08]} />
        <StoneMaterial color={palette.carving} finish="accent" />
      </mesh>
      <mesh position={[0, 1.58, 0]}>
        <boxGeometry args={[0.3, 0.08, 0.08]} />
        <StoneMaterial color={palette.carving} finish="accent" />
      </mesh>
      <mesh position={[0, 1.34, 0]}>
        <torusGeometry args={[0.22, 0.025, 10, 42]} />
        <StoneMaterial color={palette.accent} finish="accent" />
      </mesh>
    </>
  );
}

export default Piece;
