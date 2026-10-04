let ctx: AudioContext | null = null;
let started = false;

export function unlockAudio() {
  if (started) return;
  started = true;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    const resume = () => ctx?.state === "suspended" && ctx.resume();
    resume();
    document.addEventListener("visibilitychange", resume);
    drone();
  } catch {
    /* no audio */
  }
}

function drone() {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const f = ctx.createOscillator();
  const fg = ctx.createGain();
  o.type = "sine";
  o.frequency.value = 92;
  g.gain.value = 0.018;
  f.type = "triangle";
  f.frequency.value = 184;
  fg.gain.value = 0.008;
  o.connect(g).connect(ctx.destination);
  f.connect(fg).connect(ctx.destination);
  o.start();
  f.start();
}
