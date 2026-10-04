import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useGame, walkedCount, type PanelTab } from "./store";
import { TILES, getWorld, tileCoords, type LandmarkId } from "./world";

const TRAILS: { id: LandmarkId; label: string }[] = [
  { id: "west", label: "Western Shore" },
  { id: "east", label: "Eastern Rise" },
  { id: "south", label: "Southern Gate" },
  { id: "north", label: "North Bridge" },
];

export function Hud() {
  const started = useGame((s) => s.started);
  const paused = useGame((s) => s.paused);
  const panel = useGame((s) => s.panel);
  const x = useGame((s) => s.x);
  const z = useGame((s) => s.z);
  const hp = useGame((s) => s.hp);
  const stamina = useGame((s) => s.stamina);
  const biome = useGame((s) => s.biome);
  const walked = useGame((s) => s.walked);
  const knownCount = useGame((s) => s.knownCount);
  const pack = useGame((s) => s.pack);
  const wayfaring = useGame((s) => s.wayfaring);
  const log = useGame((s) => s.log);
  const { tx, tz } = tileCoords(x, z);

  if (!started) return <StartGate />;

  return (
    <div className="pointer-events-none absolute inset-0 text-ink">
      <div className="pointer-events-auto absolute left-3 top-3 w-[min(280px,calc(100vw-1.5rem))] rounded-[18px] border border-line bg-panel/92 p-3.5 shadow-overlay backdrop-blur-sm">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-[15px] font-semibold tracking-[0.18em] text-cream">
            WAYFARER
          </h1>
          <span className="font-mono text-[11px] text-mute">
            {tx},{tz} · r0,0
          </span>
        </div>
        <div className="mt-2.5 space-y-1.5">
          <Meter value={hp} tone="hp" />
          <Meter value={stamina} tone="st" />
        </div>
        <p className="mt-2 text-[12px] tracking-wide text-sage">{biome}</p>
        <p className="mt-1 text-[11px] text-mute">
          The Four Trails · {walkedCount(walked)}/4
        </p>
      </div>

      <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2">
        <Minimap x={x} z={z} />
        <button
          type="button"
          onClick={() => useGame.getState().pause()}
          className="flex h-10 items-center gap-2 rounded-xl border border-line bg-panel/92 px-3.5 text-[13px] text-cream shadow-overlay backdrop-blur-sm"
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      <div className="pointer-events-auto absolute bottom-24 right-3 hidden w-[min(300px,calc(100vw-1.5rem))] overflow-hidden rounded-[18px] border border-line bg-panel/92 shadow-overlay backdrop-blur-sm md:bottom-16 md:block">
        <div className="flex border-b border-line">
          {(["pack", "skills", "quest"] as PanelTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => useGame.getState().setPanel(tab)}
              className={`flex-1 px-3 py-2.5 text-[12px] tracking-wide capitalize ${
                panel === tab ? "bg-lift text-cream" : "text-mute"
              }`}
            >
              {tab === "pack" ? "Pack" : tab === "skills" ? "Skills" : "Quest"}
            </button>
          ))}
        </div>
        <div className="p-4">
          {panel === "quest" && (
            <div>
              <h2 className="font-display text-[17px] tracking-wide text-cream">The Four Trails</h2>
              <p className="mt-1 text-[13px] leading-snug text-mute">
                Leave the crossroads. Touch every shore.
              </p>
              <ul className="mt-3 space-y-1.5 text-[13px]">
                {TRAILS.map((t) => (
                  <li key={t.id} className="flex justify-between gap-3">
                    <span className={walked[t.id] ? "text-sage" : "text-mute"}>
                      {walked[t.id] ? "Walked" : "Unwalked"}
                    </span>
                    <span className="text-cream">{t.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] text-mute">
                {walkedCount(walked)}/4 · {knownCount} tiles known
              </p>
            </div>
          )}
          {panel === "pack" && (
            <div className="space-y-2 text-[13px] text-cream">
              <Row label="Trail blooms" value={pack.bloom} />
              <Row label="Driftwood" value={pack.wood} />
              <Row label="River stones" value={pack.stone} />
            </div>
          )}
          {panel === "skills" && (
            <div className="space-y-2 text-[13px] text-cream">
              <Row label="Wayfaring" value={Math.floor(wayfaring / 8)} />
              <Row label="Foraging" value={pack.bloom + pack.wood + pack.stone} />
              <Row label="Lore" value={walkedCount(walked)} />
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl border border-line bg-panel/90 px-3 py-2 shadow-overlay backdrop-blur-sm md:bottom-4">
        {log.slice(-2).map((line) => (
          <p key={line.id} className="truncate text-[12px] leading-5 text-cream/90 md:text-[13px]">
            <span className="text-mute">Realm: </span>
            {line.text}
          </p>
        ))}
      </div>

      <TouchStick />

      {paused && (
        <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-ink/55 p-6 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-overlay">
            <h2 className="font-display text-2xl text-cream">Paused</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">
              WASD to walk. Shift to run. Click the ground to path. Right-drag to look.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => useGame.getState().pause(false)}
                className="h-11 rounded-xl bg-cream text-sm font-medium text-ink"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => useGame.getState().reset()}
                className="h-11 rounded-xl border border-line text-sm text-cream"
              >
                New walk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-mute">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

function Meter({ value, tone }: { value: number; tone: "hp" | "st" }) {
  return (
    <div className="h-[7px] overflow-hidden rounded-full bg-ink/55">
      <div
        className={`h-full rounded-full ${tone === "hp" ? "bg-hp" : "bg-st"}`}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

function StartGate() {
  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center bg-ink/35 p-6 backdrop-blur-[1px] sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel/95 p-7 shadow-overlay">
        <p className="text-[11px] tracking-[0.28em] text-sage">HIGHLAND</p>
        <h1 className="mt-2 font-display text-4xl tracking-[0.18em] text-cream">WAYFARER</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-mute">
          Four trails leave the crossroads. Walk them, and the highland will know you.
        </p>
        <button
          type="button"
          onClick={() => useGame.getState().start()}
          className="mt-6 h-12 w-full rounded-xl bg-cream text-sm font-medium tracking-wide text-ink"
        >
          Enter the highland
        </button>
        <p className="mt-3 text-center text-[12px] text-mute">WASD · click to path · Shift run</p>
      </div>
    </div>
  );
}

function Minimap({ x, z }: { x: number; z: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useMemo(() => getWorld(), []);
  const known = useGame((s) => s.known);
  const walked = useGame((s) => s.walked);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const s = 2;
    c.width = TILES * s;
    c.height = TILES * s;
    const img = ctx.createImageData(c.width, c.height);
    const colors: Record<number, [number, number, number]> = {
      0: [62, 110, 122],
      1: [168, 176, 122],
      2: [86, 130, 74],
      3: [42, 92, 52],
      4: [120, 118, 88],
      5: [122, 98, 62],
    };
    for (let tz = 0; tz < TILES; tz++) {
      for (let tx = 0; tx < TILES; tx++) {
        const i = tz * TILES + tx;
        const revealed = known[i];
        const [r, g, b] = colors[world.biomes[i]!] ?? colors[2]!;
        for (let oy = 0; oy < s; oy++) {
          for (let ox = 0; ox < s; ox++) {
            const p = ((tz * s + oy) * c.width + (tx * s + ox)) * 4;
            const dim = revealed ? 1 : 0.22;
            img.data[p] = r * dim;
            img.data[p + 1] = g * dim;
            img.data[p + 2] = b * dim;
            img.data[p + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(232,224,208,0.35)";
    const mid = (TILES * s) / 2;
    ctx.beginPath();
    ctx.moveTo(mid, 0);
    ctx.lineTo(mid, c.height);
    ctx.moveTo(0, mid);
    ctx.lineTo(c.width, mid);
    ctx.stroke();
  }, [known, world]);

  const { tx, tz } = tileCoords(x, z);

  return (
    <div className="relative h-[148px] w-[148px] overflow-hidden rounded-2xl border border-line bg-panel shadow-overlay sm:h-[168px] sm:w-[168px]">
      <canvas ref={canvas} className="h-full w-full" />
      {world.landmarks.map((lm) => {
        const p = tileCoords(lm.x, lm.z);
        return (
          <span
            key={lm.id}
            className={`absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              walked[lm.id] ? "bg-sage" : "bg-cream/80"
            }`}
            style={{ left: `${(p.tx / TILES) * 100}%`, top: `${(p.tz / TILES) * 100}%` }}
          />
        );
      })}
      <span
        className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hp ring-2 ring-cream"
        style={{ left: `${(tx / TILES) * 100}%`, top: `${(tz / TILES) * 100}%` }}
      />
    </div>
  );
}

function TouchStick() {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0, show: false });

  useEffect(() => {
    return () => {
      window.__wayfarerStick = { x: 0, z: 0, run: false };
    };
  }, []);

  return (
    <div
      className="pointer-events-auto absolute bottom-16 left-3 h-36 w-36 touch-none md:hidden"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        origin.current = { x: e.clientX, y: e.clientY };
        setKnob({ x: 0, y: 0, show: true });
      }}
      onPointerMove={(e) => {
        if (!origin.current) return;
        const dx = e.clientX - origin.current.x;
        const dy = e.clientY - origin.current.y;
        const len = Math.hypot(dx, dy) || 1;
        const max = 42;
        const k = Math.min(1, len / max);
        const nx = (dx / len) * k;
        const ny = (dy / len) * k;
        setKnob({ x: nx * max, y: ny * max, show: true });
        window.__wayfarerStick = { x: nx, z: ny, run: k > 0.85 };
      }}
      onPointerUp={() => {
        origin.current = null;
        setKnob({ x: 0, y: 0, show: false });
        window.__wayfarerStick = { x: 0, z: 0, run: false };
      }}
    >
      <div className="absolute inset-4 rounded-full border border-line bg-panel/50">
        <div
          className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream/80"
          style={{
            transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
            opacity: knob.show ? 1 : 0.55,
          }}
        />
      </div>
    </div>
  );
}
