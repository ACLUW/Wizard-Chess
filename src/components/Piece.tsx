import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { Vector3 } from "three";

type PieceProps = {
  type: string;
  color: "white" | "black";
  position: [number, number, number];
  previousPosition?: [number, number, number];
  onPress?: () => void;
};

// ACL: Simple 3D chess piece placeholder before we upgrade to realistic models
function Piece({ type, color, position, previousPosition, onPress }: PieceProps) {
  const groupRef = useRef<Group>(null);
  const pieceColor = color === "white" ? "#eeeeee" : "#222222";

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

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    const target = new Vector3(...position);
    groupRef.current.position.lerp(target, Math.min(1, delta * 9));
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
      <mesh position={[0, heightMap[type] / 2, 0]}>
        <cylinderGeometry args={[0.28, 0.35, heightMap[type], 32]} />
        <meshStandardMaterial color={pieceColor} />
      </mesh>

      <mesh position={[0, heightMap[type] + 0.12, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color={pieceColor} />
      </mesh>
    </group>
  );
}

export default Piece;
