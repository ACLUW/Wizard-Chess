import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import "./App.css";
import Board from "./components/Board";

function App() {
  const [gameStatus, setGameStatus] = useState("White to move");

  return (
    <main className="game-page">
      <section className="hero-panel">
        <p className="eyebrow">ACL Arena</p>
        <h1>3D Chess</h1>
        <p>{gameStatus}</p>
      </section>

      <section className="game-stage">
        <Canvas camera={{ position: [0, 6.8, 7.5], fov: 34 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 6, 4]} intensity={1.4} />
          <pointLight position={[-4, 3, -4]} intensity={1.2} color="#41e8ff" />
          <Board onStatusChange={setGameStatus} />
          <OrbitControls enablePan={false} />
        </Canvas>
      </section>

      <section className="control-hint">
        Tap or click one of your pieces, then tap a highlighted square. Pawn captures
        spark; bigger captures explode.
      </section>
    </main>
  );
}

export default App;
