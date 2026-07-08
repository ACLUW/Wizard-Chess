import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { Group } from "three";

type CaptureEffectProps = {
  kind: "sparks" | "arcane" | "shockwave" | "inferno" | "royal";
  position: [number, number, number];
  onDone: () => void;
};

const effectProfiles = {
  sparks: {
    particleCount: 14,
    burst: 0.46,
    duration: 0.7,
    coreSize: 0.2,
    ringSize: 0.28,
    mainColor: "#ffe66d",
    accentColor: "#ffffff",
    smokeColor: "#f6c66b",
    light: 4.2,
  },
  arcane: {
    particleCount: 20,
    burst: 0.62,
    duration: 0.9,
    coreSize: 0.25,
    ringSize: 0.34,
    mainColor: "#57f7ff",
    accentColor: "#d975ff",
    smokeColor: "#7452ff",
    light: 6,
  },
  shockwave: {
    particleCount: 24,
    burst: 0.8,
    duration: 1,
    coreSize: 0.3,
    ringSize: 0.42,
    mainColor: "#ffb85a",
    accentColor: "#ffffff",
    smokeColor: "#7a5b46",
    light: 7.5,
  },
  inferno: {
    particleCount: 32,
    burst: 0.95,
    duration: 1.1,
    coreSize: 0.38,
    ringSize: 0.5,
    mainColor: "#ff4b1f",
    accentColor: "#ffd166",
    smokeColor: "#3d1c16",
    light: 9,
  },
  royal: {
    particleCount: 44,
    burst: 1.18,
    duration: 1.35,
    coreSize: 0.48,
    ringSize: 0.62,
    mainColor: "#ff244f",
    accentColor: "#ffe870",
    smokeColor: "#5c1b39",
    light: 12,
  },
} as const;

function CaptureEffect({ kind, position, onDone }: CaptureEffectProps) {
  const groupRef = useRef<Group>(null);
  const isDoneRef = useRef(false);
  const [age, setAge] = useState(0);
  const profile = effectProfiles[kind];

  const particles = useMemo(
    () =>
      Array.from({ length: profile.particleCount }, (_, index) => {
        const angle = (index / profile.particleCount) * Math.PI * 2;
        const height = 0.18 + Math.random() * (kind === "shockwave" ? 0.35 : 0.9);
        const spiral = index % 3 === 0 ? 1.25 : 1;

        return {
          offset: [
            Math.cos(angle) * profile.burst * spiral,
            height,
            Math.sin(angle) * profile.burst * spiral,
          ] as [number, number, number],
          size: 0.035 + Math.random() * (kind === "sparks" ? 0.035 : 0.08),
        };
      }),
    [kind, profile],
  );

  useFrame((_, delta) => {
    const nextAge = age + delta;
    setAge(nextAge);

    if (groupRef.current) {
      groupRef.current.scale.setScalar(1 + nextAge * (kind === "royal" ? 1.85 : 1.45));
      groupRef.current.rotation.y += delta * (kind === "arcane" ? 5.2 : 3);
    }

    if (nextAge > profile.duration && !isDoneRef.current) {
      isDoneRef.current = true;
      onDone();
    }
  });

  const opacity = Math.max(0, 1 - age / profile.duration);
  const impactLift = Math.min(age * 1.15, 0.9);
  const ringExpansion = age * (kind === "royal" ? 2.3 : 1.7);

  return (
    <group ref={groupRef} position={position}>
      <pointLight color={profile.mainColor} intensity={profile.light * opacity} distance={5.4} />

      <mesh position={[0, 0.32 + impactLift * 0.18, 0]}>
        <sphereGeometry args={[profile.coreSize, 28, 24]} />
        <meshBasicMaterial color={profile.mainColor} transparent opacity={opacity * 0.58} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[profile.ringSize + ringExpansion, profile.ringSize + 0.08 + ringExpansion * 1.12, 48]} />
        <meshBasicMaterial color={profile.accentColor} transparent opacity={opacity * 0.72} />
      </mesh>

      {kind !== "sparks" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.075, 0]}>
          <ringGeometry args={[0.18 + age * 0.8, 0.2 + age * 1.3, 5]} />
          <meshBasicMaterial color={profile.mainColor} transparent opacity={opacity * 0.45} />
        </mesh>
      )}

      <mesh position={[0, 0.5 + impactLift * 0.35, 0]}>
        <sphereGeometry args={[profile.coreSize * 1.35 + age * 0.22, 18, 14]} />
        <meshBasicMaterial color={profile.smokeColor} transparent opacity={opacity * 0.18} />
      </mesh>

      {particles.map((particle, index) => (
        <mesh
          key={index}
          position={[
            particle.offset[0] * (1 + age * 0.45),
            particle.offset[1] + impactLift,
            particle.offset[2] * (1 + age * 0.45),
          ]}
        >
          <sphereGeometry args={[particle.size, 12, 12]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? profile.mainColor : profile.accentColor}
            transparent
            opacity={opacity}
          />
        </mesh>
      ))}
    </group>
  );
}

export default CaptureEffect;
