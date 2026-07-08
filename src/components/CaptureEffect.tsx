import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { Group } from "three";

type CaptureEffectProps = {
  kind: "sparks" | "arcane" | "shockwave" | "inferno" | "royal";
  intensity?: number;
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

function CaptureEffect({ intensity = 0, kind, position, onDone }: CaptureEffectProps) {
  const groupRef = useRef<Group>(null);
  const isDoneRef = useRef(false);
  const [age, setAge] = useState(0);
  const profile = effectProfiles[kind];
  const fireballPower = Math.max(0, intensity - 0.34);
  const isMajorCapture = fireballPower > 0;
  const duration = profile.duration + fireballPower * 1.25;

  const particles = useMemo(
    () =>
      Array.from({ length: profile.particleCount }, (_, index) => {
        const angle = (index / profile.particleCount) * Math.PI * 2;
        const height = 0.18 + Math.random() * (kind === "shockwave" ? 0.35 : 0.9 + fireballPower);
        const spiral = index % 3 === 0 ? 1.25 : 1;

        return {
          offset: [
            Math.cos(angle) * profile.burst * spiral,
            height,
            Math.sin(angle) * profile.burst * spiral,
          ] as [number, number, number],
          size: 0.035 + Math.random() * (kind === "sparks" ? 0.035 : 0.08 + fireballPower * 0.06),
        };
      }),
    [fireballPower, kind, profile],
  );

  useFrame((_, delta) => {
    const nextAge = age + delta;
    setAge(nextAge);

    if (groupRef.current) {
      groupRef.current.scale.setScalar(1 + nextAge * (kind === "royal" ? 1.85 : 1.45) * (1 + fireballPower * 0.35));
      groupRef.current.rotation.y += delta * (kind === "arcane" ? 5.2 : 3) * (isMajorCapture ? 0.58 : 1);
    }

    if (nextAge > duration && !isDoneRef.current) {
      isDoneRef.current = true;
      onDone();
    }
  });

  const progress = Math.min(1, age / duration);
  const opacity = Math.max(0, 1 - progress);
  const slowMotionBloom = isMajorCapture ? Math.sin(progress * Math.PI) : 0;
  const impactLift = Math.min(age * (isMajorCapture ? 0.75 : 1.15), 0.9 + fireballPower * 0.4);
  const ringExpansion = age * (kind === "royal" ? 2.3 : 1.7) * (1 + fireballPower * 0.4);
  const fireballSize = profile.coreSize * (1.55 + fireballPower * 1.25) + slowMotionBloom * 0.35;

  return (
    <group ref={groupRef} position={position}>
      <pointLight
        color={profile.mainColor}
        intensity={profile.light * opacity * (1 + fireballPower * 1.6)}
        distance={5.4 + fireballPower * 3.2}
      />

      <mesh position={[0, 0.32 + impactLift * 0.18, 0]}>
        <sphereGeometry args={[profile.coreSize, 28, 24]} />
        <meshBasicMaterial color={profile.mainColor} transparent opacity={opacity * 0.58} />
      </mesh>

      {isMajorCapture && (
        <>
          <mesh position={[0, 0.78 + impactLift * 0.3, 0]}>
            <sphereGeometry args={[fireballSize, 36, 28]} />
            <meshBasicMaterial color="#ff4b1f" transparent opacity={opacity * 0.48} />
          </mesh>
          <mesh position={[0, 0.8 + impactLift * 0.34, 0]}>
            <sphereGeometry args={[fireballSize * 0.62, 28, 20]} />
            <meshBasicMaterial color="#ffd166" transparent opacity={opacity * 0.7} />
          </mesh>
          <mesh position={[0, 0.82 + impactLift * 0.38, 0]}>
            <sphereGeometry args={[fireballSize * 0.28, 18, 14]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.58} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const angle = (index / 6) * Math.PI * 2 + age * 0.55;

            return (
              <mesh
                key={`flame-${index}`}
                position={[
                  Math.cos(angle) * fireballSize * 0.72,
                  0.82 + impactLift * 0.42 + Math.sin(age * 2 + index) * 0.06,
                  Math.sin(angle) * fireballSize * 0.72,
                ]}
                rotation={[Math.PI / 2, 0, -angle]}
              >
                <coneGeometry args={[0.08 + fireballPower * 0.08, 0.55 + fireballPower * 0.42, 8]} />
                <meshBasicMaterial color={index % 2 === 0 ? "#ff7a1f" : "#ffd166"} transparent opacity={opacity * 0.62} />
              </mesh>
            );
          })}
        </>
      )}

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
