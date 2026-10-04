import { useEffect, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Character } from "./Character.tsx";
import { footstep, gatherChime } from "./audio.ts";
import {
  CAM_LOOK_Y,
  CAM_PITCH0,
  CAM_DIST0,
  CAM_SHOULDER,
  applyOrbit,
  applyZoom,
  camAxes,
  camOffset,
  liveCam,
} from "./camera.ts";
import { GAME_TICK_MS, canTravel, findPath } from "./osrs-codec.ts";
import { useGame } from "./store.ts";
import {
  CROSSROADS,
  FOLK,
  HALF,
  LANDMARKS,
  WATER_LEVEL,
  getWorld,
  nearestNode,
  sampleBiome,
  sampleGround,
  tileCenter,
  worldToTile,
  type ResourceNode,
} from "./world.ts";

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
    };
    __wayfarer?: {
      getTile: () => { tx: number; tz: number };
      teleport: (tx: number, tz: number) => void;
      getTick: () => number;
    };
  }
}

const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _look = new THREE.Vector3();

const WALK = 6.4;
const RUN = 10.2;

/** Module-level so HMR / effect rebinds cannot drop a QA key hold. */
let qaHold: string[] | null = null;

export function Player({
  joystick,
}: {
  joystick: MutableRefObject<{ x: number; y: number }>;
}) {
  const group = useRef<THREE.Group>(null);
  const walking = useRef(false);
  const speedRef = useRef(0);
  const yawRef = useRef(0);
  const keys = useRef(new Set<string>());
  const clickPath = useRef<{ x: number; z: number }[]>([]);
  const target = useRef<THREE.Vector3 | null>(null);
  const pendingGather = useRef<ResourceNode | null>(null);
  const tickAcc = useRef(0);
  const poseAcc = useRef(0);
  const stepAcc = useRef(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef({ x: 0, y: 0, moved: 0, orbit: false, pinch0: 0 });
  const { camera, gl, scene, clock } = useThree();
  const world = getWorld();
  const ray = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());

  useEffect(() => {
    const st = useGame.getState();
    const g = group.current!;
    const x = st.x;
    const z = st.z;
    const y = sampleGround(world, x, z);
    g.position.set(x, y, z);
    yawRef.current = st.yaw || Math.PI / 4;
    g.rotation.y = yawRef.current;

    const onDown = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === "Escape") useGame.getState().setPaused(!useGame.getState().paused);
      if (e.code === "KeyE") tryInteract(g.position, pendingGather);
      if (e.code === "Digit1") useGame.getState().setPanel("quest");
      if (e.code === "Digit2") useGame.getState().setPanel("pack");
      if (e.code === "Digit3") useGame.getState().setPanel("skills");
      if (e.code === "Digit4") useGame.getState().setPanel("codex");
      if (e.code === "Equal" || e.code === "NumpadAdd") applyZoom(-180);
      if (e.code === "Minus" || e.code === "NumpadSubtract") applyZoom(180);
      if (e.code === "KeyR") {
        liveCam.chase = true;
        liveCam.pitch = CAM_PITCH0;
        liveCam.dist = CAM_DIST0;
      }
    };
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    const clear = () => keys.current.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", clear);

    const onVis = () => {
      if (document.hidden) {
        clear();
        useGame.getState().setPose(
          g.position.x,
          g.position.z,
          yawRef.current,
          sampleBiome(world, g.position.x, g.position.z),
        );
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const hitGround = (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      ray.current.setFromCamera(pointer.current, camera);
      const terrain = scene.getObjectByName("terrain");
      if (terrain) {
        const hits = ray.current.intersectObject(terrain, false);
        if (hits[0]) return hits[0].point;
      }
      const origin = ray.current.ray.origin;
      const dir = ray.current.ray.direction;
      if (Math.abs(dir.y) < 1e-4) return null;
      const planeY = sampleGround(world, g.position.x, g.position.z);
      const tHit = (planeY - origin.y) / dir.y;
      if (tHit < 0) return null;
      return new THREE.Vector3(origin.x + dir.x * tHit, planeY, origin.z + dir.z * tHit);
    };

    const issuePath = (hx: number, hz: number) => {
      const node = nearestNode(world, hx, hz, 3.6);
      if (node && Math.hypot(g.position.x - tileCenter(node.tx), g.position.z - tileCenter(node.tz)) < 3.4) {
        if (useGame.getState().gather(node)) gatherChime();
        pendingGather.current = null;
        return;
      }
      pendingGather.current = node;
      const start = worldToTile(g.position.x, g.position.z);
      const hit = worldToTile(hx, hz);
      const goal = node ? { x: node.tx, y: node.tz } : { x: hit.tx, y: hit.tz };
      const path = findPath(world.collision, { x: start.tx, y: start.tz }, goal);
      clickPath.current = path.map((p) => ({
        x: tileCenter(p.x),
        z: tileCenter(p.y),
      }));
      target.current = clickPath.current.length
        ? new THREE.Vector3(clickPath.current[0].x, 0, clickPath.current[0].z)
        : null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (useGame.getState().paused || !useGame.getState().started) return;
      const el = e.target as HTMLElement;
      if (el.closest(".wf-hud") || el.closest(".wf-joy") || el.closest(".wf-start") || el.closest(".wf-dock")) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      drag.current.moved = 0;
      drag.current.orbit = e.button === 2 || e.button === 1;
      if (pointers.current.size === 2) {
        const pts = [...pointers.current.values()];
        drag.current.pinch0 = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        drag.current.orbit = true;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        const pts = [...pointers.current.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (drag.current.pinch0 > 8) {
          const ratio = drag.current.pinch0 / Math.max(8, d);
          applyZoom((ratio - 1) * 900);
        }
        drag.current.pinch0 = d;
        drag.current.orbit = true;
        return;
      }
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current.moved += Math.hypot(dx, dy);
      if (drag.current.orbit || drag.current.moved > 9) {
        applyOrbit(dx, dy);
        drag.current.orbit = true;
      }
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const wasOrbit = drag.current.orbit;
      const moved = drag.current.moved;
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) drag.current.pinch0 = 0;
      if (wasOrbit || moved > 9) return;
      if (e.button !== 0) return;
      const pt = hitGround(e.clientX, e.clientY);
      if (pt) issuePath(pt.x, pt.z);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyZoom(e.deltaY);
    };
    const onMenu = (e: Event) => e.preventDefault();

    gl.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    gl.domElement.addEventListener("wheel", onWheel, { passive: false });
    gl.domElement.addEventListener("contextmenu", onMenu);

    window.__controlsTest = {
      getYaw: () => yawRef.current,
      getSpeed: () => speedRef.current,
      setKeys: (codes) => {
        qaHold = codes;
        const s = useGame.getState();
        if (!s.started) s.start();
        if (s.paused) s.setPaused(false);
      },
    };
    window.__wayfarer = {
      getTile: () => worldToTile(g.position.x, g.position.z),
      teleport: (tx, tz) => {
        const xw = tileCenter(tx);
        const zw = tileCenter(tz);
        g.position.set(xw, sampleGround(world, xw, zw), zw);
        clickPath.current = [];
        target.current = null;
      },
      getTick: () => useGame.getState().tick,
    };

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", onVis);
      gl.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      gl.domElement.removeEventListener("wheel", onWheel);
      gl.domElement.removeEventListener("contextmenu", onMenu);
    };
  }, [camera, gl, world, scene]);

  useFrame((_, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.1);
    const st = useGame.getState();

    if (st.started && !st.paused) {
      tickAcc.current += dt;
      const step = GAME_TICK_MS / 1000;
      while (tickAcc.current >= step) {
        tickAcc.current -= step;
        useGame.getState().advanceTick();
      }
    }

    if (!st.started || st.paused) {
      walking.current = false;
      speedRef.current = 0;
      plantCam(camera, g.position, clock.elapsedTime, false, dt, st.started ? 1 : 1.15);
      return;
    }

    const held = qaHold ? new Set(qaHold) : keys.current;
    let ix = 0;
    let iz = 0;
    if (held.has("KeyW") || held.has("ArrowUp")) iz -= 1;
    if (held.has("KeyS") || held.has("ArrowDown")) iz += 1;
    if (held.has("KeyA") || held.has("ArrowLeft")) ix -= 1;
    if (held.has("KeyD") || held.has("ArrowRight")) ix += 1;
    ix += joystick.current.x;
    iz += joystick.current.y;

    _move.set(0, 0, 0);
    if (ix !== 0 || iz !== 0) {
      clickPath.current = [];
      target.current = null;
      pendingGather.current = null;
      const axes = camAxes(liveCam.yaw);
      _fwd.set(axes.fwd.x, 0, axes.fwd.z);
      _right.set(axes.right.x, 0, axes.right.z);
      _move.addScaledVector(_fwd, -iz);
      _move.addScaledVector(_right, ix);
      if (_move.lengthSq() > 1e-6) _move.normalize();
    } else if (target.current) {
      const dx = target.current.x - g.position.x;
      const dz = target.current.z - g.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.45) {
        clickPath.current.shift();
        target.current = clickPath.current.length
          ? new THREE.Vector3(clickPath.current[0].x, 0, clickPath.current[0].z)
          : null;
        if (!target.current && pendingGather.current) {
          if (useGame.getState().gather(pendingGather.current)) gatherChime();
          pendingGather.current = null;
        }
      } else {
        _move.set(dx / dist, 0, dz / dist);
      }
    }

    const running = held.has("ShiftLeft") || held.has("ShiftRight");
    const want = _move.lengthSq() > 1e-6;
    const biome = sampleBiome(world, g.position.x, g.position.z);
    const inWater = biome === "water";
    const speedMul = inWater ? 0.45 : 1;
    const maxSp = (running && st.stamina > 0.05 ? RUN : WALK) * speedMul;

    if (want) {
      const nx = g.position.x + _move.x * maxSp * dt;
      const nz = g.position.z + _move.z * maxSp * dt;
      const from = worldToTile(g.position.x, g.position.z);
      const to = worldToTile(nx, nz);
      const dx = Math.sign(to.tx - from.tx);
      const dy = Math.sign(to.tz - from.tz);
      const same = dx === 0 && dy === 0;
      const travelOk = same || canTravel(world.collision, from.tx, from.tz, dx, dy);
      const h = sampleGround(world, nx, nz);
      const slopeOk = h - g.position.y < 2.4;
      const inBounds = nx > -HALF + 2 && nx < HALF - 2 && nz > -HALF + 2 && nz < HALF - 2;
      if (travelOk && slopeOk && inBounds) {
        g.position.x = nx;
        g.position.z = nz;
        g.position.y = THREE.MathUtils.damp(g.position.y, h, 14, dt);
        yawRef.current = Math.atan2(-_move.x, -_move.z);
        g.rotation.y = yawRef.current;
        speedRef.current = maxSp;
        walking.current = true;
        stepAcc.current += dt;
        if (stepAcc.current > (running ? 0.32 : 0.44)) {
          stepAcc.current = 0;
          footstep();
        }
      } else {
        if (target.current) {
          clickPath.current = [];
          target.current = null;
        }
        g.position.y = THREE.MathUtils.damp(
          g.position.y,
          sampleGround(world, g.position.x, g.position.z),
          14,
          dt,
        );
        speedRef.current = 0;
        walking.current = false;
      }
    } else {
      g.position.y = THREE.MathUtils.damp(
        g.position.y,
        sampleGround(world, g.position.x, g.position.z),
        14,
        dt,
      );
      speedRef.current = 0;
      walking.current = false;
    }

    let hp = st.hp;
    let stam = st.stamina;
    if (running && want) stam = Math.max(0, stam - dt * 0.18);
    else stam = Math.min(1, stam + dt * 0.12);
    if (inWater && g.position.y < WATER_LEVEL - 0.2) hp = Math.max(0.15, hp - dt * 0.04);
    else hp = Math.min(1, hp + dt * 0.02);

    const { tx, tz } = worldToTile(g.position.x, g.position.z);
    useGame.getState().markKnown(tx, tz);
    for (const lm of LANDMARKS) {
      if (Math.abs(lm.tx - tx) + Math.abs(lm.tz - tz) <= 2) {
        const flavor =
          lm.id === "north"
            ? "You cross the north bridge. The river talks underfoot."
            : lm.id === "west"
              ? "You stand the western shore. Boats sleep in the reeds."
              : lm.id === "east"
                ? "You climb the eastern rise. Stones stacked by older hands."
                : "You reach the southern gate. The arch still holds.";
        useGame.getState().discover(lm.id, flavor);
      }
    }

    if (Math.abs(hp - st.hp) > 0.008 || Math.abs(stam - st.stamina) > 0.008) {
      useGame.getState().setVitals(hp, stam);
    }
    poseAcc.current += dt;
    if (poseAcc.current > 0.45) {
      poseAcc.current = 0;
      useGame.getState().setPose(g.position.x, g.position.z, yawRef.current, biome);
    }

    if (liveCam.chase && walking.current) {
      let dyaw = yawRef.current - liveCam.yaw;
      while (dyaw > Math.PI) dyaw -= Math.PI * 2;
      while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      liveCam.yaw += dyaw * (1 - Math.exp(-1.05 * dt));
    }

    const ahead = walking.current ? 1.35 : 0;
    plantCam(
      camera,
      g.position,
      clock.elapsedTime,
      walking.current,
      dt,
      1,
      -Math.sin(yawRef.current) * ahead,
      -Math.cos(yawRef.current) * ahead,
    );
  });

  return (
    <group ref={group}>
      <pointLight intensity={0.95} distance={10} color="#fff1d0" position={[0.2, 2.4, 0.35]} />
      <Character walkRef={walking} kind="player" />
    </group>
  );
}

function plantCam(
  camera: THREE.Camera,
  pos: THREE.Vector3,
  time: number,
  walking: boolean,
  dt: number,
  distMul: number,
  lookX = 0,
  lookZ = 0,
) {
  const sway = walking ? 0.05 : 0.018;
  const axes = camAxes(liveCam.yaw);
  _look.set(pos.x + lookX, pos.y + CAM_LOOK_Y, pos.z + lookZ);
  const off = camOffset({
    yaw: liveCam.yaw,
    pitch: liveCam.pitch,
    dist: liveCam.dist * distMul,
  });
  _camPos.set(
    _look.x + off.x + axes.right.x * CAM_SHOULDER + Math.sin(time * 1.05) * sway,
    _look.y + off.y + Math.sin(time * 1.9) * sway * 0.28,
    _look.z + off.z + axes.right.z * CAM_SHOULDER,
  );
  camera.position.lerp(_camPos, 1 - Math.exp(-8.5 * dt));
  camera.lookAt(_look);
}

function tryInteract(
  pos: THREE.Vector3,
  pending: MutableRefObject<ResourceNode | null>,
) {
  const world = getWorld();
  const fountain = tileCenter(CROSSROADS.tx);
  const fountainZ = tileCenter(CROSSROADS.tz);
  const dFountain = Math.hypot(pos.x - fountain, pos.z - fountainZ);
  if (dFountain < 3.4 && useGame.getState().tithe.phase === "light") {
    if (useGame.getState().lightLantern()) gatherChime();
    return;
  }
  let nearest = FOLK[0];
  let best = Infinity;
  for (const f of FOLK) {
    const fx = tileCenter(f.tx);
    const fz = tileCenter(f.tz);
    const d = Math.hypot(pos.x - fx, pos.z - fz);
    if (d < best) {
      best = d;
      nearest = f;
    }
  }
  const node = nearestNode(world, pos.x, pos.z, 3.6);
  if (best < 4.2 && (!node || best <= 3.6)) {
    useGame.getState().talk(nearest.id);
    return;
  }
  if (node) {
    if (useGame.getState().gather(node)) gatherChime();
    pending.current = null;
  }
}
