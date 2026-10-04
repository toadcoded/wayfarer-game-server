import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Character } from "./Character";
import { useGame } from "./store";
import {
  BIOME_LABEL,
  WATER_LEVEL,
  getWorld,
  sampleBiome,
  sampleHeight,
} from "./world";

const walkSpeed = 7.2;
const runSpeed = 11.4;
const turnFace = 10;
const camDist = 22;
const camHeight = 18;
const persistEvery = 2.4;

type Probe = {
  getYaw: () => number;
  getSpeed: () => number;
  setKeys: (codes: string[]) => void;
};

declare global {
  interface Window {
    __controlsTest?: Probe;
    __wayfarerStick?: { x: number; z: number; run: boolean };
  }
}

const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const _look = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

export function Player() {
  const group = useRef<THREE.Group>(null);
  const keys = useRef(new Set<string>());
  const override = useRef<Set<string> | null>(null);
  const target = useRef<THREE.Vector3 | null>(null);
  const orbit = useRef(Math.PI * 0.25);
  const zoom = useRef(1);
  const yaw = useRef(useGame.getState().yaw);
  const hp = useRef(useGame.getState().hp);
  const stamina = useRef(useGame.getState().stamina);
  const persistT = useRef(0);
  const speedRef = useRef(0);
  const walkAmt = useRef(0);
  const dragging = useRef(false);
  const { camera, gl } = useThree();
  const world = getWorld();

  useEffect(() => {
    const held = keys.current;
    const down = (e: KeyboardEvent) => {
      held.add(e.code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === "Escape") useGame.getState().pause();
    };
    const up = (e: KeyboardEvent) => held.delete(e.code);
    const blur = () => held.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", blur);

    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      if (e.button === 2 || e.button === 1) dragging.current = true;
    };
    const onUp = () => {
      dragging.current = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      orbit.current -= e.movementX * 0.005;
    };
    const onWheel = (e: WheelEvent) => {
      zoom.current = Math.max(0.65, Math.min(1.55, zoom.current + e.deltaY * 0.0012));
    };
    const onContext = (e: Event) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(mx, my), camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hit = new THREE.Vector3();
      if (!ray.ray.intersectPlane(plane, hit)) return;
      for (let i = 0; i < 4; i++) {
        const y = sampleHeight(world.heights, hit.x, hit.z);
        plane.constant = -y;
        if (!ray.ray.intersectPlane(plane, hit)) break;
      }
      target.current = hit.clone();
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("contextmenu", onContext);
    el.addEventListener("click", onClick);

    window.__controlsTest = {
      getYaw: () => yaw.current,
      getSpeed: () => speedRef.current,
      setKeys: (codes: string[]) => {
        override.current = codes.length ? new Set(codes) : null;
      },
    };

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", blur);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("contextmenu", onContext);
      el.removeEventListener("click", onClick);
      delete window.__controlsTest;
    };
  }, [camera, gl, world.heights]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const state = useGame.getState();
    if (!state.started || state.paused) {
      walkAmt.current = 0;
      return;
    }
    const g = group.current;
    if (!g) return;

    const src = override.current ?? keys.current;
    const joy = window.__wayfarerStick ?? { x: 0, z: 0, run: false };
    let ix = joy.x;
    let iz = joy.z;
    if (src.has("KeyA") || src.has("ArrowLeft")) ix -= 1;
    if (src.has("KeyD") || src.has("ArrowRight")) ix += 1;
    if (src.has("KeyW") || src.has("ArrowUp")) iz -= 1;
    if (src.has("KeyS") || src.has("ArrowDown")) iz += 1;

    const camYaw = orbit.current;
    _fwd.set(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    _right.set(Math.cos(camYaw), 0, -Math.sin(camYaw));

    _move.set(0, 0, 0);
    if (ix !== 0 || iz !== 0) {
      target.current = null;
      _move.addScaledVector(_right, ix);
      _move.addScaledVector(_fwd, -iz);
      if (_move.lengthSq() > 0) _move.normalize();
    } else if (target.current) {
      _move.set(target.current.x - g.position.x, 0, target.current.z - g.position.z);
      if (_move.lengthSq() < 0.6) {
        target.current = null;
        _move.set(0, 0, 0);
      } else {
        _move.normalize();
      }
    }

    const running = src.has("ShiftLeft") || src.has("ShiftRight") || joy.run;
    const want = _move.lengthSq() > 0;
    stamina.current = THREE.MathUtils.clamp(
      stamina.current - (running && want ? 0.22 * dt : -0.16 * dt),
      0,
      1,
    );
    const canRun = running && stamina.current > 0.05;
    const inWater = sampleBiome(world.biomes, g.position.x, g.position.z) === "water";
    const spd = (canRun ? runSpeed : walkSpeed) * (inWater ? 0.45 : 1);
    speedRef.current = want ? spd : 0;
    walkAmt.current = want ? (canRun ? 1 : 0.7) : 0;

    if (want) {
      const desiredYaw = Math.atan2(-_move.x, -_move.z);
      let dy = desiredYaw - yaw.current;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      yaw.current += dy * Math.min(1, turnFace * dt);
      g.rotation.y = yaw.current;

      const nx = g.position.x + _move.x * spd * dt;
      const nz = g.position.z + _move.z * spd * dt;
      const h = sampleHeight(world.heights, nx, nz);
      if (h - g.position.y < 2.4) {
        g.position.x = nx;
        g.position.z = nz;
      }
    }

    const ground = sampleHeight(world.heights, g.position.x, g.position.z);
    g.position.y = THREE.MathUtils.damp(g.position.y, ground, 12, dt);

    if (ground < WATER_LEVEL - 0.15) {
      hp.current = Math.max(0.35, hp.current - 0.04 * dt);
    } else {
      hp.current = Math.min(1, hp.current + 0.03 * dt);
    }

    const dist = camDist * zoom.current;
    const height = camHeight * zoom.current;
    _desired.set(
      g.position.x + Math.sin(orbit.current) * dist,
      g.position.y + height,
      g.position.z + Math.cos(orbit.current) * dist,
    );
    camera.position.lerp(_desired, 1 - Math.exp(-4.5 * dt));
    _look.set(g.position.x, g.position.y + 1.2, g.position.z);
    camera.lookAt(_look);
    camera.up.copy(_up);

    const biome = BIOME_LABEL[sampleBiome(world.biomes, g.position.x, g.position.z)];
    state.setPose(g.position.x, g.position.z, yaw.current, speedRef.current, biome);
    state.setVitals(hp.current, stamina.current);
    state.markTile(g.position.x, g.position.z);

    for (const lm of world.landmarks) {
      const dx = g.position.x - lm.x;
      const dz = g.position.z - lm.z;
      if (dx * dx + dz * dz < lm.radius * lm.radius) {
        state.walkLandmark(lm.id, lm.arrive);
      }
    }

    const dxn = g.position.x - world.npc.x;
    const dzn = g.position.z - world.npc.z;
    if (dxn * dxn + dzn * dzn < 16 && state.talkReady) {
      useGame.setState({ talkReady: false });
      state.pushLog("A wanderer: the highland keeps four shores. Touch each.");
    }

    for (const p of state.remainingPickups) {
      const dx = g.position.x - p.x;
      const dz = g.position.z - p.z;
      if (dx * dx + dz * dz < 2.2) state.gather(p.id, p.kind);
    }

    persistT.current += dt;
    if (persistT.current > persistEvery) {
      persistT.current = 0;
      state.persist();
    }
  });

  const start = useGame.getState();
  const y0 = sampleHeight(world.heights, start.x, start.z);

  return (
    <group ref={group} position={[start.x, y0, start.z]} rotation={[0, start.yaw, 0]}>
      <Character walkRef={walkAmt} />
    </group>
  );
}
