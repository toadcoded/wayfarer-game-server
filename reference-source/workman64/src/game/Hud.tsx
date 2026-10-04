import { useEffect, useRef } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { CODEX_COLOPHON, CODEX_PAGES, codexComplete } from "./codex.ts";
import { DISTRICTS, LANDMARKS, TILES, locationName, getWorld, worldToTile } from "./world.ts";
import { applyZoom, resetCam } from "./camera.ts";
import { TITHE_OFFERINGS, titheObjective } from "./quests.ts";
import { trailCount, useGame, type Panel, type Skills } from "./store.ts";

const BIOME_MINI: Record<number, string> = {
  0: "#1c3a40",
  1: "#8a7a52",
  2: "#7a6238",
  3: "#3d6a32",
  4: "#1c3a20",
  5: "#4a6a38",
  6: "#6a4e30",
};

export function Hud() {
  const started = useGame((s) => s.started);
  const paused = useGame((s) => s.paused);
  const x = useGame((s) => s.x);
  const z = useGame((s) => s.z);
  const hp = useGame((s) => s.hp);
  const stamina = useGame((s) => s.stamina);
  const trails = useGame((s) => s.trails);
  const panel = useGame((s) => s.panel);
  const log = useGame((s) => s.log);
  const inventory = useGame((s) => s.inventory);
  const skills = useGame((s) => s.skills);
  const tick = useGame((s) => s.tick);
  const tithe = useGame((s) => s.tithe);
  const gold = useGame((s) => s.gold);
  const { tx, tz } = worldToTile(x, z);
  const done = trailCount(trails);
  const objective = titheObjective(tithe);

  if (!started) return null;

  return (
    <div className="wf-hud">
      <div className="pointer-events-none absolute inset-0 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="wf-panel pointer-events-auto w-[min(280px,calc(100%-132px))] px-4 py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="wf-title text-[13px] sm:text-[15px]">{locationName(tx, tz)}</div>
              <div className="font-mono text-[11px] text-parchment-dim tabular-nums">
                {Math.round(hp * 10)}/10 · t{tick}
              </div>
            </div>
            <Vital label="RUN" value={stamina} tone="bg-moss" />
            <div className="mt-2 text-[11px] leading-4 text-parchment">{objective}</div>
            <div className="mt-1.5 flex gap-1">
              {TITHE_OFFERINGS.map((id) => (
                <span
                  key={id}
                  className={`h-1.5 flex-1 rounded-full ${tithe.offerings.includes(id) ? "bg-moss" : "bg-parchment/25"}`}
                  title={id}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-parchment-dim">
              <span>The Four Trails · {done}/4</span>
              <span>{gold}g</span>
            </div>
          </div>
        </div>
        <div className="wf-panel mt-2 max-w-[280px] px-3 py-2 text-[12px] leading-5 text-parchment/90">
          {log.slice(-2).map((l, i) => (
            <div key={l.t + i}>{l.msg}</div>
          ))}
        </div>

        {(panel === "pack" || panel === "skills" || panel === "codex") && (
          <div className="mt-2 flex justify-end">
            <QuestPanel panel={panel} trails={trails} inventory={inventory} skills={skills} gold={gold} titheLine={objective} />
          </div>
        )}
      </div>

      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 sm:right-4 sm:top-4">
        <div className="wf-zoom pointer-events-auto grid grid-cols-4 gap-1.5">
          <button type="button" className="wf-icon-btn" onClick={() => resetCam(true)} title="Isometric">
            ⌗
          </button>
          <button type="button" className="wf-icon-btn" onClick={() => applyZoom(240)} title="Zoom out">
            −
          </button>
          <button type="button" className="wf-icon-btn" onClick={() => applyZoom(-240)} title="Zoom in">
            +
          </button>
          <button type="button" className="wf-icon-btn" onClick={() => resetCam(false)} title="Reset view">
            ⌂
          </button>
        </div>
        <button
          type="button"
          className="wf-panel flex h-11 items-center gap-2 px-3 text-[12px] tracking-wider uppercase"
          onClick={() => useGame.getState().setPaused(!paused)}
        >
          {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-auto sm:right-4">
        {panel === "map" && (
          <div className="mb-3 flex justify-end gap-2">
            <div className="wf-panel pointer-events-none max-w-[180px] px-3 py-2 text-[11px] leading-4 text-parchment/90">
              <div className="wf-title mb-1 text-[11px]">Realm layers</div>
              {DISTRICTS.map((d) => (
                <div key={d.id}>{d.name}</div>
              ))}
            </div>
            <Minimap tx={tx} tz={tz} />
          </div>
        )}
      </div>

      <div className="wf-dock">
        {(
          [
            ["pack", "Pack"],
            ["skills", "Skills"],
            ["codex", "Codex"],
            ["map", "Map"],
            ["attack", "Attack"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={panel === id ? "is-on" : ""}
            onClick={() => {
              if (id === "attack") {
                useGame.getState().pushLog("You have no quarrel here.");
                return;
              }
              useGame.getState().setPanel(id);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {paused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/55 p-6">
          <div className="wf-panel w-[min(360px,100%)] px-6 py-7 text-center">
            <div className="wf-title text-lg">Paused</div>
            <p className="mt-2 text-sm text-parchment-dim">
              WASD walks the isometric plane. Click the land to path, or a glowing node to gather. E
              speaks to Rowan.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" className="wf-btn" onClick={() => useGame.getState().setPaused(false)}>
                Resume
              </button>
              <button type="button" className="wf-btn" onClick={() => useGame.getState().reset()}>
                <span className="inline-flex items-center gap-2">
                  <RotateCcw className="size-3.5" /> New walk
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Vital({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <span className="w-8 shrink-0 text-[10px] tracking-widest text-parchment-dim">{label}</span>
      <div className="wf-bar flex-1">
        <span className={tone} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

function CodexReader({ trails }: { trails: Record<string, boolean> }) {
  const open = CODEX_PAGES.filter((p) => trails[p.id]).length;
  return (
    <div className="space-y-3">
      <div className="wf-title text-[12px]">Highland Codex</div>
      <p className="text-[11px] text-parchment-dim">
        {open}/4 folios bound
      </p>
      <ul className="space-y-3">
        {CODEX_PAGES.map((p) => {
          const unlocked = Boolean(trails[p.id]);
          return (
            <li key={p.id} className="border-t border-parchment/10 pt-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="tracking-widest uppercase text-[10px] text-parchment-dim">
                  Folio {p.folio}
                </span>
                <span className="text-[11px]">{unlocked ? p.title : "Sealed"}</span>
              </div>
              <p className={`mt-1 leading-relaxed ${unlocked ? "text-parchment" : "text-parchment-dim"}`}>
                {unlocked ? p.body : "Walk the trail. The page writes itself."}
              </p>
            </li>
          );
        })}
      </ul>
      {codexComplete(trails) && (
        <p className="border-t border-parchment/10 pt-3 italic text-parchment-dim">{CODEX_COLOPHON}</p>
      )}
    </div>
  );
}

function QuestPanel({
  panel,
  trails,
  inventory,
  skills,
  gold,
  titheLine,
}: {
  panel: Panel;
  trails: Record<string, boolean>;
  inventory: { id: string; name: string; qty: number }[];
  skills: Skills;
  gold: number;
  titheLine: string;
}) {
  return (
    <div className="wf-panel pointer-events-auto w-[280px] overflow-hidden">
      <div className="flex border-b border-parchment/10 text-[11px] tracking-widest uppercase">
        {(["quest", "pack", "skills", "codex", "map"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={`flex-1 px-2 py-2 ${panel === p ? "bg-ink-3 text-parchment" : "text-parchment-dim"}`}
            onClick={() => useGame.getState().setPanel(p)}
          >
            {p === "quest" ? "Quest" : p === "pack" ? "Pack" : p === "skills" ? "Skills" : p === "map" ? "Map" : "Codex"}
          </button>
        ))}
      </div>
      <div className="px-3 py-3 text-[12px]">
        {panel === "codex" && <CodexReader trails={trails} />}
        {panel === "quest" && (
          <>
            <div className="wf-title mb-2 text-[12px]">The Quiet Tithe</div>
            <p className="mb-3 text-[11px] leading-4 text-parchment">{titheLine}</p>
            <div className="wf-title mb-2 text-[12px]">The Four Trails</div>
            <ul className="space-y-1.5">
              {LANDMARKS.map((l) => (
                <li key={l.id} className="flex items-start gap-2">
                  <span
                    className={`mt-1 inline-block size-1.5 rounded-full ${trails[l.id] ? "bg-moss" : "bg-parchment/30"}`}
                  />
                  <span className={trails[l.id] ? "text-parchment-dim line-through" : ""}>
                    {l.name}
                    <span className="block text-[10px] text-parchment-dim">{l.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        {panel === "pack" && (
          <ul className="space-y-1">
            <li className="flex justify-between text-parchment-dim">
              Gold <span className="tabular-nums">{gold}</span>
            </li>
            {inventory.length === 0 && <li className="text-parchment-dim">The pack is light.</li>}
            {inventory.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>{i.name}</span>
                <span className="tabular-nums text-parchment-dim">{i.qty}</span>
              </li>
            ))}
          </ul>
        )}
        {panel === "map" && (
          <p className="text-parchment-dim">
            Square spawn. Halden at the fountain. Wren in the garden. Toller at the mill. Four trails leave the fork.
          </p>
        )}
        {panel === "skills" && (
          <ul className="space-y-1">
            {(
              [
                ["Explore", skills.explore],
                ["Forage", skills.forage],
                ["Woodcraft", skills.woodcraft],
                ["Lore", skills.lore],
                ["Binding", skills.binding],
              ] as const
            ).map(([n, v]) => (
              <li key={n} className="flex justify-between">
                {n} <span className="tabular-nums">{v}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Minimap({ tx, tz }: { tx: number; tz: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const known = useGame((s) => s.known);
  const trails = useGame((s) => s.trails);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const world = getWorld();
    const s = 2;
    c.width = TILES * s;
    c.height = TILES * s;
    ctx.fillStyle = "#0e1210";
    ctx.fillRect(0, 0, c.width, c.height);
    for (let z = 0; z < TILES; z++) {
      for (let x = 0; x < TILES; x++) {
        const i = z * TILES + x;
        if (!known[i]) continue;
        ctx.fillStyle = BIOME_MINI[world.biomes[i]] ?? "#2a4a28";
        ctx.fillRect(x * s, z * s, s, s);
      }
    }
    ctx.strokeStyle = "rgba(232,224,208,0.25)";
    ctx.beginPath();
    ctx.moveTo(c.width / 2, 0);
    ctx.lineTo(c.width / 2, c.height);
    ctx.moveTo(0, c.height / 2);
    ctx.lineTo(c.width, c.height / 2);
    ctx.stroke();
    for (const lm of LANDMARKS) {
      ctx.fillStyle = trails[lm.id] ? "#6b8f6a" : "#e8e0d0";
      ctx.beginPath();
      ctx.arc(lm.tx * s + 1, lm.tz * s + 1, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#c45c4a";
    ctx.beginPath();
    ctx.arc(tx * s + 1, tz * s + 1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e8e0d0";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }, [tx, tz, known, trails]);

  return (
    <div className="wf-panel pointer-events-none overflow-hidden p-1.5">
      <canvas ref={ref} className="block h-[108px] w-[108px] rounded-[10px] sm:h-[124px] sm:w-[124px]" />
    </div>
  );
}
