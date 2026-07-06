import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { Vector3 } from "three";

type PieceProps = {
  type: "p" | "r" | "n" | "b" | "q" | "k";
  color: "white" | "black";
  position: [number, number, number];
  previousPosition?: [number, number, number];
  onPress?: () => void;
};

function Piece({ type, color, position, previousPosition, onPress }: PieceProps) {
  const groupRef = useRef<Group>(null);
  const targetRef = useRef(new Vector3(...position));
  const pieceColor = color === "white" ? "#f7f7ff" : "#17182f";
  const trimColor = color === "white" ? "#57f7ff" : "#ff4bdf";
  const crownColor = color === "white" ? "#f7ff5c" : "#ff7a1f";

  const heightMap: Record<string, number> = {
    p: 0.45,
    r: 0.7,
    n: 0.75,
    b: 0.8,
    q: 0.95,
    k: 1.05,
  };

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
      onClick={(event) => {
        event.stopPropagation();
        onPress?.();
      }}
    >
      <PieceBase pieceColor={pieceColor} trimColor={trimColor} />
      <PieceBody
        type={type}
        pieceColor={pieceColor}
        trimColor={trimColor}
        crownColor={crownColor}
        height={heightMap[type]}
      />
    </group>
  );
}

type PiecePartProps = {
  pieceColor: string;
  trimColor: string;
  crownColor?: string;
  height?: number;
};

type MetalMaterialProps = {
  color: string;
  emissive?: string;
  glow?: number;
  finish?: "body" | "accent" | "crown";
};

function MetalMaterial({
  color,
  emissive = "#000000",
  glow = 0,
  finish = "body",
}: MetalMaterialProps) {
  const finishSettings = {
    body: {
      metalness: 0.9,
      roughness: 0.16,
      envMapIntensity: 1.7,
    },
    accent: {
      metalness: 0.78,
      roughness: 0.12,
      envMapIntensity: 2.1,
    },
    crown: {
      metalness: 0.95,
      roughness: 0.1,
      envMapIntensity: 2.4,
    },
  };

  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={glow}
      {...finishSettings[finish]}
    />
  );
}

function PieceBase({ pieceColor, trimColor }: PiecePartProps) {
  return (
    <>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.16, 36]} />
        <MetalMaterial color={pieceColor} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.3, 0.035, 10, 36]} />
        <MetalMaterial color={trimColor} emissive={trimColor} finish="accent" glow={0.42} />
      </mesh>
    </>
  );
}

function PieceBody({ type, pieceColor, trimColor, crownColor, height = 0.7 }: PiecePartProps & {
  type: PieceProps["type"];
}) {
  const crown = crownColor ?? trimColor;

  if (type === "p") {
    return (
      <>
        <mesh position={[0, height / 2 + 0.12, 0]}>
          <cylinderGeometry args={[0.2, 0.28, height, 32]} />
          <MetalMaterial color={pieceColor} />
        </mesh>
        <mesh position={[0, height + 0.38, 0]}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <MetalMaterial color={pieceColor} />
        </mesh>
      </>
    );
  }

  if (type === "r") {
    return (
      <>
        <mesh position={[0, 0.48, 0]}>
          <cylinderGeometry args={[0.24, 0.3, 0.58, 36]} />
          <MetalMaterial color={pieceColor} />
        </mesh>
        <mesh position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.34, 0.28, 0.18, 8]} />
          <MetalMaterial color={pieceColor} />
        </mesh>
        {[0, 1, 2, 3].map((index) => (
          <mesh
            key={index}
            position={[
              Math.cos((index * Math.PI) / 2) * 0.24,
              0.98,
              Math.sin((index * Math.PI) / 2) * 0.24,
            ]}
          >
            <boxGeometry args={[0.13, 0.16, 0.13]} />
            <MetalMaterial color={trimColor} emissive={trimColor} finish="accent" glow={0.32} />
          </mesh>
        ))}
      </>
    );
  }

  if (type === "n") {
    return (
      <>
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 0.6, 32]} />
          <MetalMaterial color={pieceColor} />
        </mesh>
        <mesh position={[0.02, 0.95, -0.04]} rotation={[0.05, 0, -0.35]}>
          <boxGeometry args={[0.34, 0.48, 0.2]} />
          <MetalMaterial color={pieceColor} />
        </mesh>
        <mesh position={[0.16, 1.14, -0.04]} rotation={[0.05, 0, -0.75]}>
          <coneGeometry args={[0.12, 0.26, 4]} />
          <MetalMaterial color={trimColor} emissive={trimColor} finish="accent" glow={0.38} />
        </mesh>
      </>
    );
  }

  if (type === "b") {
    return (
      <>
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.18, 0.29, 0.64, 32]} />
          <MetalMaterial color={pieceColor} />
        </mesh>
        <mesh position={[0, 0.93, 0]}>
          <sphereGeometry args={[0.25, 32, 32]} />
          <MetalMaterial color={pieceColor} />
        </mesh>
        <mesh position={[0.02, 1.12, 0]} rotation={[0, 0, 0.42]}>
          <boxGeometry args={[0.05, 0.34, 0.08]} />
          <MetalMaterial color={trimColor} emissive={trimColor} finish="accent" glow={0.48} />
        </mesh>
      </>
    );
  }

  if (type === "q") {
    return (
      <>
        <mesh position={[0, 0.56, 0]}>
          <cylinderGeometry args={[0.2, 0.31, 0.7, 36]} />
          <MetalMaterial color={pieceColor} />
        </mesh>
        {[0, 1, 2, 3, 4].map((index) => (
          <mesh
            key={index}
            position={[
              Math.cos((index / 5) * Math.PI * 2) * 0.19,
              1.1,
              Math.sin((index / 5) * Math.PI * 2) * 0.19,
            ]}
          >
            <sphereGeometry args={[0.08, 16, 16]} />
            <MetalMaterial color={crown} emissive={crown} finish="crown" glow={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 1.0, 0]}>
          <coneGeometry args={[0.29, 0.38, 5]} />
          <MetalMaterial color={pieceColor} />
        </mesh>
      </>
    );
  }

  return (
    <>
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.21, 0.32, 0.72, 36]} />
        <MetalMaterial color={pieceColor} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.24, 32, 32]} />
        <MetalMaterial color={pieceColor} />
      </mesh>
      <mesh position={[0, 1.28, 0]}>
        <boxGeometry args={[0.09, 0.34, 0.09]} />
        <MetalMaterial color={crown} emissive={crown} finish="crown" glow={0.55} />
      </mesh>
      <mesh position={[0, 1.37, 0]}>
        <boxGeometry args={[0.28, 0.08, 0.08]} />
        <MetalMaterial color={crown} emissive={crown} finish="crown" glow={0.55} />
      </mesh>
    </>
  );
}

export default Piece;
