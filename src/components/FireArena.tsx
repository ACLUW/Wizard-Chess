import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";

const torchPositions: Array<[number, number, number]> = [
  [-5.4, 0.1, -5.4],
  [5.4, 0.1, -5.4],
  [-5.4, 0.1, 5.4],
  [5.4, 0.1, 5.4],
];

function FireArena() {
  return (
    <group>
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[7.4, 7.9, 0.18, 8]} />
        <meshStandardMaterial color="#070303" roughness={0.86} />
      </mesh>

      <mesh position={[0, 0.06, 0]}>
        <ringGeometry args={[5.3, 5.8, 8]} />
        <meshStandardMaterial color="#1a0904" emissive="#4a1606" emissiveIntensity={0.5} roughness={0.9} />
      </mesh>

      {torchPositions.map((position, index) => (
        <Torch key={index} position={position} />
      ))}
    </group>
  );
}

function Torch({ position }: { position: [number, number, number] }) {
  const flameRef = useRef<Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!flameRef.current) {
      return;
    }

    const flicker = 1 + Math.sin(state.clock.elapsedTime * 7 + phase) * 0.12;
    flameRef.current.scale.set(0.9 + flicker * 0.1, flicker, 0.9 + flicker * 0.1);
    flameRef.current.rotation.y += 0.025;
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.11, 0.16, 0.72, 16]} />
        <meshStandardMaterial color="#140807" roughness={0.74} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.24, 0.18, 0.16, 20]} />
        <meshStandardMaterial color="#20100b" emissive="#321006" emissiveIntensity={0.3} roughness={0.7} />
      </mesh>
      <pointLight color="#ff7a1f" distance={7.4} intensity={2.85} position={[0, 1.08, 0]} />
      <group ref={flameRef} position={[0, 1.05, 0]}>
        <mesh>
          <coneGeometry args={[0.18, 0.62, 18]} />
          <meshBasicMaterial color="#ff6a00" transparent opacity={0.86} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <coneGeometry args={[0.1, 0.42, 18]} />
          <meshBasicMaterial color="#ffd05a" transparent opacity={0.78} />
        </mesh>
      </group>
    </group>
  );
}

export default FireArena;
