import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { Group } from "three";
import { Quaternion, Vector3 } from "three";
import type { AttackEffectKind } from "./Board";

type AttackTrailKind = Exclude<AttackEffectKind, "move">;

type AttackTrailProps = {
  from: [number, number, number];
  to: [number, number, number];
  kind: AttackTrailKind;
  onDone: () => void;
};

const trailProfiles: Record<
  AttackTrailKind,
  {
    color: string;
    accent: string;
    duration: number;
    radius: number;
    light: number;
  }
> = {
  sparks: {
    color: "#ffe66d",
    accent: "#ffffff",
    duration: 0.48,
    radius: 0.026,
    light: 2.6,
  },
  arcane: {
    color: "#57f7ff",
    accent: "#d975ff",
    duration: 0.58,
    radius: 0.034,
    light: 3.8,
  },
  shockwave: {
    color: "#ffb85a",
    accent: "#fff2cc",
    duration: 0.62,
    radius: 0.044,
    light: 4.4,
  },
  inferno: {
    color: "#ff4b1f",
    accent: "#ffd166",
    duration: 0.72,
    radius: 0.052,
    light: 5.4,
  },
  royal: {
    color: "#ff244f",
    accent: "#ffe870",
    duration: 0.86,
    radius: 0.064,
    light: 6.8,
  },
};

function AttackTrail({ from, to, kind, onDone }: AttackTrailProps) {
  const groupRef = useRef<Group>(null);
  const isDoneRef = useRef(false);
  const [age, setAge] = useState(0);
  const profile = trailProfiles[kind];
  const path = useMemo(() => {
    const start = new Vector3(from[0], from[1] + 0.6, from[2]);
    const end = new Vector3(to[0], to[1] + 0.72, to[2]);
    const direction = end.clone().sub(start);
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const length = direction.length();
    const quaternion = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      direction.clone().normalize(),
    );

    return {
      length,
      midpoint: midpoint.toArray() as [number, number, number],
      quaternion,
    };
  }, [from, to]);
  const embers = useMemo(
    () =>
      Array.from({ length: kind === "royal" ? 16 : 10 }, (_, index) => ({
        offset: index / (kind === "royal" ? 15 : 9),
        drift: (Math.random() - 0.5) * 0.16,
        size: profile.radius * (1.2 + Math.random() * 1.4),
      })),
    [kind, profile.radius],
  );

  useFrame((_, delta) => {
    const nextAge = age + delta;
    setAge(nextAge);

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (kind === "arcane" ? 4.2 : 2.6);
    }

    if (nextAge > profile.duration && !isDoneRef.current) {
      isDoneRef.current = true;
      onDone();
    }
  });

  const progress = Math.min(1, age / profile.duration);
  const opacity = Math.max(0, 1 - progress);
  const beamLength = path.length * Math.max(0.05, progress);
  const beamOffset = (path.length - beamLength) / 2;

  return (
    <group ref={groupRef} position={path.midpoint} quaternion={path.quaternion}>
      <pointLight color={profile.color} distance={3.4} intensity={profile.light * opacity} />
      <mesh position={[0, -beamOffset, 0]}>
        <cylinderGeometry args={[profile.radius, profile.radius * 1.8, beamLength, 14]} />
        <meshBasicMaterial color={profile.color} transparent opacity={opacity * 0.72} />
      </mesh>
      <mesh position={[0, -beamOffset, 0]}>
        <cylinderGeometry args={[profile.radius * 2.6, profile.radius * 4, beamLength, 14]} />
        <meshBasicMaterial color={profile.accent} transparent opacity={opacity * 0.18} />
      </mesh>
      {embers.map((ember, index) => {
        const emberY = -path.length / 2 + path.length * Math.min(1, ember.offset + progress * 0.45);

        return (
          <mesh
            key={index}
            position={[
              Math.sin((index + progress * 8) * 1.9) * ember.drift,
              emberY,
              Math.cos((index + progress * 7) * 1.7) * ember.drift,
            ]}
          >
            <sphereGeometry args={[ember.size, 10, 8]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? profile.color : profile.accent}
              transparent
              opacity={opacity}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default AttackTrail;
