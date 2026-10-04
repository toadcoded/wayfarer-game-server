import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  BOOKS,
  COLS,
  NPCS,
  SPAWN,
  T,
  buildTiles,
  locationAt,
  walkable,
} from "@/lib/ashfen/world";
import { neighbors4 } from "@/lib/ashfen/path";
import { route } from "@/lib/ashfen/jps";
import { useGame } from "@/lib/ashfen/game-store";
import { getRealm } from "@/lib/ashfen/realm";
import {
  beginTalk,
  completeFibre,
  completeGather,
  gatherDurationMs,
  isLanternTile,
  lightLantern,
  markPending,
} from "@/lib/ashfen/play";
import {
  dirFromVel,
  expSmooth,
  PHYS_DT,
  speedCap,
  stepLocomotion,
  tickRun,
  wrapAngle,
} from "@/lib/ashfen/physics";
import { axisFromHeld, clearHeld, press, release, setHeld } from "@/lib/ashfen/input";
import { camRig, stepGaitWeight, stepWalkPhase, stepYaw, yawFromDir, yawFromVel } from "@/lib/ashfen/pose";
import {
  PAL_HALDEN,
  PAL_PLAYER,
  PAL_TOLLER,
  PAL_WREN,
  applyMireWalk,
  applyWalk,
  createHumanoid,
  createMireling,
  disposeRig,
  type HumanoidRig,
  type MireRig,
} from "@/lib/ashfen/humanoid";
import { buildWorld3D } from "@/lib/ashfen/world3d";

const TICK = 0.6;
const MIRE_CD = 9000;

type PathPt = { x: number; y: number };

type ControlsProbe = {
  getYaw: () => number;
  getSpeed: () => number;
  getX: () => number;
  getY: () => number;
  getZoom: () => number;
  setKeys?: (codes: string[]) => void;
  setSteer?: (v: number) => void;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
  }
}

export function Realm3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tiles = buildTiles();
    const snap = useGame.getState();
    const fx = { v: snap.tileX + 0.5 };
    const fy = { v: snap.tileY + 0.5 };
    const vel = { vx: 0, vy: 0 };
    const pathRef: { current: PathPt[] } = { current: [] };
    const gather = { current: null as { id: string; ends: number; duration: number } | null };
    const target = { current: null as string | null };
    const lunge = { v: 0 };
    const lastSpeed = { v: 0 };
    const yaw = { v: yawFromDir(snap.dir) };
    const gaitW = { v: 0 };
    const vis = { x: snap.tileX + 0.5, y: snap.tileY + 0.5, yaw: yawFromDir(snap.dir) };
    const prev = { x: snap.tileX + 0.5, y: snap.tileY + 0.5, yaw: yawFromDir(snap.dir) };
    let combatAcc = 0;
    let wanderAcc = 0;
    let acc = 0;
    let last = performance.now();
    let alive = true;
    let raf = 0;

    const unsubHydra = useGame.persist.onFinishHydration(() => {
      const s = useGame.getState();
      fx.v = s.tileX + 0.5;
      fy.v = s.tileY + 0.5;
      yaw.v = yawFromDir(s.dir);
    });

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x9ec8e0, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x9ec8e0, 0.018);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 180);
    camera.position.set(fx.v, 12, fy.v + 10);

    const hemi = new THREE.HemisphereLight(0xd8ecf8, 0x5a7a38, 0.85);
    const sun = new THREE.DirectionalLight(0xfff4d8, 1.15);
    sun.position.set(18, 28, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    scene.add(hemi, sun, sun.target);

    const world = buildWorld3D(tiles);
    scene.add(world.root);

    const player = createHumanoid(PAL_PLAYER, 1, { lantern: true });
    scene.add(player.root);

    const npcRigs: Record<string, HumanoidRig> = {
      wren: createHumanoid(PAL_WREN, 1),
      halden: createHumanoid(PAL_HALDEN, 1.04),
      toller: createHumanoid(PAL_TOLLER, 1.02),
    };
    for (const npc of NPCS) {
      const rig = npcRigs[npc.id];
      if (!rig) continue;
      rig.root.position.set(npc.x + 0.5, 0, npc.y + 0.5);
      rig.root.rotation.y = Math.PI;
      scene.add(rig.root);
    }

    const mireRigs = new Map<string, MireRig>();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const lookAt = new THREE.Vector3();
    const fwd = new THREE.Vector3();

    const resize = () => {
      const parent = canvas.parentElement;
      const w = Math.max(1, parent?.clientWidth ?? canvas.clientWidth);
      const h = Math.max(1, parent?.clientHeight ?? canvas.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const tryInteract = () => {
      const st = useGame.getState();
      if (st.paused) return;
      const px = Math.floor(fx.v);
      const py = Math.floor(fy.v);
      const npc = NPCS.find((n) => Math.abs(n.x - px) + Math.abs(n.y - py) <= 1);
      if (npc) {
        beginTalk(npc.id);
        return;
      }
      if (st.tithe.phase === "light" && Math.abs(px - 17) + Math.abs(py - 16) <= 1) {
        lightLantern();
        return;
      }
      const foe = st.mirelings.find((m) => m.alive && Math.abs(m.x - px) + Math.abs(m.y - py) <= 1);
      if (foe && st.attackMode) {
        target.current = foe.id;
        lunge.v = 1;
        st.say("You set on the mireling.");
        return;
      }
      const node = st.nodes.find((n) => Math.abs(n.x - px) + Math.abs(n.y - py) <= 1);
      if (node) {
        if (!node.ready) {
          st.say("Not yet. Watch the amber ring.");
          return;
        }
        const duration = gatherDurationMs(node.kind);
        gather.current = { id: node.id, ends: performance.now() + duration, duration };
        markPending(`Working the ${node.kind}…`);
        st.say(`Working the ${node.kind}…`);
        return;
      }
      if (locationAt(px, py).id === "library" && tiles[py * COLS + px] === T.floor) {
        const unread = BOOKS.find((b) => !st.booksRead.includes(b.id));
        if (unread) st.readBook(unread.id);
      }
    };

    const finishGather = (id: string) => {
      completeGather(id);
    };

    const combatTick = () => {
      const st = useGame.getState();
      const now = performance.now();
      const nodes = st.nodes.map((n) => {
        if (!n.ready && now >= n.readyAt) return { ...n, ready: true };
        return n;
      });
      if (nodes.some((n, i) => n.ready !== st.nodes[i]?.ready)) st.setNodes(nodes);

      const px = Math.floor(fx.v);
      const py = Math.floor(fy.v);
      const mire = st.mirelings.map((m) => ({ ...m }));
      for (const m of mire) {
        if (!m.alive && now >= m.respawnAt) {
          m.alive = true;
          m.hp = m.maxHp;
          st.say("A mireling returns from the reed.");
        }
      }
      const tid = target.current;
      if (st.attackMode && tid) {
        const foe = mire.find((m) => m.id === tid && m.alive);
        if (foe && Math.abs(foe.x - px) + Math.abs(foe.y - py) <= 1) {
          lunge.v = 1;
          const armed = st.pack.some((p) =>
            ["reed-blade", "ash-bow", "ember-wand", "ash-staff", "mire-axe"].includes(p.id),
          );
          const dmg = 1 + (armed ? 1 : 0) + (st.attackStyle !== "melee" ? 1 : 0) + (getRealm().roll() < 0.35 ? 1 : 0);
          foe.hp -= dmg;
          st.addXp("Strike", 8);
          if (foe.hp <= 0) {
            foe.alive = false;
            foe.hp = 0;
            foe.respawnAt = now + MIRE_CD;
            completeFibre(foe.id);
            target.current = null;
          } else {
            const hit = 1 + (getRealm().roll() < 0.4 ? 1 : 0);
            st.setHp(st.hp - hit);
            st.addXp("Guard", 4);
            st.addXp("Vitality", 2);
            if (st.hp - hit <= 0) {
              fx.v = SPAWN.x + 0.5;
              fy.v = SPAWN.y + 0.5;
              vel.vx = 0;
              vel.vy = 0;
              pathRef.current = [];
              st.setTile(SPAWN.x, SPAWN.y);
              st.setHp(st.maxHp);
              st.say("You wake at the fountain. The square keeps you.");
            }
          }
        }
      }
      st.setMirelings(mire);
    };

    const wanderMire = () => {
      const st = useGame.getState();
      const next = st.mirelings.map((m) => {
        if (!m.alive) return m;
        if (getRealm().roll() > 0.55) return m;
        const opts = neighbors4(tiles, m.x, m.y).filter((p) => !NPCS.some((n) => n.x === p.x && n.y === p.y));
        if (!opts.length) return m;
        const pick = opts[(getRealm().roll() * opts.length) | 0]!;
        return { ...m, x: pick.x, y: pick.y, frame: (m.frame + 1) % 4 };
      });
      st.setMirelings(next);
    };

    const step = (dt: number) => {
      const st = useGame.getState();
      if (st.paused) return;
      const { ax, ay } = axisFromHeld();
      const boosting = Date.now() < st.boostUntil;
      const cap = speedCap(st.walkSpeed, st.runEnergy, boosting);

      prev.x = fx.v;
      prev.y = fy.v;
      prev.yaw = yaw.v;

      const loc = stepLocomotion(
        { x: fx.v, y: fy.v, vx: vel.vx, vy: vel.vy },
        ax,
        ay,
        pathRef.current,
        dt,
        tiles,
        cap,
      );
      fx.v = loc.body.x;
      fy.v = loc.body.y;
      vel.vx = loc.body.vx;
      vel.vy = loc.body.vy;
      pathRef.current = loc.path;
      const moving = loc.moving;
      lastSpeed.v = Math.hypot(vel.vx, vel.vy);
      if (lastSpeed.v > 0.08) {
        st.setDir(dirFromVel(vel.vx, vel.vy, st.dir));
        yaw.v = stepYaw(yaw.v, vel.vx, vel.vy, dt);
      }
      st.setTile(Math.floor(fx.v), Math.floor(fy.v));
      gaitW.v = stepGaitWeight(gaitW.v, lastSpeed.v, dt);
      st.setRunEnergy(tickRun(st.runEnergy, moving, dt));
      if (lunge.v > 0) lunge.v = Math.max(0, lunge.v - dt * 4);

      const g = gather.current;
      if (g && performance.now() >= g.ends) {
        finishGather(g.id);
        gather.current = null;
      }

      combatAcc += dt;
      while (combatAcc >= TICK) {
        combatAcc -= TICK;
        const realm = getRealm();
        realm.step();
        useGame.getState().setTick(realm.tick);
        combatTick();
      }
      wanderAcc += dt;
      if (wanderAcc >= 0.9) {
        wanderAcc = 0;
        wanderMire();
      }

      player.phase = stepWalkPhase(player.phase, dt, lastSpeed.v);
      const gathering = gather.current ? 1 : 0;
      applyWalk(player, gaitW.v, gathering);

      for (const npc of NPCS) {
        const rig = npcRigs[npc.id];
        if (!rig) continue;
        rig.phase += dt * 1.15;
        applyWalk(rig, 0, 0);
      }

      const live = useGame.getState().mirelings;
      const seen = new Set<string>();
      for (const m of live) {
        seen.add(m.id);
        let rig = mireRigs.get(m.id);
        if (!m.alive) {
          if (rig) rig.root.visible = false;
          continue;
        }
        if (!rig) {
          rig = createMireling();
          scene.add(rig.root);
          mireRigs.set(m.id, rig);
        }
        rig.root.visible = true;
        const tx = m.x + 0.5;
        const tz = m.y + 0.5;
        const dx = tx - rig.root.position.x;
        const dz = tz - rig.root.position.z;
        rig.root.position.x = expSmooth(rig.root.position.x, tx, 8, dt);
        rig.root.position.z = expSmooth(rig.root.position.z, tz, 8, dt);
        if (Math.hypot(dx, dz) > 0.02) rig.root.rotation.y = yawFromVel(dx, dz, rig.root.rotation.y);
        const movingM = Math.hypot(dx, dz) > 0.04;
        rig.phase = stepWalkPhase(rig.phase, dt, movingM ? 3 : 0);
        applyMireWalk(rig, movingM);
      }
      for (const [id, rig] of mireRigs) {
        if (!seen.has(id)) {
          scene.remove(rig.root);
          disposeRig(rig.mats);
          mireRigs.delete(id);
        }
      }
    };

    const present = (alpha: number, dtVis: number) => {
      const st = useGame.getState();
      vis.x = prev.x + (fx.v - prev.x) * alpha;
      vis.y = prev.y + (fy.v - prev.y) * alpha;
      vis.yaw = prev.yaw + wrapAngle(yaw.v - prev.yaw) * alpha;
      if (lunge.v > 0 && target.current) {
        const foe = st.mirelings.find((m) => m.id === target.current);
        if (foe) {
          const lx = foe.x + 0.5 - vis.x;
          const lz = foe.y + 0.5 - vis.y;
          const mag = Math.hypot(lx, lz) || 1;
          vis.x += (lx / mag) * 0.35 * lunge.v;
          vis.y += (lz / mag) * 0.35 * lunge.v;
        }
      }
      player.root.position.set(vis.x, 0, vis.y);
      player.root.rotation.y = vis.yaw;

      const rigCam = camRig(st.zoom);
      fwd.set(Math.sin(vis.yaw), 0, Math.cos(vis.yaw));
      const lookX = vis.x + vel.vx * 0.18;
      const lookZ = vis.y + vel.vy * 0.18;
      const wantX = lookX - fwd.x * rigCam.dist;
      const wantY = rigCam.height;
      const wantZ = lookZ - fwd.z * rigCam.dist;
      camera.position.x = expSmooth(camera.position.x, wantX, 5.4, dtVis);
      camera.position.y = expSmooth(camera.position.y, wantY, 5.4, dtVis);
      camera.position.z = expSmooth(camera.position.z, wantZ, 5.4, dtVis);
      lookAt.set(lookX, rigCam.lookY, lookZ);
      camera.lookAt(lookAt);
      sun.target.position.set(vis.x, 0, vis.y);
      sun.position.set(vis.x + 12, 28, vis.y - 8);
    };

    const loop = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      while (acc >= PHYS_DT) {
        step(PHYS_DT);
        acc -= PHYS_DT;
      }
      present(acc / PHYS_DT, dt);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const screenToTile = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(world.pickPlane);
      if (!hits.length) return null;
      const p = hits[0]!.point;
      return { tx: Math.floor(p.x), ty: Math.floor(p.z) };
    };

    const onClick = (e: PointerEvent) => {
      const hit = screenToTile(e.clientX, e.clientY);
      if (!hit) return;
      const { tx, ty } = hit;
      const st = useGame.getState();
      if (st.paused) return;
      const px = Math.floor(fx.v);
      const py = Math.floor(fy.v);

      const npc = NPCS.find((n) => n.x === tx && n.y === ty);
      if (npc) {
        pathRef.current = route(tiles, px, py, npc.x, npc.y + 1).slice(0, -1);
        beginTalk(npc.id);
        return;
      }
      if (isLanternTile(tx, ty)) {
        if (Math.abs(tx - px) + Math.abs(ty - py) > 1) {
          pathRef.current = route(tiles, px, py, 18, 17);
          st.say("Approach the Tithe Lantern.");
          return;
        }
        lightLantern();
        return;
      }
      const foe = st.mirelings.find((m) => m.alive && m.x === tx && m.y === ty);
      if (foe && st.attackMode) {
        target.current = foe.id;
        const beside = neighbors4(tiles, foe.x, foe.y)[0];
        if (beside) pathRef.current = route(tiles, px, py, beside.x, beside.y);
        st.say("You set on the mireling.");
        return;
      }
      const node = st.nodes.find((n) => n.x === tx && n.y === ty);
      if (node) {
        if (Math.abs(node.x - px) + Math.abs(node.y - py) > 1) {
          const near = neighbors4(tiles, node.x, node.y)[0];
          if (near) pathRef.current = route(tiles, px, py, near.x, near.y);
          st.say("Close in to work the node.");
          return;
        }
        if (!node.ready) {
          st.say("Not yet. Watch the amber ring.");
          return;
        }
        const duration = gatherDurationMs(node.kind);
        gather.current = { id: node.id, ends: performance.now() + duration, duration };
        markPending(`Working the ${node.kind}…`);
        st.say(`Working the ${node.kind}…`);
        return;
      }
      if (locationAt(tx, ty).id === "library" && tiles[ty * COLS + tx] === T.floor) {
        const unread = BOOKS.find((b) => !st.booksRead.includes(b.id));
        if (unread && Math.abs(tx - 5) + Math.abs(ty - 4) <= 3) st.readBook(unread.id);
      }
      if (!walkable(tiles, tx, ty)) return;
      getRealm().enqueue({ kind: "move", x: tx, y: ty });
      pathRef.current = route(tiles, px, py, tx, ty);
      st.setTalk(null);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const st = useGame.getState();
      const factor = Math.exp(-e.deltaY * 0.0014);
      st.setZoom(st.zoom * factor);
    };

    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

    const onKeyDown = (e: KeyboardEvent) => {
      if (isField(e.target)) return;
      if (e.code === "Space" || e.code === "KeyE") {
        e.preventDefault();
        tryInteract();
        return;
      }
      if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        const st = useGame.getState();
        st.setPaused(!st.paused);
        return;
      }
      if (e.code === "Equal" || e.code === "NumpadAdd") {
        e.preventDefault();
        const st = useGame.getState();
        st.setZoom(st.zoom * 1.12);
        return;
      }
      if (e.code === "Minus" || e.code === "NumpadSubtract") {
        e.preventDefault();
        const st = useGame.getState();
        st.setZoom(st.zoom / 1.12);
        return;
      }
      press(e.code);
      if (
        e.code === "KeyW" ||
        e.code === "KeyA" ||
        e.code === "KeyS" ||
        e.code === "KeyD" ||
        e.code.startsWith("Arrow")
      ) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => release(e.code);
    const onBlur = () => clearHeld();

    window.__controlsTest = {
      getYaw: () => yaw.v,
      getSpeed: () => lastSpeed.v,
      getX: () => fx.v,
      getY: () => fy.v,
      getZoom: () => useGame.getState().zoom,
      setKeys: (codes) => setHeld(codes),
      setSteer: (v) => {
        if (v > 0.2) setHeld(["KeyA"]);
        else if (v < -0.2) setHeld(["KeyD"]);
        else setHeld([]);
      },
    };

    canvas.addEventListener("pointerup", onClick);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onBlur);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      unsubHydra();
      ro.disconnect();
      canvas.removeEventListener("pointerup", onClick);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onBlur);
      if (window.__controlsTest) delete window.__controlsTest;
      world.dispose();
      disposeRig(player.mats);
      for (const r of Object.values(npcRigs)) disposeRig(r.mats);
      for (const r of mireRigs.values()) disposeRig(r.mats);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 h-full w-full touch-none"
      aria-label="Ashfen 3D realm"
    />
  );
}
