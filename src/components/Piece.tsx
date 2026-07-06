import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { Vector3 } from "three";

type PieceKind = "p" | "r" | "n" | "b" | "q" | "k";

type PieceProps = {
  type: PieceKind;
  color: "white" | "black";
  position: [number, number, number];
  previousPosition?: [number, number, number];
  onPress?: () => void;
};

type Palette = {
  armor: string;
  cloth: string;
  trim: string;
  weapon: string;
  glow: string;
};

type MaterialProps = {
  color: string;
  emissive?: string;
  glow?: number;
  finish?: "armor" | "cloth" | "accent" | "weapon";
};

const pieceScale = 0.74;

function Piece({ type, color, position, previousPosition, onPress }: PieceProps) {
  const groupRef = useRef<Group>(null);
  const targetRef = useRef(new Vector3(...position));
  const palette = getPalette(color);

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
      <ChampionBase palette={palette} />
      <ChampionBody palette={palette} />
      <ChampionIdentity type={type} palette={palette} />
    </group>
  );
}

function getPalette(color: PieceProps["color"]): Palette {
  if (color === "white") {
    return {
      armor: "#dfe8ff",
      cloth: "#1f8cff",
      trim: "#7df9ff",
      weapon: "#f5f0c2",
      glow: "#57f7ff",
    };
  }

  return {
    armor: "#151729",
    cloth: "#5b153f",
    trim: "#ff4bdf",
    weapon: "#ff7a1f",
    glow: "#ff4bdf",
  };
}

function MetalMaterial({ color, emissive = "#000000", glow = 0, finish = "armor" }: MaterialProps) {
  const settings = {
    armor: { metalness: 0.92, roughness: 0.18, envMapIntensity: 1.9 },
    cloth: { metalness: 0.45, roughness: 0.32, envMapIntensity: 1.2 },
    accent: { metalness: 0.86, roughness: 0.12, envMapIntensity: 2.2 },
    weapon: { metalness: 0.96, roughness: 0.1, envMapIntensity: 2.6 },
  }[finish];

  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={glow}
      {...settings}
    />
  );
}

function ChampionBase({ palette }: { palette: Palette }) {
  return (
    <>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.39, 0.46, 0.14, 40]} />
        <MetalMaterial color={palette.armor} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <torusGeometry args={[0.32, 0.032, 10, 40]} />
        <MetalMaterial color={palette.trim} emissive={palette.glow} finish="accent" glow={0.42} />
      </mesh>
    </>
  );
}

function ChampionBody({ palette }: { palette: Palette }) {
  return (
    <>
      <mesh position={[-0.12, 0.35, 0]} rotation={[0, 0, 0.12]}>
        <capsuleGeometry args={[0.08, 0.34, 8, 14]} />
        <MetalMaterial color={palette.armor} />
      </mesh>
      <mesh position={[0.12, 0.35, 0]} rotation={[0, 0, -0.12]}>
        <capsuleGeometry args={[0.08, 0.34, 8, 14]} />
        <MetalMaterial color={palette.armor} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.2, 0.28, 0.55, 6]} />
        <MetalMaterial color={palette.cloth} finish="cloth" />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[0.52, 0.13, 0.28]} />
        <MetalMaterial color={palette.armor} />
      </mesh>
      <mesh position={[-0.34, 0.72, 0]} rotation={[0, 0, -0.65]}>
        <capsuleGeometry args={[0.055, 0.36, 8, 12]} />
        <MetalMaterial color={palette.armor} />
      </mesh>
      <mesh position={[0.34, 0.72, 0]} rotation={[0, 0, 0.65]}>
        <capsuleGeometry args={[0.055, 0.36, 8, 12]} />
        <MetalMaterial color={palette.armor} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <MetalMaterial color={palette.armor} />
      </mesh>
      <mesh position={[0, 0.58, -0.12]} rotation={[0.45, 0, 0]}>
        <boxGeometry args={[0.38, 0.08, 0.08]} />
        <MetalMaterial color={palette.trim} emissive={palette.glow} finish="accent" glow={0.34} />
      </mesh>
    </>
  );
}

function ChampionIdentity({ type, palette }: { type: PieceKind; palette: Palette }) {
  if (type === "p") {
    return (
      <>
        <mesh position={[0, 1.24, 0]}>
          <coneGeometry args={[0.18, 0.22, 4]} />
          <MetalMaterial color={palette.trim} emissive={palette.glow} finish="accent" glow={0.35} />
        </mesh>
        <mesh position={[0.32, 0.58, 0.08]} rotation={[0.35, 0.15, -0.25]}>
          <boxGeometry args={[0.08, 0.4, 0.04]} />
          <MetalMaterial color={palette.weapon} finish="weapon" />
        </mesh>
      </>
    );
  }

  if (type === "r") {
    return (
      <>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.25, 0.2, 0.18, 8]} />
          <MetalMaterial color={palette.armor} />
        </mesh>
        {[0, 1, 2, 3].map((index) => (
          <mesh
            key={index}
            position={[
              Math.cos((index * Math.PI) / 2) * 0.2,
              1.33,
              Math.sin((index * Math.PI) / 2) * 0.2,
            ]}
          >
            <boxGeometry args={[0.11, 0.16, 0.11]} />
            <MetalMaterial color={palette.trim} emissive={palette.glow} finish="accent" glow={0.34} />
          </mesh>
        ))}
        <mesh position={[-0.43, 0.62, 0]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[0.12, 0.58, 0.38]} />
          <MetalMaterial color={palette.armor} />
        </mesh>
      </>
    );
  }

  if (type === "n") {
    return (
      <>
        <mesh position={[0.07, 1.22, -0.02]} rotation={[0.08, 0, -0.45]}>
          <boxGeometry args={[0.34, 0.42, 0.22]} />
          <MetalMaterial color={palette.armor} />
        </mesh>
        <mesh position={[0.21, 1.42, -0.02]} rotation={[0, 0, -0.72]}>
          <coneGeometry args={[0.11, 0.26, 4]} />
          <MetalMaterial color={palette.trim} emissive={palette.glow} finish="accent" glow={0.42} />
        </mesh>
        <mesh position={[0.42, 0.73, 0.06]} rotation={[0, 0, -0.85]}>
          <boxGeometry args={[0.08, 0.74, 0.08]} />
          <MetalMaterial color={palette.weapon} finish="weapon" />
        </mesh>
      </>
    );
  }

  if (type === "b") {
    return (
      <>
        <mesh position={[0, 1.22, 0]}>
          <sphereGeometry args={[0.22, 24, 24]} />
          <MetalMaterial color={palette.armor} />
        </mesh>
        <mesh position={[0.02, 1.38, 0]} rotation={[0, 0, 0.45]}>
          <boxGeometry args={[0.06, 0.36, 0.08]} />
          <MetalMaterial color={palette.trim} emissive={palette.glow} finish="accent" glow={0.52} />
        </mesh>
        <mesh position={[-0.36, 0.83, 0.03]} rotation={[0, 0, 0.72]}>
          <boxGeometry args={[0.08, 0.78, 0.08]} />
          <MetalMaterial color={palette.weapon} finish="weapon" />
        </mesh>
      </>
    );
  }

  if (type === "q") {
    return (
      <>
        <mesh position={[0, 1.25, 0]}>
          <coneGeometry args={[0.28, 0.34, 5]} />
          <MetalMaterial color={palette.armor} />
        </mesh>
        {[0, 1, 2, 3, 4].map((index) => (
          <mesh
            key={index}
            position={[
              Math.cos((index / 5) * Math.PI * 2) * 0.2,
              1.48,
              Math.sin((index / 5) * Math.PI * 2) * 0.2,
            ]}
          >
            <sphereGeometry args={[0.075, 16, 16]} />
            <MetalMaterial color={palette.weapon} emissive={palette.weapon} finish="weapon" glow={0.46} />
          </mesh>
        ))}
        <mesh position={[0.46, 0.76, 0]} rotation={[0, 0, -0.6]}>
          <torusGeometry args={[0.16, 0.025, 8, 28]} />
          <MetalMaterial color={palette.trim} emissive={palette.glow} finish="accent" glow={0.45} />
        </mesh>
      </>
    );
  }

  return (
    <>
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.2, 6]} />
        <MetalMaterial color={palette.armor} />
      </mesh>
      <mesh position={[0, 1.53, 0]}>
        <boxGeometry args={[0.09, 0.38, 0.09]} />
        <MetalMaterial color={palette.weapon} emissive={palette.weapon} finish="weapon" glow={0.5} />
      </mesh>
      <mesh position={[0, 1.63, 0]}>
        <boxGeometry args={[0.31, 0.08, 0.08]} />
        <MetalMaterial color={palette.weapon} emissive={palette.weapon} finish="weapon" glow={0.5} />
      </mesh>
      <mesh position={[0.43, 0.8, 0.02]} rotation={[0, 0, -0.25]}>
        <boxGeometry args={[0.1, 0.82, 0.08]} />
        <MetalMaterial color={palette.weapon} finish="weapon" />
      </mesh>
    </>
  );
}

export default Piece;
