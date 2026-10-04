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
import { canGather } from "@/lib/ashfen/skills";
import { allOfferings, objectiveFor } from "@/lib/ashfen/quests";
import { paintRespawnOverlay, paintWalkOverlay } from "@/lib/ashfen/overlay";
import {
  buildAtmosphereCache,
  chooseAtmosphereQuality,
  paintAtmosphere,
  paintSkyBackplate,
  paintSunlight,
  type AtmosphereCache,
} from "@/lib/ashfen/atmosphere";
import {
  clampCam,
  clampZoom,
  dirFromVel,
  integrateBody,
  speedCap,
  tickRun,
  tilePx as tilePxOf,
  zoomToward,
  ZOOM_CLOSE,
  ZOOM_REALM,
  type Body,
} from "@/lib/ashfen/physics";
import { axisFromHeld, clearHeld, held, press, release, runHeld, setHeld } from "@/lib/ashfen/input";
import { actionProgress, advanceAction, beginAction, type ActionState } from "@/lib/ashfen/actions";
import { DEFAULT_COSMETICS, type CharacterCosmetics } from "@/lib/ashfen/cosmetics";

const TICK = 0.6;
const PATH_SPEED = 3.2;
const GATHER_MS = 1400;
const TREE_CD = 14000;
const ORE_CD = 16000;
const FISH_CD = 12000;
const MIRE_CD = 9000;

const C = {
  grass: "#7fbd58",
  grass2: "#5f9b4b",
  grassShade: "#416f43",
  grassLight: "#a7c96b",
  path: "#d9bf86",
  pathEdge: "#b99565",
  pathLight: "#f0dca7",
  stone: "#c8c9bc",
  stone2: "#969d98",
  stoneLight: "#e1dcc9",
  water: "#4f9eae",
  water2: "#2f6f86",
  waterLight: "#8cc7bd",
  floor: "#aa805e",
  floorLight: "#d2a77a",
  keep: "#818891",
  keepLight: "#b5b5aa",
  wall: "#514b48",
  wallHi: "#75675a",
  rock: "#777e7d",
  rockLight: "#b0aaa0",
  tree: "#335d3f",
  canopy: "#4d8d4a",
  canopyLight: "#79ae5b",
  dock: "#a9784e",
  dockLight: "#d0a36d",
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
  const brightness = useGame((s) => s.hud.brightness);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tilesRef = useRef<Uint8Array>(buildTiles());
  const fx = useRef(SPAWN.x + 0.5);
  const fy = useRef(SPAWN.y + 0.5);
  const vel = useRef({ vx: 0, vy: 0 });
  const pathRef = useRef<PathPt[]>([]);
  const sheetsRef = useRef<Sheets>({ player: null, mireling: null, npcs: null });
  const cam = useRef({ x: 0, y: 0 });
  const gather = useRef<{ id: string; ends: number } | null>(null);
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
  const atmosphereRef = useRef<AtmosphereCache | null>(null);
  const reducedMotionRef = useRef(false);
  const actionRef = useRef<ActionState | null>(null);
  const resolvedActionRef = useRef<number | null>(null);
  const hopRef = useRef(0);

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
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = motionQuery.matches;

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
      const device = navigator as Navigator & { deviceMemory?: number };
      atmosphereRef.current = buildAtmosphereCache(
        w,
        h,
        chooseAtmosphereQuality({
          reducedMotion: reducedMotionRef.current,
          reduceEffects: useGame.getState().hud.reduceEffects,
          dpr,
          deviceMemory: device.deviceMemory,
          hardwareConcurrency: device.hardwareConcurrency,
        }),
      );
      fitCam();
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
      resize();
    };
    motionQuery.addEventListener("change", onMotionChange);

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
      const px = Math.floor(fx.current);
      const py = Math.floor(fy.current);
      const npc = NPCS.find((n) => Math.abs(n.x - px) + Math.abs(n.y - py) <= 1);
      if (npc) {
        getRealm().enqueue({ kind: "talk", npcId: npc.id });
        const tithe = st.quietTithe;
        if (npc.id === "halden" && tithe.phase === "unseen") {
          st.progressTithe("halden");
          st.setTalk({ npc: npc.name, line: "The Tithe Lantern has gone dark. Ask Wren what the old offering requires." });
          st.say("Quest started: The Quiet Tithe.");
        } else if (npc.id === "wren" && tithe.phase === "seekWren") {
          st.progressTithe("wren");
          st.setTalk({ npc: npc.name, line: "Reedwood, ash ore, a reed perch, and mire fibre. Toller can bind what the town gathers." });
          st.say("Wren names four offerings. The trail begins.");
        } else if (npc.id === "toller" && tithe.phase === "collect") {
          const required = ["reedwood", "ash-ore", "perch", "mire-fibre"];
          const ready = allOfferings(tithe.offerings) && required.every((id) => (st.pack.find((p) => p.id === id)?.qty ?? 0) > 0);
          if (ready) {
            for (const id of required) st.addItem(id, id, -1);
            st.progressTithe("bind");
            st.setTalk({ npc: npc.name, line: "The bundle is bound. Take it to the dark lantern by the fountain." });
            st.say("Toller binds the Tithe Bundle.");
          } else {
            st.setTalk({ npc: npc.name, line: "Bring one reedwood, ash ore, reed perch, and mire fibre. The town waits." });
            st.say(objectiveFor(tithe));
          }
        } else if (npc.id === "halden" && tithe.phase === "report") {
          st.finishTithe();
          st.setTalk({ npc: npc.name, line: "The lantern burns again. Reedhaven is a town because someone remembers to tend it." });
        } else {
          st.setTalk({ npc: npc.name, line: npc.line });
          st.say(`${npc.name}: ${npc.line}`);
        }
        if (npc.id === "toller") st.setPanel("pack");
        if (npc.id === "wren") st.setPanel("codex");
        return;
      }
      const lanternNear = Math.abs(17 - px) + Math.abs(16 - py) <= 1 || Math.abs(18 - px) + Math.abs(16 - py) <= 1;
      if (lanternNear) {
        if (st.quietTithe.phase === "bind") {
          st.progressTithe("light");
          st.say("The Tithe Lantern catches. Report to Halden.");
        } else if (st.quietTithe.phase === "complete") {
          st.say("The Tithe Lantern burns warm over Reedhaven.");
        }
        return;
      }
      const foe = st.mirelings.find((m) => m.alive && Math.abs(m.x - px) + Math.abs(m.y - py) <= 1);
      if (foe && st.attackMode) {
        getRealm().enqueue({ kind: "interact", targetId: foe.id, action: "strike" });
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
        const actionKind = node.kind === "tree" ? "woodcut" : node.kind === "ore" ? "mine" : "fish";
        const action = beginAction(actionKind, st.tick, st.tick + 1, node.id);
        actionRef.current = action;
        resolvedActionRef.current = null;
        getRealm().enqueue({ kind: "interact", targetId: node.id, action: "gather" });
        gather.current = { id: node.id, ends: performance.now() + (action.endsTick - action.startedTick) * TICK * 1000 };
        st.say(`Working the ${node.kind}…`);
        return;
      }
      if (locationAt(px, py).id === "library" && tiles[py * COLS + px] === T.floor) {
        const unread = BOOKS.find((b) => !st.booksRead.includes(b.id));
        if (unread) st.readBook(unread.id);
      }
    };
    interactFn.current = tryInteract;

    const step = (dt: number) => {
      const tiles = tilesRef.current;
      const st = useGame.getState();
      const { ax, ay } = axisFromHeld();
      const boosting = Date.now() < st.boostUntil;
      const running = (runHeld() || st.runToggle) && st.runEnergy >= 8;
      const cap = speedCap(st.walkSpeed, st.runEnergy, boosting, running);
      let moving = false;

      if ((ax !== 0 || ay !== 0 || pathRef.current.length > 0) && actionRef.current && ["woodcut", "mine", "fish"].includes(actionRef.current.kind)) {
        actionRef.current = null;
        gather.current = null;
        st.say("Action cancelled by movement.");
      }

      if (ax !== 0 || ay !== 0) {
        pathRef.current = [];
        const body: Body = integrateBody(
          { x: fx.current, y: fy.current, vx: vel.current.vx, vy: vel.current.vy },
          ax,
          ay,
          dt,
          tiles,
          cap,
        );
        fx.current = body.x;
        fy.current = body.y;
        vel.current.vx = body.vx;
        vel.current.vy = body.vy;
        st.setDir(dirFromVel(body.vx, body.vy, st.dir));
        st.setTile(Math.floor(body.x), Math.floor(body.y));
        moving = Math.hypot(body.vx, body.vy) > 0.12;
      } else {
        const path = pathRef.current;
        if (path.length) {
          vel.current.vx = 0;
          vel.current.vy = 0;
          const next = path[0]!;
          const tx = next.x + 0.5;
          const ty = next.y + 0.5;
          const dx = tx - fx.current;
          const dy = ty - fy.current;
          const dist = Math.hypot(dx, dy);
          const stepLen = cap * dt;
          if (dist <= stepLen) {
            fx.current = tx;
            fy.current = ty;
            pathRef.current = path.slice(1);
            st.setTile(next.x, next.y);
            if (dx > 0.04) st.setDir("right");
            else if (dx < -0.04) st.setDir("left");
            else if (dy > 0.04) st.setDir("down");
            else if (dy < -0.04) st.setDir("up");
          } else {
            fx.current += (dx / dist) * stepLen;
            fy.current += (dy / dist) * stepLen;
            if (Math.abs(dx) > Math.abs(dy)) st.setDir(dx > 0 ? "right" : "left");
            else st.setDir(dy > 0 ? "down" : "up");
          }
          moving = true;
        } else {
          const body = integrateBody(
            { x: fx.current, y: fy.current, vx: vel.current.vx, vy: vel.current.vy },
            0,
            0,
            dt,
            tiles,
            cap,
          );
          fx.current = body.x;
          fy.current = body.y;
          vel.current.vx = body.vx;
          vel.current.vy = body.vy;
        }
      }

      lastSpeed.current = Math.hypot(vel.current.vx, vel.current.vy) || (moving ? PATH_SPEED : 0);
      st.setRunEnergy(tickRun(st.runEnergy, moving, running, dt));
      if (lunge.current > 0) lunge.current = Math.max(0, lunge.current - dt * 4);
      if (hopRef.current > 0) hopRef.current = Math.max(0, hopRef.current - dt);

      combatAcc.current += dt;
      while (combatAcc.current >= TICK) {
        combatAcc.current -= TICK;
        const realm = getRealm();
        realm.step();
        useGame.getState().setTick(realm.tick);
        useGame.getState().advanceEmote();
        actionRef.current = advanceAction(actionRef.current, realm.tick);
        const action = actionRef.current;
        if (action && action.phase === "active" && action.impactTick === realm.tick && action.nonce !== resolvedActionRef.current) {
          resolvedActionRef.current = action.nonce;
          if (action.kind === "woodcut" || action.kind === "mine" || action.kind === "fish") {
            finishGather(action.targetId ?? "");
            gather.current = null;
          }
        }
        combatTick();
      }

      wanderAcc.current += dt;
      if (wanderAcc.current >= 0.9) {
        wanderAcc.current = 0;
        wanderMire(tiles);
      }

      frameAcc.current += dt;
      if (frameAcc.current >= 0.18) {
        frameAcc.current = 0;
        anim.current = (anim.current + 1) % 4;
      }

      const { w, h } = view();
      const s = sNow();
      const lookAhead = Math.min(0.32, Math.hypot(vel.current.vx, vel.current.vy) * 0.14);
      const wantX = (fx.current + Math.sign(vel.current.vx) * lookAhead) * s - w / 2;
      const wantY = (fy.current + Math.sign(vel.current.vy) * lookAhead) * s - h / 2;
      cam.current.x += (wantX - cam.current.x) * Math.min(1, dt * 8);
      cam.current.y += (wantY - cam.current.y) * Math.min(1, dt * 8);
      const clamped = clampCam(cam.current.x, cam.current.y, useGame.getState().zoom, w, h);
      cam.current.x = clamped.x;
      cam.current.y = clamped.y;
    };

    const finishGather = (id: string) => {
      const st = useGame.getState();
      const nodes = st.nodes.map((n) => ({ ...n }));
      const node = nodes.find((n) => n.id === id);
      if (!node || !node.ready) return;
      node.ready = false;
      const now = performance.now();
      const packIds = st.pack.map((p) => p.id);
      const skillId = node.kind === "tree" ? "Reedcut" : node.kind === "ore" ? "Delve" : "Angle";
      const skillLevel = st.skills[skillId]?.level ?? 1;
      const check = canGather(node.kind, skillLevel, packIds);
      if (!check.ok || !check.script) {
        st.say(check.reason ?? "Cannot work this node.");
        node.ready = true;
        return;
      }
      const script = check.script;
      node.readyAt = now + script.cooldownMs;
      st.addItem(script.yieldItemId, script.yieldName, 1);
      st.addXp(script.skill, script.xp);
      st.recordTitheOffering(script.yieldItemId);
      st.say(
        node.kind === "tree"
          ? "Reedwood taken. The stump will answer later."
          : node.kind === "ore"
            ? "Ash ore. Grey rocks remember the strike."
            : "A reed perch. The pond is patient.",
      );
      st.setNodes(nodes);
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
          const blade = st.pack.some((p) => p.id === "blade");
          const dmg = 1 + (blade ? 1 : 0) + (getRealm().roll() < 0.35 ? 1 : 0);
          foe.hp -= dmg;
          st.addXp("Strike", 8);
          if (foe.hp <= 0) {
            foe.alive = false;
            foe.hp = 0;
            foe.respawnAt = now + MIRE_CD;
            st.addItem("mire-fibre", "Mire fibre", 1);
            st.recordTitheOffering("mire-fibre");
            st.addXp("Strike", 20);
            st.say("The mireling falls. Fibre for the Codex.");
            target.current = null;
          } else if (actionRef.current?.kind === "deflect" && actionRef.current.phase === "active" && actionRef.current.targetId === foe.id) {
            st.addXp("Guard", 8);
            st.say("Deflect. The mireling recoils from the guard.");
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
      if (atmosphereRef.current) paintSkyBackplate(ctx, atmosphereRef.current);
      else {
        ctx.fillStyle = C.grass;
        ctx.fillRect(0, 0, w, h);
      }
      const tiles = tilesRef.current;
      const st = useGame.getState();
      const s = tilePxOf(st.zoom);
      const k = s / TILE;
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

      if (atmosphereRef.current) paintSunlight(ctx, atmosphereRef.current, 0.1);

      const lanternLit = st.quietTithe.phase === "report" || st.quietTithe.phase === "complete";
      const lanternX = 17.5 * s - ox;
      const lanternY = 15.2 * s - oy;
      const lanternPulse = lanternLit && !st.hud.reduceEffects ? 0.82 + Math.sin(performance.now() / 240) * 0.12 : 0.82;
      ctx.fillStyle = "rgba(28, 30, 28, 0.35)";
      ctx.fillRect(lanternX - 5 * k, lanternY + 18 * k, 12 * k, 3 * k);
      ctx.fillStyle = "#3a3028";
      ctx.fillRect(lanternX - 2 * k, lanternY + 2 * k, 4 * k, 18 * k);
      ctx.fillStyle = lanternLit ? `rgba(239, 177, 72, ${lanternPulse})` : "#3d3933";
      ctx.beginPath();
      ctx.moveTo(lanternX - 7 * k, lanternY + 4 * k);
      ctx.lineTo(lanternX, lanternY - 1 * k);
      ctx.lineTo(lanternX + 7 * k, lanternY + 4 * k);
      ctx.lineTo(lanternX + 5 * k, lanternY + 14 * k);
      ctx.lineTo(lanternX - 5 * k, lanternY + 14 * k);
      ctx.closePath();
      ctx.fill();
      if (lanternLit) {
        ctx.fillStyle = `rgba(255, 221, 127, ${lanternPulse})`;
        ctx.fillRect(lanternX - 3 * k, lanternY + 5 * k, 6 * k, 6 * k);
      }

      if (st.overlays.walk) {
        paintWalkOverlay(ctx, tiles, Math.floor(fx.current), Math.floor(fy.current), x0, y0, x1, y1, ox, oy, s);
      }

      if (st.overlays.respawn) {
        paintRespawnOverlay(ctx, st.nodes, st.mirelings, performance.now(), ox, oy, (kind) =>
          kind === "tree" ? TREE_CD : kind === "ore" ? ORE_CD : FISH_CD,
        s);
      }

      const sheets = sheetsRef.current;
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

      for (const peer of st.remotePlayers) {
        const sx = peer.x * s - ox;
        const sy = peer.y * s - oy - 8 * k;
        paintChiseledCharacter(ctx, sx, sy, k, DEFAULT_COSMETICS, "down", 0, false);
        ctx.fillStyle = "rgba(16, 22, 26, 0.82)";
        ctx.fillRect(sx - 28 * k, sy - 17 * k, 56 * k, 10 * k);
        ctx.fillStyle = "#f2ead6";
        ctx.font = `${Math.max(8, Math.round(9 * k))}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(peer.displayName.slice(0, 12), sx, sy - 9 * k);
        ctx.textAlign = "start";
      }

      const pDir = st.dir;
      const moving = pathRef.current.length > 0 || Math.hypot(vel.current.vx, vel.current.vy) > 0.15;
      const frame = moving ? anim.current : 0;
      const row = pDir === "down" ? 0 : pDir === "left" ? 1 : pDir === "right" ? 2 : 3;
      let px = fx.current * s - ox;
      let py = fy.current * s - oy;
      if (hopRef.current > 0 && !reducedMotionRef.current && !st.hud.reduceEffects) {
        const hopT = 1 - hopRef.current / 0.28;
        py -= Math.sin(hopT * Math.PI) * 5 * k;
      }
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
      paintChiseledCharacter(ctx, px, py, k, st.cosmetics, pDir, frame, moving);

      if (g) {
        const t = actionProgress(actionRef.current, st.tick);
        ctx.fillStyle = "rgba(11,13,12,0.65)";
        ctx.fillRect(px - 18 * k, py - 36 * k, 36 * k, 4 * k);
        ctx.fillStyle = "#c4a574";
        ctx.fillRect(px - 18 * k, py - 36 * k, 36 * k * t, 4 * k);
      }
      const emote = st.activeEmote;
      if (emote && !st.hud.reduceEffects) {
        ctx.fillStyle = "#f2ead6";
        ctx.fillRect(px - 3 * k, py - 28 * k, 6 * k, 5 * k);
        ctx.fillStyle = "#24363a";
        const mark = emote.id === "wave" ? "+" : emote.id === "cheer" ? "!" : emote.id === "point" ? ">" : emote.id === "think" ? "?" : emote.id === "laugh" ? "*" : "~";
        ctx.font = `${Math.max(8, Math.round(7 * k))}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(mark, px, py - 24 * k);
        ctx.textAlign = "start";
      }
      const action = actionRef.current;
      if (action && !st.hud.reduceEffects) {
        const tone = action.kind === "deflect" ? "#8ed0d4" : action.kind === "fish" ? "#d9e4b4" : action.kind === "mine" ? "#b7b0a0" : "#d2a05f";
        ctx.strokeStyle = tone;
        ctx.lineWidth = Math.max(1, k * 1.5);
        ctx.beginPath();
        if (action.kind === "fish") ctx.arc(px + 11 * k, py - 8 * k, 7 * k, 0.15, 1.25);
        else if (action.kind === "deflect") ctx.arc(px, py - 8 * k, 12 * k, Math.PI * 0.9, Math.PI * 1.55);
        else ctx.arc(px + 8 * k, py - 10 * k, 9 * k, -1.25, 0.25);
        ctx.stroke();
        if (action.phase === "active") {
          ctx.fillStyle = tone;
          ctx.fillRect(px + 12 * k, py - 13 * k, 2 * k, 2 * k);
        }
      }
      if (atmosphereRef.current) {
        paintAtmosphere(ctx, atmosphereRef.current, performance.now(), !reducedMotionRef.current);
      }
    };

    const loop = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      while (acc >= 1 / 60) {
        step(1 / 60);
        acc -= 1 / 60;
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
      const px = Math.floor(fx.current);
      const py = Math.floor(fy.current);

      const npc = NPCS.find((n) => n.x === tx && n.y === ty);
      if (npc) {
        getRealm().enqueue({ kind: "talk", npcId: npc.id });
        pathRef.current = route(tiles, px, py, npc.x, npc.y + 1).slice(0, -1);
        st.setTalk({ npc: npc.name, line: npc.line });
        st.say(`${npc.name}: ${npc.line}`);
        if (npc.id === "toller") st.setPanel("pack");
        if (npc.id === "wren") st.setPanel("codex");
        return;
      }

      const foe = st.mirelings.find((m) => m.alive && m.x === tx && m.y === ty);
      if (foe && st.attackMode) {
        getRealm().enqueue({ kind: "interact", targetId: foe.id, action: "strike" });
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
        const actionKind = node.kind === "tree" ? "woodcut" : node.kind === "ore" ? "mine" : "fish";
        const action = beginAction(actionKind, st.tick, st.tick + 1, node.id);
        actionRef.current = action;
        resolvedActionRef.current = null;
        getRealm().enqueue({ kind: "interact", targetId: node.id, action: "gather" });
        gather.current = { id: node.id, ends: performance.now() + (action.endsTick - action.startedTick) * TICK * 1000 };
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
      vel.current.vx = 0;
      vel.current.vy = 0;
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
      if (e.code === "KeyR") {
        e.preventDefault();
        const state = useGame.getState();
        state.setRunToggle(!state.runToggle);
        state.say(!state.runToggle ? "Run toggled on." : "Run toggled off.");
        return;
      }
      if (e.code === "KeyV") {
        e.preventDefault();
        if (hopRef.current <= 0) hopRef.current = 0.28;
        return;
      }
      if (e.code === "KeyF") {
        e.preventDefault();
        const state = useGame.getState();
        const foe = target.current ? state.mirelings.find((m) => m.id === target.current && m.alive) : null;
        if (foe && Math.abs(foe.x - Math.floor(fx.current)) + Math.abs(foe.y - Math.floor(fy.current)) <= 1) {
          actionRef.current = beginAction("deflect", state.tick, state.tick + 1, foe.id);
          state.say("You raise a deflect.");
        }
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
      motionQuery.removeEventListener("change", onMotionChange);
      if (window.__controlsTest) delete window.__controlsTest;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 h-full w-full touch-none"
      style={{ filter: `brightness(${brightness / 100})` }}
      aria-label="Ashfen realm"
    />
  );
}

function paintSurface(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  s: number,
  x: number,
  y: number,
  base: string,
  shade: string,
  light: string,
) {
  const gradient = ctx.createLinearGradient(sx, sy, sx + s, sy + s);
  gradient.addColorStop(0, light);
  gradient.addColorStop(0.28, base);
  gradient.addColorStop(1, shade);
  ctx.fillStyle = gradient;
  ctx.fillRect(sx, sy, s, s);

  const k = s / TILE;
  const seed = Math.abs((x * 92821 + y * 68917 + x * y * 17) | 0);
  ctx.fillStyle = "rgba(255, 245, 211, 0.10)";
  ctx.fillRect(sx + ((seed >>> 2) % 25) * k, sy + ((seed >>> 7) % 24) * k, Math.max(1, k), Math.max(1, k));
  ctx.fillStyle = "rgba(27, 43, 35, 0.12)";
  ctx.fillRect(sx + ((seed >>> 12) % 23) * k, sy + ((seed >>> 17) % 25) * k, Math.max(1, 1.5 * k), Math.max(1, k));
  ctx.fillStyle = "rgba(255, 248, 217, 0.13)";
  ctx.fillRect(sx, sy, s, Math.max(1, 1.2 * k));
  ctx.fillRect(sx, sy, Math.max(1, 1.2 * k), s);
  ctx.fillStyle = "rgba(24, 35, 31, 0.16)";
  ctx.fillRect(sx, sy + s - Math.max(1, 1.4 * k), s, Math.max(1, 1.4 * k));
  ctx.fillRect(sx + s - Math.max(1, 1.4 * k), sy, Math.max(1, 1.4 * k), s);
  ctx.strokeStyle = "rgba(255, 245, 211, 0.07)";
  ctx.lineWidth = Math.max(1, k * 0.7);
  ctx.beginPath();
  ctx.moveTo(sx + 2 * k, sy + s - 3 * k);
  ctx.lineTo(sx + s - 4 * k, sy + s - 3 * k);
  ctx.stroke();
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
    paintSurface(ctx, sx, sy, s, x, y, even ? C.grass : C.grass2, C.grassShade, C.grassLight);
    return;
  }
  if (t === T.path) {
    paintSurface(ctx, sx, sy, s, x, y, even ? C.path : C.pathEdge, C.pathEdge, C.pathLight);
    return;
  }
  if (t === T.stone) {
    paintSurface(ctx, sx, sy, s, x, y, even ? C.stone : C.stone2, C.stone2, C.stoneLight);
    return;
  }
  if (t === T.water) {
    paintSurface(ctx, sx, sy, s, x, y, even ? C.water : C.water2, C.water2, C.waterLight);
    ctx.strokeStyle = "rgba(190, 230, 211, 0.28)";
    ctx.lineWidth = Math.max(1, k);
    const wave = ((x * 13 + y * 7) % 5) * 2;
    ctx.beginPath();
    ctx.moveTo(sx + 5 * k, sy + (10 + wave) * k);
    ctx.lineTo(sx + 21 * k, sy + (10 + wave) * k);
    ctx.stroke();
    ctx.fillStyle = "rgba(219, 241, 216, 0.2)";
    ctx.fillRect(sx + ((x * 5 + y * 3) % 17) * k, sy + ((y * 7 + x) % 20) * k, 5 * k, 1 * k);
    return;
  }
  if (t === T.floor) {
    paintSurface(ctx, sx, sy, s, x, y, C.floor, "#765341", C.floorLight);
    ctx.fillStyle = "rgba(232,226,212,0.06)";
    ctx.fillRect(sx + 2 * k, sy + 2 * k, s - 4 * k, s - 4 * k);
    return;
  }
  if (t === T.keep) {
    paintSurface(ctx, sx, sy, s, x, y, C.keep, "#5e6670", C.keepLight);
    ctx.fillStyle = "rgba(245, 238, 211, 0.13)";
    ctx.fillRect(sx + 4 * k, sy + 5 * k, 3 * k, 3 * k);
    return;
  }
  if (t === T.wall) {
    paintSurface(ctx, sx, sy, s, x, y, C.wall, "#342f31", C.wallHi);
    ctx.fillStyle = C.wallHi;
    ctx.fillRect(sx, sy, s, 4 * k);
    ctx.fillStyle = "rgba(235, 217, 177, 0.13)";
    ctx.fillRect(sx + 5 * k, sy + 10 * k, 2 * k, 2 * k);
    return;
  }
  if (t === T.rock) {
    paintSurface(ctx, sx, sy, s, x, y, even ? C.grass : C.grass2, C.grassShade, C.grassLight);
    ctx.fillStyle = C.rock;
    ctx.beginPath();
    ctx.moveTo(sx + 6 * k, sy + 22 * k);
    ctx.lineTo(sx + 16 * k, sy + 8 * k);
    ctx.lineTo(sx + 26 * k, sy + 22 * k);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.rockLight;
    ctx.beginPath();
    ctx.moveTo(sx + 16 * k, sy + 8 * k);
    ctx.lineTo(sx + 20 * k, sy + 14 * k);
    ctx.lineTo(sx + 12 * k, sy + 14 * k);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(38, 41, 40, 0.28)";
    ctx.beginPath();
    ctx.moveTo(sx + 6 * k, sy + 22 * k);
    ctx.lineTo(sx + 26 * k, sy + 22 * k);
    ctx.lineTo(sx + 20 * k, sy + 25 * k);
    ctx.lineTo(sx + 9 * k, sy + 25 * k);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (t === T.tree) {
    paintSurface(ctx, sx, sy, s, x, y, even ? C.grass : C.grass2, C.grassShade, C.grassLight);
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(sx + 14 * k, sy + 18 * k, 4 * k, 10 * k);
    ctx.fillStyle = C.canopy;
    ctx.beginPath();
    ctx.arc(sx + 16 * k, sy + 14 * k, 10 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.canopyLight;
    ctx.beginPath();
    ctx.arc(sx + 12 * k, sy + 10 * k, 4 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(28, 49, 35, 0.34)";
    ctx.beginPath();
    ctx.ellipse(sx + 16 * k, sy + 27 * k, 11 * k, 3 * k, 0, 0, Math.PI * 2);
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
    paintSurface(ctx, sx, sy, s, x, y, C.dock, "#71482f", C.dockLight);
    ctx.strokeStyle = "rgba(63, 39, 26, 0.42)";
    ctx.lineWidth = Math.max(1, k);
    ctx.beginPath();
    ctx.moveTo(sx + 3 * k, sy + 7 * k);
    ctx.lineTo(sx + 29 * k, sy + 7 * k);
    ctx.moveTo(sx + 3 * k, sy + 17 * k);
    ctx.lineTo(sx + 29 * k, sy + 17 * k);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = C.grass;
  ctx.fillRect(sx, sy, s, s);
}

export function currentLocationName() {
  const { tileX, tileY } = useGame.getState();
  return locationAt(tileX, tileY).name;
}

function paintChiseledCharacter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  k: number,
  look: CharacterCosmetics,
  direction: "up" | "down" | "left" | "right",
  frame: number,
  moving: boolean,
) {
  const side = direction === "left" || direction === "right";
  const back = direction === "up";
  const stride = moving ? ((frame % 4) === 1 ? 1 : (frame % 4) === 3 ? -1 : 0) : 0;
  const sx = direction === "left" ? -1 : 1;
  const skinShadow = "#8c5847";
  const skinHi = "#f4d2ad";
  const clothShadow = "#263e36";
  const apparelShadow = "#1c2d31";

  ctx.fillStyle = "rgba(16, 22, 26, 0.34)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10 * k, 10 * k, 3 * k, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs are slightly wider and planted farther apart than the old rectangle sprite.
  ctx.fillStyle = clothShadow;
  ctx.beginPath();
  ctx.moveTo(cx - 8 * k, cy + 3 * k);
  ctx.lineTo(cx - 1 * k, cy + 3 * k);
  ctx.lineTo(cx - 2 * k + stride * k, cy + 13 * k);
  ctx.lineTo(cx - 8 * k + stride * k, cy + 13 * k);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = look.clothingColor;
  ctx.beginPath();
  ctx.moveTo(cx + 1 * k, cy + 3 * k);
  ctx.lineTo(cx + 8 * k, cy + 3 * k);
  ctx.lineTo(cx + 8 * k - stride * k, cy + 13 * k);
  ctx.lineTo(cx + 2 * k - stride * k, cy + 13 * k);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#302d2a";
  ctx.fillRect(cx - 9 * k + stride * k, cy + 12 * k, 7 * k, 2 * k);
  ctx.fillRect(cx + 2 * k - stride * k, cy + 12 * k, 8 * k, 2 * k);

  // A tapered torso with a pronounced shoulder line and darker under-planes.
  ctx.fillStyle = apparelShadow;
  ctx.beginPath();
  ctx.moveTo(cx - 11 * k, cy - 8 * k);
  ctx.lineTo(cx - 6 * k, cy - 13 * k);
  ctx.lineTo(cx + 6 * k, cy - 13 * k);
  ctx.lineTo(cx + 11 * k, cy - 8 * k);
  ctx.lineTo(cx + 7 * k, cy + 5 * k);
  ctx.lineTo(cx + 3 * k, cy + 7 * k);
  ctx.lineTo(cx - 4 * k, cy + 7 * k);
  ctx.lineTo(cx - 8 * k, cy + 5 * k);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = look.clothingColor;
  ctx.beginPath();
  ctx.moveTo(cx - 8 * k, cy - 9 * k);
  ctx.lineTo(cx - 4 * k, cy - 11 * k);
  ctx.lineTo(cx + 4 * k, cy - 11 * k);
  ctx.lineTo(cx + 8 * k, cy - 8 * k);
  ctx.lineTo(cx + 5 * k, cy + 4 * k);
  ctx.lineTo(cx, cy + 6 * k);
  ctx.lineTo(cx - 5 * k, cy + 4 * k);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(244, 220, 160, 0.2)";
  ctx.fillRect(cx - 4 * k, cy - 9 * k, 2 * k, 12 * k);
  ctx.fillStyle = "rgba(16, 22, 26, 0.28)";
  ctx.fillRect(cx + 4 * k, cy - 7 * k, 2 * k, 10 * k);

  // Rounded arms with an angular elbow highlight instead of square bars.
  ctx.fillStyle = skinShadow;
  ctx.beginPath();
  ctx.moveTo(cx - 10 * k, cy - 8 * k);
  ctx.lineTo(cx - 13 * k, cy - 5 * k);
  ctx.lineTo(cx - 12 * k, cy + 3 * k);
  ctx.lineTo(cx - 9 * k, cy + 3 * k);
  ctx.lineTo(cx - 7 * k, cy - 5 * k);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = look.skinColor;
  ctx.beginPath();
  ctx.moveTo(cx + 10 * k, cy - 8 * k);
  ctx.lineTo(cx + 13 * k, cy - 5 * k);
  ctx.lineTo(cx + 12 * k, cy + 3 * k);
  ctx.lineTo(cx + 9 * k, cy + 3 * k);
  ctx.lineTo(cx + 7 * k, cy - 5 * k);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = skinHi;
  ctx.fillRect(cx - 12 * k, cy - 3 * k, 2 * k, 4 * k);
  ctx.fillRect(cx + 10 * k, cy - 3 * k, 2 * k, 4 * k);

  // Neck and a faceted jaw/cheek silhouette.
  ctx.fillStyle = skinShadow;
  ctx.fillRect(cx - 4 * k, cy - 15 * k, 8 * k, 5 * k);
  ctx.fillStyle = look.skinColor;
  ctx.beginPath();
  ctx.moveTo(cx - 7 * k, cy - 25 * k);
  ctx.lineTo(cx + 7 * k, cy - 25 * k);
  ctx.lineTo(cx + 8 * k, cy - 18 * k);
  ctx.lineTo(cx + 4 * k, cy - 13 * k);
  ctx.lineTo(cx - 4 * k, cy - 13 * k);
  ctx.lineTo(cx - 8 * k, cy - 18 * k);
  ctx.closePath();
  ctx.fill();
  if (!back) {
    ctx.fillStyle = skinHi;
    ctx.fillRect(cx - 5 * k, cy - 22 * k, 3 * k, 5 * k);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(cx + 4 * k, cy - 19 * k, 3 * k, 4 * k);
    if (side) {
      ctx.fillStyle = skinShadow;
      ctx.fillRect(cx + sx * 6 * k, cy - 20 * k, 2 * k, 3 * k);
    } else {
      ctx.fillStyle = look.eyeColor;
      ctx.fillRect(cx - 5 * k, cy - 20 * k, 2 * k, 2 * k);
      ctx.fillRect(cx + 3 * k, cy - 20 * k, 2 * k, 2 * k);
      ctx.fillStyle = "#70483e";
      ctx.fillRect(cx - 3 * k, cy - 16 * k, 6 * k, 1 * k);
    }
  }
  ctx.fillStyle = look.hairColor;
  ctx.beginPath();
  ctx.moveTo(cx - 8 * k, cy - 24 * k);
  ctx.lineTo(cx - 5 * k, cy - 28 * k);
  ctx.lineTo(cx + 5 * k, cy - 28 * k);
  ctx.lineTo(cx + 8 * k, cy - 24 * k);
  ctx.lineTo(cx + 5 * k, cy - 22 * k);
  ctx.lineTo(cx - 5 * k, cy - 22 * k);
  ctx.closePath();
  ctx.fill();
  if (look.hairStyle === "topknot" || look.hairStyle === "braided") {
    ctx.fillRect(cx - 2 * k, cy - 31 * k, 4 * k, 4 * k);
  }
  if (look.apparelStyle === "cape" || look.apparelStyle === "cloak") {
    ctx.fillStyle = look.apparelColor;
    ctx.beginPath();
    ctx.moveTo(cx - 12 * k, cy - 7 * k);
    ctx.lineTo(cx - 9 * k, cy - 10 * k);
    ctx.lineTo(cx - 8 * k, cy + 8 * k);
    ctx.lineTo(cx - 12 * k, cy + 5 * k);
    ctx.closePath();
    ctx.fill();
  }
}
