import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { Group } from "three";

type CaptureEffectProps = {
  kind: "sparks" | "fire";
  position: [number, number, number];
  onDone: () => void;
};

function CaptureEffect({ kind, position, onDone }: CaptureEffectProps) {
  const groupRef = useRef<Group>(null);
  const isDoneRef = useRef(false);
  const [age, setAge] = useState(0);

  const particles = useMemo(
    () =>
      Array.from({ length: kind === "fire" ? 18 : 12 }, (_, index) => {
        const angle = (index / (kind === "fire" ? 18 : 12)) * Math.PI * 2;
        const burst = kind === "fire" ? 0.75 : 0.45;

        return {
          offset: [
            Math.cos(angle) * burst,
            0.25 + Math.random() * 0.75,
            Math.sin(angle) * burst,
          ] as [number, number, number],
          size: kind === "fire" ? 0.09 + Math.random() * 0.08 : 0.045,
        };
      }),
    [kind],
  );

  useFrame((_, delta) => {
    const nextAge = age + delta;
    setAge(nextAge);

    if (groupRef.current) {
      groupRef.current.scale.setScalar(1 + nextAge * 1.5);
      groupRef.current.rotation.y += delta * 3;
    }

    if (nextAge > 0.8 && !isDoneRef.current) {
      isDoneRef.current = true;
      onDone();
    }
  });

  const opacity = Math.max(0, 1 - age / 0.8);
  const mainColor = kind === "fire" ? "#ff4b1f" : "#ffe66d";
  const accentColor = kind === "fire" ? "#ffd166" : "#ffffff";

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[kind === "fire" ? 0.34 : 0.2, 24, 24]} />
        <meshBasicMaterial color={mainColor} transparent opacity={opacity * 0.55} />
      </mesh>

      {particles.map((particle, index) => (
        <mesh key={index} position={particle.offset}>
          <sphereGeometry args={[particle.size, 12, 12]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? mainColor : accentColor}
            transparent
            opacity={opacity}
          />
        </mesh>
      ))}
    </group>
  );
}

export default CaptureEffect;
