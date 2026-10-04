"use client";

import { useEffect, useRef, useState, type MutableRefObject, type PointerEvent as REPointer } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "./Environment.tsx";
import { Hud } from "./Hud.tsx";
import { Player } from "./Player.tsx";
import { unlockAudio } from "./audio.ts";
import { useGame } from "./store.ts";
import { CAM_FOV, camOffset, defaultCam } from "./camera.ts";

export function Wayfarer() {
  const [mounted, setMounted] = useState(false);
  const started = useGame((s) => s.started);
  const joystick = useRef({ x: 0, y: 0 });

  useEffect(() => {
    useGame.getState().hydrate();
    setMounted(true);
  }, []);

  return (
    <div className="wf-root">
      {mounted && <GameCanvas joystick={joystick} />}
      <Hud />
      <Joystick joystick={joystick} visible={started} />
      {!started && <StartScreen />}
    </div>
  );
}

function GameCanvas({
  joystick,
}: {
  joystick: MutableRefObject<{ x: number; y: number }>;
}) {
  const off = camOffset(defaultCam());
  return (
    <div className="wf-canvas">
      <Canvas
        camera={{
          fov: CAM_FOV,
          near: 0.12,
          far: 360,
          position: [off.x, off.y + 1.5, off.z],
        }}
        shadows
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 1.5, 0);
        }}
        style={{ background: "#7eb4d8" }}
      >
        <color attach="background" args={["#7eb4d8"]} />
        <fog attach="fog" args={["#8eb8d4", 72, 165]} />
        <hemisphereLight args={["#eef4ff", "#3d6a32", 0.72]} />
        <directionalLight
          castShadow
          position={[22, 38, 16]}
          intensity={1.55}
          color="#fff4d8"
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
          shadow-camera-near={1}
          shadow-camera-far={90}
        />
        <directionalLight position={[-16, 14, -12]} intensity={0.42} color="#b4d0ff" />
        <Environment />
        <Player joystick={joystick} />
      </Canvas>
    </div>
  );
}

function StartScreen() {
  return (
    <div className="wf-start">
      <div className="wf-start-copy">
        <div className="text-[11px] tracking-[0.42em] uppercase text-parchment-dim">Keep the Codex</div>
        <h1>Reedhaven</h1>
        <div className="wf-rule" />
        <p className="max-w-md text-sm leading-relaxed text-parchment-dim">
          One realm. Halden holds the Quiet Tithe. Four trails leave the fountain — shore, rise, gate, and
          bridge. Speak. Gather. Bind. Light the lantern.
        </p>
        <button
          type="button"
          className="wf-btn mt-8"
          onClick={() => {
            unlockAudio();
            useGame.getState().start();
          }}
        >
          Walk
        </button>
        <p className="mt-6 text-[11px] tracking-wide text-parchment-dim">
          WASD · drag look · scroll zoom · close in to work a node
        </p>
      </div>
    </div>
  );
}

function Joystick({
  joystick,
  visible,
}: {
  joystick: MutableRefObject<{ x: number; y: number }>;
  visible: boolean;
}) {
  if (!visible) return null;
  const hold = (x: number, y: number) => (e: REPointer) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    joystick.current.x = x;
    joystick.current.y = y;
  };
  const end = () => {
    joystick.current.x = 0;
    joystick.current.y = 0;
  };
  const tapE = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE" }));
    window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyE" }));
  };
  return (
    <div className="wf-pad">
      <button type="button" className="wf-pad-key wf-pad-w" onPointerDown={hold(0, -1)} onPointerUp={end} onPointerCancel={end}>
        W
      </button>
      <button type="button" className="wf-pad-key wf-pad-a" onPointerDown={hold(-1, 0)} onPointerUp={end} onPointerCancel={end}>
        A
      </button>
      <button type="button" className="wf-pad-key wf-pad-e" onPointerDown={tapE}>
        E
      </button>
      <button type="button" className="wf-pad-key wf-pad-d" onPointerDown={hold(1, 0)} onPointerUp={end} onPointerCancel={end}>
        D
      </button>
      <button type="button" className="wf-pad-key wf-pad-s" onPointerDown={hold(0, 1)} onPointerUp={end} onPointerCancel={end}>
        S
      </button>
    </div>
  );
}
