"use client";

import { useEffect, useRef, useState, type MutableRefObject, type PointerEvent as REPointer } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "./Environment.tsx";
import { Hud } from "./Hud.tsx";
import { Player } from "./Player.tsx";
import { unlockAudio } from "./audio.ts";
import { useGame } from "./store.ts";
import { ISO_DIST, isoOffset } from "./iso.ts";

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
  const off = isoOffset(ISO_DIST);
  return (
    <div className="wf-canvas">
      <Canvas
        orthographic
        camera={{
          position: [off.x, off.y, off.z],
          zoom: 1,
          near: -200,
          far: 500,
        }}
        shadows
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 1, 0);
        }}
        style={{ background: "#8fa08c" }}
      >
        <color attach="background" args={["#8fa08c"]} />
        <fog attach="fog" args={["#9aab9a", 55, 160]} />
        <hemisphereLight args={["#d7e4ef", "#3d4a32", 0.72]} />
        <directionalLight
          castShadow
          position={[40, 70, 18]}
          intensity={1.55}
          color="#ffe6c4"
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-36}
          shadow-camera-right={36}
          shadow-camera-top={36}
          shadow-camera-bottom={-36}
          shadow-camera-near={1}
          shadow-camera-far={180}
        />
        <Environment />
        <Player joystick={joystick} />
      </Canvas>
    </div>
  );
}

function StartScreen() {
  return (
    <div className="wf-start">
      <div className="text-[11px] tracking-[0.42em] uppercase text-parchment-dim">Highland atlas</div>
      <h1>Wayfarer</h1>
      <div className="wf-rule" />
      <p className="max-w-md text-sm leading-relaxed text-parchment-dim">
        Choose your path. Four trails leave the crossroads — shore, rise, gate, and bridge.
        Walk them. The highland keeps what you find.
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
        WASD · click to path · E talk · Shift run
      </p>
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
  const root = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);

  if (!visible) return null;

  const setFrom = (clientX: number, clientY: number) => {
    const el = root.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = (clientX - cx) / (r.width / 2);
    let dy = (clientY - cy) / (r.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    joystick.current.x = dx;
    joystick.current.y = dy;
    if (knob.current) {
      knob.current.style.transform = `translate(calc(-50% + ${dx * 28}px), calc(-50% + ${dy * 28}px))`;
    }
  };

  const end = () => {
    pid.current = null;
    joystick.current.x = 0;
    joystick.current.y = 0;
    if (knob.current) knob.current.style.transform = "translate(-50%, -50%)";
  };

  const onDown = (e: REPointer) => {
    pid.current = e.pointerId;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setFrom(e.clientX, e.clientY);
  };
  const onMove = (e: REPointer) => {
    if (pid.current !== e.pointerId) return;
    setFrom(e.clientX, e.clientY);
  };

  return (
    <div
      ref={root}
      className="wf-joy sm:hidden"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div ref={knob} className="wf-joy-knob" />
    </div>
  );
}
