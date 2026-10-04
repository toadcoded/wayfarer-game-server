export type AtmosphereQuality = "high" | "low" | "off";

export type AtmosphereCache = {
  width: number;
  height: number;
  quality: AtmosphereQuality;
  sky: CanvasGradient | null;
  vignette: CanvasGradient | null;
  rays: ReadonlyArray<readonly [number, number, number, number]>;
  motes: ReadonlyArray<{ x: number; y: number; phase: number; size: number }>;
};

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function chooseAtmosphereQuality(env: {
  reducedMotion: boolean;
  reduceEffects: boolean;
  dpr: number;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}): AtmosphereQuality {
  if (env.reduceEffects) return "low";
  if (env.reducedMotion) return "low";
  if (env.dpr > 1.5 && ((env.deviceMemory ?? 8) <= 4 || (env.hardwareConcurrency ?? 8) <= 4)) {
    return "low";
  }
  return "high";
}

export function buildAtmosphereCache(
  width: number,
  height: number,
  quality: AtmosphereQuality,
): AtmosphereCache {
  if (quality === "off") {
    return { width, height, quality, sky: null, vignette: null, rays: [], motes: [] };
  }
  const sky = document.createElement("canvas").getContext("2d")?.createLinearGradient(0, 0, 0, height) ?? null;
  sky?.addColorStop(0, "#263743");
  sky?.addColorStop(0.52, "#516d70");
  sky?.addColorStop(1, "#738b67");

  const vignette = document.createElement("canvas").getContext("2d")?.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.18,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72,
  ) ?? null;
  vignette?.addColorStop(0, "rgba(7, 12, 14, 0)");
  vignette?.addColorStop(1, "rgba(7, 12, 14, 0.38)");

  const rays: Array<readonly [number, number, number, number]> = [
    [width * 0.16, -height * 0.1, width * 0.52, height * 0.76],
    [width * 0.33, -height * 0.1, width * 0.68, height * 0.76],
    [width * 0.5, -height * 0.1, width * 0.84, height * 0.76],
  ];
  const random = seeded(Math.max(1, width * 31 + height * 17));
  const motes = quality === "high"
    ? Array.from({ length: 18 }, () => ({
        x: random() * width,
        y: random() * height,
        phase: random() * Math.PI * 2,
        size: 0.6 + random() * 1.4,
      }))
    : [];
  return { width, height, quality, sky, vignette, rays, motes };
}

export function paintSkyBackplate(ctx: CanvasRenderingContext2D, cache: AtmosphereCache) {
  if (cache.sky) ctx.fillStyle = cache.sky;
  else ctx.fillStyle = "#263743";
  ctx.fillRect(0, 0, cache.width, cache.height);
}

export function paintSunlight(
  ctx: CanvasRenderingContext2D,
  cache: AtmosphereCache,
  strength = 0.12,
) {
  if (cache.quality === "off") return;
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.fillStyle = "#f4d39a";
  for (const [x1, y1, x2, y2] of cache.rays.slice(0, cache.quality === "high" ? 3 : 1)) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + cache.width * 0.12, y1);
    ctx.lineTo(x2 + cache.width * 0.12, y2);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function paintAtmosphere(
  ctx: CanvasRenderingContext2D,
  cache: AtmosphereCache,
  now: number,
  animate: boolean,
) {
  if (cache.quality === "off") return;
  if (cache.vignette) {
    ctx.fillStyle = cache.vignette;
    ctx.fillRect(0, 0, cache.width, cache.height);
  }
  if (cache.quality !== "high" || !animate) return;
  ctx.fillStyle = "rgba(245, 224, 169, 0.36)";
  for (const mote of cache.motes) {
    const drift = Math.sin(now / 1800 + mote.phase) * 3;
    ctx.globalAlpha = 0.35 + Math.sin(now / 700 + mote.phase) * 0.12;
    ctx.fillRect(mote.x + drift, mote.y, mote.size, mote.size);
  }
  ctx.globalAlpha = 1;
}
