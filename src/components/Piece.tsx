type PieceProps = {
  type: string;
  color: "white" | "black";
  position: [number, number, number];
  onPress?: () => void;
};

// ACL: Simple 3D chess piece placeholder before we upgrade to realistic models
function Piece({ type, color, position, onPress }: PieceProps) {
  const pieceColor = color === "white" ? "#eeeeee" : "#222222";

  const heightMap: Record<string, number> = {
    p: 0.45,
    r: 0.7,
    n: 0.75,
    b: 0.8,
    q: 0.95,
    k: 1.05,
  };

  return (
    <group
      position={position}
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
