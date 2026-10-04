import { useEffect, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Character } from "./Character.tsx";
import { ISO_DIST, ISO_FWD, ISO_RIGHT, isoOffset } from "./iso.ts";
import { canTravel, findPath } from "./osrs-codec.ts";
import { useGame } from "./store.ts";
import {
  HALF,
  LANDMARKS,
  TILE_SIZE,
  WATER_LEVEL,
  getWorld,
  sampleBiome,
  sampleWalk,
  worldToTile,
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
    };
  }
}

const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _offset = isoOffset(ISO_DIST);

const WALK = 7.2;
const RUN = 11.4;

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
  const qaKeys = useRef<string[] | null>(null);
  const clickPath = useRef<{ x: number; z: number }[]>([]);
  const target = useRef<THREE.Vector3 | null>(null);
  const { camera, gl, size } = useThree();
  const world = getWorld();
  const ray = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());

  useEffect(() => {
    const st = useGame.getState();
    const g = group.current!;
    const x = st.x;
    const z = st.z;
    const y = sampleWalk(world, x, z);
    g.position.set(x, y, z);
    yawRef.current = st.yaw || Math.PI / 4;
    g.rotation.y = yawRef.current;

    const onDown = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === "Escape") useGame.getState().setPaused(!useGame.getState().paused);
      if (e.code === "KeyE") tryInteract(g.position);
      if (e.code === "Digit1") useGame.getState().setPanel("quest");
      if (e.code === "Digit2") useGame.getState().setPanel("pack");
      if (e.code === "Digit3") useGame.getState().setPanel("skills");
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

    const onClick = (e: PointerEvent) => {
      if (useGame.getState().paused || !useGame.getState().started) return;
      const el = e.target as HTMLElement;
      if (el.closest(".wf-hud") || el.closest(".wf-joy") || el.closest(".wf-start")) return;
      const rect = gl.domElement.getBoundingClientRect();
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.current.setFromCamera(pointer.current, camera);
      const origin = ray.current.ray.origin;
      const dir = ray.current.ray.direction;
      if (Math.abs(dir.y) < 1e-4) return;
      const planeY = sampleWalk(world, g.position.x, g.position.z);
      const tHit = (planeY - origin.y) / dir.y;
      if (tHit < 0) return;
      const hx = origin.x + dir.x * tHit;
      const hz = origin.z + dir.z * tHit;
      const start = worldToTile(g.position.x, g.position.z);
      const goal = worldToTile(hx, hz);
      const path = findPath(world.collision, { x: start.tx, y: start.tz }, { x: goal.tx, y: goal.tz });
      clickPath.current = path.map((p) => ({
        x: p.x * TILE_SIZE - HALF + TILE_SIZE * 0.5,
        z: p.y * TILE_SIZE - HALF + TILE_SIZE * 0.5,
      }));
      target.current = clickPath.current.length
        ? new THREE.Vector3(clickPath.current[0].x, 0, clickPath.current[0].z)
        : null;
    };

    gl.domElement.addEventListener("pointerdown", onClick);

    window.__controlsTest = {
      getYaw: () => yawRef.current,
      getSpeed: () => speedRef.current,
      setKeys: (codes) => {
        qaKeys.current = codes;
      },
    };
    window.__wayfarer = {
      getTile: () => worldToTile(g.position.x, g.position.z),
      teleport: (tx, tz) => {
        const xw = tx * TILE_SIZE - HALF + TILE_SIZE * 0.5;
        const zw = tz * TILE_SIZE - HALF + TILE_SIZE * 0.5;
        g.position.set(xw, sampleWalk(world, xw, zw), zw);
        clickPath.current = [];
        target.current = null;
      },
    };

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", onVis);
      gl.domElement.removeEventListener("pointerdown", onClick);
    };
  }, [camera, gl, world]);

  useFrame((_, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.1);
    const st = useGame.getState();
    if (!st.started || st.paused) {
      walking.current = false;
      speedRef.current = 0;
      return;
    }

    const held = qaKeys.current ? new Set(qaKeys.current) : keys.current;
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
      _fwd.set(ISO_FWD.x, 0, ISO_FWD.z);
      _right.set(ISO_RIGHT.x, 0, ISO_RIGHT.z);
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
      const h = sampleWalk(world, nx, nz);
      const slopeOk = h - g.position.y < 2.4;
      const inBounds = nx > -HALF + 2 && nx < HALF - 2 && nz > -HALF + 2 && nz < HALF - 2;
      if (travelOk && slopeOk && inBounds) {
        g.position.x = nx;
        g.position.z = nz;
        g.position.y = THREE.MathUtils.damp(g.position.y, h, 12, dt);
        yawRef.current = Math.atan2(-_move.x, -_move.z);
        g.rotation.y = yawRef.current;
        speedRef.current = maxSp;
        walking.current = true;
      } else {
        if (target.current) {
          clickPath.current = [];
          target.current = null;
        }
        g.position.y = THREE.MathUtils.damp(
          g.position.y,
          sampleWalk(world, g.position.x, g.position.z),
          12,
          dt,
        );
        speedRef.current = 0;
        walking.current = false;
      }
    } else {
      g.position.y = THREE.MathUtils.damp(
        g.position.y,
        sampleWalk(world, g.position.x, g.position.z),
        12,
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

    useGame.getState().setVitals(hp, stam);
    if ((performance.now() * 0.06) % 8 < 1) {
      useGame.getState().setPose(g.position.x, g.position.z, yawRef.current, biome);
    }

    const cam = camera as THREE.OrthographicCamera;
    _look.set(g.position.x, g.position.y + 1.15, g.position.z);
    _camPos.set(_look.x + _offset.x, _look.y + _offset.y, _look.z + _offset.z);
    cam.position.lerp(_camPos, 1 - Math.exp(-6 * dt));
    cam.lookAt(_look);
    const aspect = size.width / Math.max(1, size.height);
    const halfH = 18;
    cam.left = -halfH * aspect;
    cam.right = halfH * aspect;
    cam.top = halfH;
    cam.bottom = -halfH;
    cam.near = -200;
    cam.far = 500;
    cam.updateProjectionMatrix();
  });

  return (
    <group ref={group}>
      <Character walkRef={walking} />
    </group>
  );
}

function tryInteract(pos: THREE.Vector3) {
  const world = getWorld();
  const d = Math.hypot(pos.x - world.npc.x, pos.z - world.npc.z);
  if (d < 4) useGame.getState().talk();
}
