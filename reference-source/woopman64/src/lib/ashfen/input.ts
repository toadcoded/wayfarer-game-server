/** Shared held-key bus for keyboard, HUD pad, and `__controlsTest`. */
export const held = new Set<string>();

export function press(code: string) {
  held.add(code);
}

export function release(code: string) {
  held.delete(code);
}

export function setHeld(codes: string[]) {
  held.clear();
  for (const c of codes) held.add(c);
}

export function clearHeld() {
  held.clear();
}

export function axisFromHeld(keys: Set<string> = held): { ax: number; ay: number } {
  const ax =
    (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
    (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  const ay =
    (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
    (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
  return { ax, ay };
}
