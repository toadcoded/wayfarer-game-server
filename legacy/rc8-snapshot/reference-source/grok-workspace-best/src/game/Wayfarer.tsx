import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lights } from "./Environment";
import { Hud } from "./Hud";
import { Player } from "./Player";
import { useGame } from "./store";

export function Wayfarer() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    useGame.getState().hydrate();
    setMounted(true);
  }, []);

  return (
    <div className="relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-sky">
      {mounted ? (
        <Canvas
          camera={{ position: [18, 20, 18], fov: 42, near: 0.4, far: 420 }}
          dpr={[1, 1.5]}
          shadows
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.setClearColor("#8fb4c6");
            gl.domElement.style.touchAction = "none";
          }}
        >
          <Lights />
          <Environment />
          <Player />
        </Canvas>
      ) : (
        <div className="absolute inset-0 bg-sky" />
      )}
      <Hud />
    </div>
  );
}
