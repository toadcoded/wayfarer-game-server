import { useEffect, useRef } from "react";
import {
  BOOKS,
  COLS,
  NPCS,
  ROWS,
  SPAWN,
  T,
  TILE,
  buildTiles,
  locationAt,
  walkable,
} from "@/lib/ashfen/world";
import { neighbors4 } from "@/lib/ashfen/path";
import { route } from "@/lib/ashfen/jps";
import { blitSheet, loadSheets, type Sheets } from "@/lib/ashfen/sheets";
import { useGame } from "@/lib/ashfen/game-store";
import { getRealm } from "@/lib/ashfen/realm";
import { scriptFor } from "@/lib/ashfen/skills";
import {
  beginTalk,
  completeFibre,
  completeGather,
  gatherDurationMs,
  isLanternTile,
  lightLantern,
  markPending,
} from "@/lib/ashfen/play";
import { paintRespawnOverlay, paintWalkOverlay } from "@/lib/ashfen/overlay";
import {
  clampCam,
  clampZoom,
  dirFromVel,
  expSmooth,
  PHYS_DT,
  speedCap,
  stepLocomotion,
  tickRun,
  tilePx as tilePxOf,
  zoomToward,
  ZOOM_CLOSE,
  ZOOM_REALM,
} from "@/lib/ashfen/physics";
import { axisFromHeld, clearHeld, press, release, setHeld } from "@/lib/ashfen/input";
import { spriteFramePeriod } from "@/lib/ashfen/pose";

const TICK = 0.6;
const MIRE_CD = 9000;

const C = {
  grass: "#7ec94a",
  grass2: "#6bb53c",
  path: "#e2d09a",
  pathEdge: "#d4be7e",
  stone: "#c5c8be",
  stone2: "#b4b8ae",
  water: "#5aa4cc",
  water2: "#4a92b8",
  floor: "#b08458",
  keep: "#8a9098",
  wall: "#5a5248",
  wallHi: "#6e6458",
  rock: "#908c86",
  tree: "#3a6a30",
  canopy: "#4a9a40",
  dock: "#c09060",
  fountain: "#8ab4c8",
};

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

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tilesRef = useRef<Uint8Array>(buildTiles());
  const fx = useRef(SPAWN.x + 0.5);
  const fy = useRef(SPAWN.y + 0.5);
  const vel = useRef({ vx: 0, vy: 0 });
  const pathRef = useRef<PathPt[]>([]);
  const sheetsRef = useRef<Sheets>({ player: null, mireling: null, npcs: null });
  const cam = useRef({ x: 0, y: 0 });
  const gather = useRef<{ id: string; ends: number; duration: number } | null>(null);
  const combatAcc = useRef(0);
  const wanderAcc = useRef(0);
  const frameAcc = useRef(0);
  const anim = useRef(0);
  const target = useRef<string | null>(null);
  const dprRef = useRef(1);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDist = useRef(0);
  const skipClick = useRef(false);
  const lunge = useRef(0);
  const lastSpeed = useRef(0);
  const interactFn = useRef<() => void>(() => {});

  useEffect(() => {
    const snap = useGame.getState();
    fx.current = snap.tileX + 0.5;
    fy.current = snap.tileY + 0.5;
    const unsubHydra = useGame.persist.onFinishHydration(() => {
      const s = useGame.getState();
      fx.current = s.tileX + 0.5;
      fy.current = s.tileY + 0.5;
    });
    void loadSheets().then((s) => {
      sheetsRef.current = s;
    });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let alive = true;

    const view = () => ({ w: canvas.clientWidth, h: canvas.clientHeight });
    const sNow = () => tilePxOf(useGame.getState().zoom);

    const fitCam = () => {
      const { w, h } = view();
      const s = sNow();
      const want = clampCam(fx.current * s - w / 2, fy.current * s - h / 2, useGame.getState().zoom, w, h);
      cam.current.x = want.x;
      cam.current.y = want.y;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      fitCam();
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const applyZoom = (next: number, pivotSx: number, pivotSy: number) => {
      const st = useGame.getState();
      const { w, h } = view();
      const moved = zoomToward(st.zoom, next, cam.current.x, cam.current.y, pivotSx, pivotSy);
      st.setZoom(moved.zoom);
      const clamped = clampCam(moved.camX, moved.camY, moved.zoom, w, h);
      cam.current.x = clamped.x;
      cam.current.y = clamped.y;
    };

    const tryInteract = () => {
      const tiles = tilesRef.current;
      const st = useGame.getState();
      if (st.paused) return;
      const px = Math.floor(fx.current);
      const py = Math.floor(fy.current);
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
        lunge.current = 1;
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
      if (isLanternTile(px, py) || locationAt(px, py).id === "square") {
        if (st.tithe.phase === "light") {
          lightLantern();
          return;
        }
      }
      if (locationAt(px, py).id === "library" && tiles[py * COLS + px] === T.floor) {
        const unread = BOOKS.find((b) => !st.booksRead.includes(b.id));
        if (unread) st.readBook(unread.id);
      }
    };
    interactFn.current = tryInteract;

    const step = (dt: number) => {
      if (useGame.getState().paused) return;
      const tiles = tilesRef.current;
      const st = useGame.getState();
      const { ax, ay } = axisFromHeld();
      const boosting = Date.now() < st.boostUntil;
      const cap = speedCap(st.walkSpeed, st.runEnergy, boosting);

      const loc = stepLocomotion(
        { x: fx.current, y: fy.current, vx: vel.current.vx, vy: vel.current.vy },
        ax,
        ay,
        pathRef.current,
        dt,
        tiles,
        cap,
      );
      fx.current = loc.body.x;
      fy.current = loc.body.y;
      vel.current.vx = loc.body.vx;
      vel.current.vy = loc.body.vy;
      pathRef.current = loc.path;
      const moving = loc.moving;
      if (Math.hypot(loc.body.vx, loc.body.vy) > 0.08) {
        st.setDir(dirFromVel(loc.body.vx, loc.body.vy, st.dir));
      }
      st.setTile(Math.floor(loc.body.x), Math.floor(loc.body.y));

      lastSpeed.current = Math.hypot(vel.current.vx, vel.current.vy);
      st.setRunEnergy(tickRun(st.runEnergy, moving, dt));
      if (lunge.current > 0) lunge.current = Math.max(0, lunge.current - dt * 4);

      const g = gather.current;
      if (g && performance.now() >= g.ends) {
        finishGather(g.id);
        gather.current = null;
      }

      combatAcc.current += dt;
      while (combatAcc.current >= TICK) {
        combatAcc.current -= TICK;
        const realm = getRealm();
        realm.step();
        useGame.getState().setTick(realm.tick);
        combatTick();
      }

      wanderAcc.current += dt;
      if (wanderAcc.current >= 0.9) {
        wanderAcc.current = 0;
        wanderMire(tiles);
      }

      frameAcc.current += dt;
      const period = spriteFramePeriod(lastSpeed.current);
      if (frameAcc.current >= period) {
        frameAcc.current = 0;
        if (lastSpeed.current > 0.18) anim.current = (anim.current + 1) % 4;
        else anim.current = 0;
      }

      const { w, h } = view();
      const s = sNow();
      const wantX = fx.current * s - w / 2;
      const wantY = fy.current * s - h / 2;
      cam.current.x = expSmooth(cam.current.x, wantX, 7.2, dt);
      cam.current.y = expSmooth(cam.current.y, wantY, 7.2, dt);
      const clamped = clampCam(cam.current.x, cam.current.y, useGame.getState().zoom, w, h);
      cam.current.x = clamped.x;
      cam.current.y = clamped.y;
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

      const px = Math.floor(fx.current);
      const py = Math.floor(fy.current);
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
          lunge.current = 1;
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
              fx.current = SPAWN.x + 0.5;
              fy.current = SPAWN.y + 0.5;
              vel.current.vx = 0;
              vel.current.vy = 0;
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

    const wanderMire = (tiles: Uint8Array) => {
      const st = useGame.getState();
      const mire = st.mirelings.map((m) => {
        if (!m.alive) return m;
        if (getRealm().roll() > 0.55) return m;
        const opts = neighbors4(tiles, m.x, m.y).filter(
          (p) => !NPCS.some((n) => n.x === p.x && n.y === p.y),
        );
        if (!opts.length) return m;
        const pick = opts[(getRealm().roll() * opts.length) | 0]!;
        return { ...m, x: pick.x, y: pick.y, frame: (m.frame + 1) % 4 };
      });
      st.setMirelings(mire);
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 2 || h < 2) return;
      ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = C.grass;
      ctx.fillRect(0, 0, w, h);
      const tiles = tilesRef.current;
      const st = useGame.getState();
      const s = tilePxOf(st.zoom);
      const ox = cam.current.x;
      const oy = cam.current.y;
      const x0 = Math.max(0, Math.floor(ox / s) - 1);
      const y0 = Math.max(0, Math.floor(oy / s) - 1);
      const x1 = Math.min(COLS, Math.ceil((ox + w) / s) + 1);
      const y1 = Math.min(ROWS, Math.ceil((oy + h) / s) + 1);

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const t = tiles[y * COLS + x]!;
          paintTile(ctx, t, x * s - ox, y * s - oy, x, y, s);
        }
      }

      if (st.overlays.walk) {
        paintWalkOverlay(ctx, tiles, Math.floor(fx.current), Math.floor(fy.current), x0, y0, x1, y1, ox, oy, s);
      }

      if (st.overlays.respawn) {
        paintRespawnOverlay(ctx, st.nodes, st.mirelings, performance.now(), ox, oy, (kind) =>
          scriptFor(kind)?.cooldownMs ?? 14000,
        s);
      }

      const sheets = sheetsRef.current;
      const k = s / TILE;
      for (const npc of NPCS) {
        const sx = npc.x * s - ox;
        const sy = npc.y * s - oy - 8 * k;
        if (sheets.npcs) {
          const col = npc.id === "halden" ? 1 : 0;
          const row = npc.id === "toller" ? 1 : 0;
          blitSheet(ctx, sheets.npcs, 2, 2, col, row, sx - 4 * k, sy - 6 * k, 40 * k, 40 * k);
        } else {
          ctx.fillStyle = npc.hue === "indigo" ? "#5a4a8a" : npc.hue === "keep" ? "#6a6e78" : "#8a6a40";
          ctx.fillRect(sx + 6 * k, sy + 4 * k, 20 * k, 26 * k);
        }
      }

      for (const m of st.mirelings) {
        if (!m.alive) continue;
        const sx = m.x * s - ox;
        const sy = m.y * s - oy - 6 * k;
        if (sheets.mireling) {
          const col = m.frame % 2;
          const row = (m.frame / 2) | 0;
          blitSheet(ctx, sheets.mireling, 2, 2, col, row, sx - 2 * k, sy - 4 * k, 36 * k, 36 * k);
        } else {
          ctx.fillStyle = "#4a6a38";
          ctx.fillRect(sx + 8 * k, sy + 8 * k, 16 * k, 16 * k);
        }
        if (m.hp < m.maxHp) {
          ctx.fillStyle = "#2a1a1a";
          ctx.fillRect(sx + 4 * k, sy, 24 * k, 3 * k);
          ctx.fillStyle = "#b07070";
          ctx.fillRect(sx + 4 * k, sy, ((24 * m.hp) / m.maxHp) * k, 3 * k);
        }
      }

      const pDir = st.dir;
      const moving = pathRef.current.length > 0 || Math.hypot(vel.current.vx, vel.current.vy) > 0.15;
      const frame = moving ? anim.current : 0;
      const row = pDir === "down" ? 0 : pDir === "left" ? 1 : pDir === "right" ? 2 : 3;
      let px = fx.current * s - ox;
      let py = fy.current * s - oy;
      const g = gather.current;
      if (g) {
        py += Math.sin(((g.ends - performance.now()) / 180) * Math.PI) * 3 * k;
      }
      if (lunge.current > 0) {
        const tid = target.current;
        const foe = tid ? st.mirelings.find((m) => m.id === tid) : null;
        if (foe) {
          const lx = foe.x + 0.5 - fx.current;
          const ly = foe.y + 0.5 - fy.current;
          const mag = Math.hypot(lx, ly) || 1;
          px += (lx / mag) * 6 * k * lunge.current;
          py += (ly / mag) * 6 * k * lunge.current;
        }
      }
      if (sheets.player) {
        blitSheet(ctx, sheets.player, 4, 4, frame, row, px - 16 * k, py - 28 * k, 48 * k, 48 * k);
      } else {
        ctx.fillStyle = "#3d6b3a";
        ctx.fillRect(px - 8 * k, py - 16 * k, 16 * k, 24 * k);
      }

      if (g) {
        const t = 1 - Math.max(0, g.ends - performance.now()) / g.duration;
        ctx.fillStyle = "rgba(11,13,12,0.65)";
        ctx.fillRect(px - 18 * k, py - 36 * k, 36 * k, 4 * k);
        ctx.fillStyle = "#c4a574";
        ctx.fillRect(px - 18 * k, py - 36 * k, 36 * k * t, 4 * k);
      }
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
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const screenToTile = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const s = sNow();
      const sx = clientX - rect.left + cam.current.x;
      const sy = clientY - rect.top + cam.current.y;
      return { tx: Math.floor(sx / s), ty: Math.floor(sy / s) };
    };

    const onClick = (e: PointerEvent) => {
      if (skipClick.current) {
        skipClick.current = false;
        return;
      }
      const { tx, ty } = screenToTile(e.clientX, e.clientY);
      const tiles = tilesRef.current;
      const st = useGame.getState();
      if (st.paused) return;
      const px = Math.floor(fx.current);
      const py = Math.floor(fy.current);

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
        if (unread && Math.abs(tx - 5) + Math.abs(ty - 4) <= 3) {
          st.readBook(unread.id);
        }
      }

      if (!walkable(tiles, tx, ty)) return;
      getRealm().enqueue({ kind: "move", x: tx, y: ty });
      pathRef.current = route(tiles, px, py, tx, ty);
      st.setTalk(null);
    };

    const onPointerDown = (e: PointerEvent) => {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        const pts = [...pointers.current.values()];
        pinchDist.current = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
        skipClick.current = true;
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        const pts = [...pointers.current.values()];
        const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
        if (pinchDist.current > 8) {
          const rect = canvas.getBoundingClientRect();
          const mx = (pts[0]!.x + pts[1]!.x) / 2 - rect.left;
          const my = (pts[0]!.y + pts[1]!.y) / 2 - rect.top;
          applyZoom(useGame.getState().zoom * (dist / pinchDist.current), mx, my);
        }
        pinchDist.current = dist;
        skipClick.current = true;
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      const wasPinch = pointers.current.size >= 2;
      pointers.current.delete(e.pointerId);
      if (wasPinch) skipClick.current = true;
      else onClick(e);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * 0.0014);
      applyZoom(useGame.getState().zoom * factor, e.clientX - rect.left, e.clientY - rect.top);
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
        const { w, h } = view();
        applyZoom(useGame.getState().zoom * 1.12, w / 2, h / 2);
        return;
      }
      if (e.code === "Minus" || e.code === "NumpadSubtract") {
        e.preventDefault();
        const { w, h } = view();
        applyZoom(useGame.getState().zoom / 1.12, w / 2, h / 2);
        return;
      }
      if (e.code === "Digit0") {
        e.preventDefault();
        const { w, h } = view();
        applyZoom(1, w / 2, h / 2);
        return;
      }
      if (e.code === "Digit9") {
        e.preventDefault();
        const { w, h } = view();
        applyZoom(ZOOM_REALM, w / 2, h / 2);
        return;
      }
      if (e.code === "Digit8") {
        e.preventDefault();
        const { w, h } = view();
        applyZoom(ZOOM_CLOSE, w / 2, h / 2);
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
    const onKeyUp = (e: KeyboardEvent) => {
      release(e.code);
    };
    const onBlur = () => clearHeld();

    window.__controlsTest = {
      getYaw: () => {
        const d = useGame.getState().dir;
        return d === "right" ? 0 : d === "down" ? Math.PI / 2 : d === "left" ? Math.PI : -Math.PI / 2;
      },
      getSpeed: () => lastSpeed.current,
      getX: () => fx.current,
      getY: () => fy.current,
      getZoom: () => useGame.getState().zoom,
      setKeys: (codes) => setHeld(codes),
      setSteer: (v) => {
        if (v > 0.2) setHeld(["KeyA"]);
        else if (v < -0.2) setHeld(["KeyD"]);
        else setHeld([]);
      },
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onBlur);
    return () => {
      alive = false;
      unsubHydra();
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onBlur);
      if (window.__controlsTest) delete window.__controlsTest;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 h-full w-full touch-none"
      aria-label="Ashfen realm"
    />
  );
}

function paintTile(
  ctx: CanvasRenderingContext2D,
  t: number,
  sx: number,
  sy: number,
  x: number,
  y: number,
  s: number,
) {
  const even = (x + y) % 2 === 0;
  const k = s / TILE;
  if (t === T.grass || t === T.grass2) {
    ctx.fillStyle = even ? C.grass : C.grass2;
    ctx.fillRect(sx, sy, s, s);
    return;
  }
  if (t === T.path) {
    ctx.fillStyle = even ? C.path : C.pathEdge;
    ctx.fillRect(sx, sy, s, s);
    return;
  }
  if (t === T.stone) {
    ctx.fillStyle = even ? C.stone : C.stone2;
    ctx.fillRect(sx, sy, s, s);
    return;
  }
  if (t === T.water) {
    ctx.fillStyle = even ? C.water : C.water2;
    ctx.fillRect(sx, sy, s, s);
    return;
  }
  if (t === T.floor) {
    ctx.fillStyle = C.floor;
    ctx.fillRect(sx, sy, s, s);
    ctx.fillStyle = "rgba(232,226,212,0.06)";
    ctx.fillRect(sx + 2 * k, sy + 2 * k, s - 4 * k, s - 4 * k);
    return;
  }
  if (t === T.keep) {
    ctx.fillStyle = C.keep;
    ctx.fillRect(sx, sy, s, s);
    return;
  }
  if (t === T.wall) {
    ctx.fillStyle = C.wall;
    ctx.fillRect(sx, sy, s, s);
    ctx.fillStyle = C.wallHi;
    ctx.fillRect(sx, sy, s, 4 * k);
    return;
  }
  if (t === T.rock) {
    ctx.fillStyle = even ? C.grass : C.grass2;
    ctx.fillRect(sx, sy, s, s);
    ctx.fillStyle = C.rock;
    ctx.beginPath();
    ctx.moveTo(sx + 6 * k, sy + 22 * k);
    ctx.lineTo(sx + 16 * k, sy + 8 * k);
    ctx.lineTo(sx + 26 * k, sy + 22 * k);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (t === T.tree) {
    ctx.fillStyle = even ? C.grass : C.grass2;
    ctx.fillRect(sx, sy, s, s);
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(sx + 14 * k, sy + 18 * k, 4 * k, 10 * k);
    ctx.fillStyle = C.canopy;
    ctx.beginPath();
    ctx.arc(sx + 16 * k, sy + 14 * k, 10 * k, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (t === T.fountain) {
    ctx.fillStyle = C.stone;
    ctx.fillRect(sx, sy, s, s);
    ctx.fillStyle = C.fountain;
    ctx.beginPath();
    ctx.arc(sx + 16 * k, sy + 16 * k, 10 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.water;
    ctx.beginPath();
    ctx.arc(sx + 16 * k, sy + 16 * k, 5 * k, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (t === T.dock) {
    ctx.fillStyle = C.dock;
    ctx.fillRect(sx, sy, s, s);
    return;
  }
  ctx.fillStyle = C.grass;
  ctx.fillRect(sx, sy, s, s);
}

export function currentLocationName() {
  const { tileX, tileY } = useGame.getState();
  return locationAt(tileX, tileY).name;
}
