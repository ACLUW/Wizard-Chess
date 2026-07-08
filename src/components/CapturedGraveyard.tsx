import { Text } from "@react-three/drei";
import type { CapturedPiece } from "./Board";
import Piece from "./Piece";

type CapturedGraveyardProps = {
  captures: CapturedPiece[];
};

const laneConfig = {
  w: {
    label: "White Fallen",
    labelPosition: [-5.65, 0.18, -4.45] as [number, number, number],
    baseX: -5.75,
    color: "white",
    textColor: "#ffffff",
  },
  b: {
    label: "Black Fallen",
    labelPosition: [5.65, 0.18, -4.45] as [number, number, number],
    baseX: 5.75,
    color: "black",
    textColor: "#57f7ff",
  },
} as const;

function CapturedGraveyard({ captures }: CapturedGraveyardProps) {
  const whiteCaptures = captures.filter((piece) => piece.color === "w");
  const blackCaptures = captures.filter((piece) => piece.color === "b");

  return (
    <>
      <GraveyardLane captures={whiteCaptures} side="w" />
      <GraveyardLane captures={blackCaptures} side="b" />
    </>
  );
}

function GraveyardLane({
  captures,
  side,
}: {
  captures: CapturedPiece[];
  side: "w" | "b";
}) {
  const config = laneConfig[side];

  return (
    <group>
      <Text
        color={config.textColor}
        fontSize={0.18}
        position={config.labelPosition}
        rotation={[-Math.PI / 2, 0, side === "w" ? Math.PI / 2 : -Math.PI / 2]}
      >
        {config.label}
      </Text>

      {captures.slice(0, 16).map((piece, index) => {
        const row = Math.floor(index / 2);
        const column = index % 2;
        const x = config.baseX + (side === "w" ? -column * 0.58 : column * 0.58);
        const z = 3.25 - row * 0.78;

        return (
          <group key={`${piece.color}-${piece.type}-${index}`} position={[x, 0, z]} scale={[0.48, 0.48, 0.48]}>
            <mesh position={[0, 0.035, 0]}>
              <cylinderGeometry args={[0.42, 0.46, 0.07, 32]} />
              <meshStandardMaterial
                color={side === "w" ? "#e8ded0" : "#1a1110"}
                emissive={side === "w" ? "#fff3d0" : "#ff6a1f"}
                emissiveIntensity={side === "w" ? 0.04 : 0.08}
                metalness={0.02}
                roughness={0.48}
              />
            </mesh>
            <Piece
              color={config.color}
              position={[0, 0.08, 0]}
              type={piece.type}
            />
          </group>
        );
      })}
    </group>
  );
}

export default CapturedGraveyard;
