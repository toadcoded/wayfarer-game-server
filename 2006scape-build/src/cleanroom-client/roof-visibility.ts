/**
 * Project Copper Lantern — overhead roof presentation control.
 *
 * This is render-only: hiding roofs never removes walls, floors, stairs,
 * collision, lighting anchors, or authoritative world geometry.
 */

export type RoofVisibilityModel = Readonly<{
  visible: boolean;
  mode: "roofs-visible" | "roofs-hidden";
  label: "Roofs on" | "Roofs off";
  affects: "overhead-rendering-only";
}>;

export const DEFAULT_ROOF_VISIBILITY = true;

export function createRoofVisibilityModel(visible: boolean): RoofVisibilityModel {
  return {
    visible,
    mode: visible ? "roofs-visible" : "roofs-hidden",
    label: visible ? "Roofs on" : "Roofs off",
    affects: "overhead-rendering-only",
  };
}

export function toggleRoofVisibility(visible: boolean): boolean {
  return !visible;
}
