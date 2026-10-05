/**
 * Project Copper Lantern — compact HUD compass.
 * Renderers may place this model at the top-right corner.
 */

export type CardinalDirection = "N" | "E" | "S" | "W";

export type CompassHudModel = Readonly<{
  placement: "top-right";
  size: "small";
  headingDegrees: number;
  facing: CardinalDirection;
  ticks: readonly CardinalDirection[];
  visible: true;
}>;

export function headingFromRadians(radians: number): number {
  const degrees = (radians * 180) / Math.PI;
  return (degrees % 360 + 360) % 360;
}

export function cardinalFromRadians(radians: number): CardinalDirection {
  const heading = headingFromRadians(radians);
  if (heading >= 315 || heading < 45) return "N";
  if (heading < 135) return "E";
  if (heading < 225) return "S";
  return "W";
}

export function createCompassHud(facingRadians: number): CompassHudModel {
  return {
    placement: "top-right",
    size: "small",
    headingDegrees: headingFromRadians(facingRadians),
    facing: cardinalFromRadians(facingRadians),
    ticks: ["N", "E", "S", "W"],
    visible: true,
  };
}
