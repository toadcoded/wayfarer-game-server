import { useEffect, useRef } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { LANDMARKS, TILES, biomeLabel, getWorld, worldToTile } from "./world.ts";
import { trailCount, useGame, type Panel } from "./store.ts";

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
  const biome = useGame((s) => s.biome);
  const trails = useGame((s) => s.trails);
  const knownCount = useGame((s) => s.knownCount);
  const panel = useGame((s) => s.panel);
  const log = useGame((s) => s.log);
  const inventory = useGame((s) => s.inventory);
  const skills = useGame((s) => s.skills);
  const { tx, tz } = worldToTile(x, z);
  const done = trailCount(trails);

  if (!started) return null;

  return (
    <div className="wf-hud">
      <div className="pointer-events-none absolute inset-0 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="wf-panel pointer-events-auto w-[min(320px,calc(100%-132px))] px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <div className="wf-title text-[13px] sm:text-[15px]">Wayfarer</div>
              <div className="font-mono text-[11px] text-parchment-dim tabular-nums">
                {tx},{tz}
              </div>
            </div>
            <div className="wf-bar mt-2">
              <span className="bg-blood" style={{ width: `${Math.round(hp * 100)}%` }} />
            </div>
            <div className="wf-bar mt-1.5">
              <span className="bg-moss" style={{ width: `${Math.round(stamina * 100)}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-parchment-dim">
              <span>{biomeLabel(biome)}</span>
              <span className="hidden sm:inline">{knownCount} tiles known</span>
            </div>
            <div className="mt-1 text-[12px] text-parchment sm:hidden">
              The Four Trails · {done}/4
            </div>
          </div>
          <Minimap tx={tx} tz={tz} />
        </div>

        <div className="mt-2 hidden justify-end sm:flex">
          <QuestPanel panel={panel} trails={trails} inventory={inventory} skills={skills} />
        </div>
      </div>

      <div className="absolute right-3 top-[148px] sm:right-4 sm:top-[172px]">
        <button
          type="button"
          className="wf-panel flex h-11 items-center gap-2 px-3 text-[12px] tracking-wider uppercase"
          onClick={() => useGame.getState().setPaused(!paused)}
        >
          {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto sm:w-[min(420px,52vw)]">
        <div className="wf-panel wf-log px-3 py-2">
          {log.slice(-2).map((l, i) => (
            <div key={l.t + i}>Realm: {l.msg}</div>
          ))}
        </div>
      </div>

      {paused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/55 p-6">
          <div className="wf-panel w-[min(360px,100%)] px-6 py-7 text-center">
            <div className="wf-title text-lg">Paused</div>
            <p className="mt-2 text-sm text-parchment-dim">
              WASD walks the isometric plane. Click the land to path. E speaks to Rowan.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" className="wf-btn" onClick={() => useGame.getState().setPaused(false)}>
                Resume
              </button>
              <button
                type="button"
                className="wf-btn"
                onClick={() => useGame.getState().reset()}
              >
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

function QuestPanel({
  panel,
  trails,
  inventory,
  skills,
}: {
  panel: Panel;
  trails: Record<string, boolean>;
  inventory: { id: string; name: string; qty: number }[];
  skills: { explore: number; forage: number; woodcraft: number };
}) {
  return (
    <div className="wf-panel pointer-events-auto w-[260px] overflow-hidden">
      <div className="flex border-b border-parchment/10 text-[11px] tracking-widest uppercase">
        {(["quest", "pack", "skills"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={`flex-1 px-2 py-2 ${panel === p ? "bg-ink-3 text-parchment" : "text-parchment-dim"}`}
            onClick={() => useGame.getState().setPanel(p)}
          >
            {p === "quest" ? "Quest" : p === "pack" ? "Pack" : "Skills"}
          </button>
        ))}
      </div>
      <div className="px-3 py-3 text-[12px]">
        {panel === "quest" && (
          <>
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
            {inventory.length === 0 && <li className="text-parchment-dim">The pack is light.</li>}
            {inventory.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>{i.name}</span>
                <span className="tabular-nums text-parchment-dim">{i.qty}</span>
              </li>
            ))}
          </ul>
        )}
        {panel === "skills" && (
          <ul className="space-y-1">
            <li className="flex justify-between">
              Explore <span className="tabular-nums">{skills.explore}</span>
            </li>
            <li className="flex justify-between">
              Forage <span className="tabular-nums">{skills.forage}</span>
            </li>
            <li className="flex justify-between">
              Woodcraft <span className="tabular-nums">{skills.woodcraft}</span>
            </li>
          </ul>
        )}
        {panel === null && <p className="text-parchment-dim">Open a ledger.</p>}
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
