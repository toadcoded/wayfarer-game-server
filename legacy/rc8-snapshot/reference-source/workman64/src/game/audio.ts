let ctx: AudioContext | null = null;
let started = false;

function ac() {
  if (!ctx) return null;
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  if (started) return;
  started = true;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  const f = c.createOscillator();
  const fg = c.createGain();
  o.type = "sine";
  o.frequency.value = 92;
  g.gain.value = 0.016;
  f.type = "triangle";
  f.frequency.value = 184;
  fg.gain.value = 0.007;
  o.connect(g).connect(c.destination);
  f.connect(fg).connect(c.destination);
  o.start();
  f.start();
}

export function footstep() {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = 90 + Math.random() * 30;
  g.gain.value = 0.03;
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.08);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.09);
}

export function gatherChime() {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.value = 420;
  o.frequency.exponentialRampToValueAtTime(660, c.currentTime + 0.12);
  g.gain.value = 0.04;
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.22);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.24);
}
