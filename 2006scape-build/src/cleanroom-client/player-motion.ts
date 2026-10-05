/**
 * Project Copper Lantern — original procedural player motion.
 *
 * Presentation-only pose offsets. This layer never changes authoritative
 * position, collision, inventory, or action outcomes.
 */

export type Vec3 = { x: number; y: number; z: number };
export type Euler = { x: number; y: number; z: number };

export type MotionState =
  | "idle"
  | "walking"
  | "running"
  | "gathering"
  | "opening-door"
  | "climbing"
  | "crawling";

export type PlayerMotionInput = {
  playerId: string;
  timeSeconds: number;
  deltaSeconds: number;
  state: MotionState;
  speed01: number;
  moveDirection?: Vec3;
  facingRadians: number;
  actionProgress01?: number;
};

export type Pose = {
  rootPosition: Vec3;
  rootRotation: Euler;
  chestRotation: Euler;
  headRotation: Euler;
  leftUpperArmRotation: Euler;
  rightUpperArmRotation: Euler;
  leftForearmRotation: Euler;
  rightForearmRotation: Euler;
  leftHandRotation: Euler;
  rightHandRotation: Euler;
  leftThighRotation: Euler;
  rightThighRotation: Euler;
  leftShinRotation: Euler;
  rightShinRotation: Euler;
  leftFootRotation: Euler;
  rightFootRotation: Euler;
};

type MotionMemory = {
  idleClock: number;
  walkClock: number;
  actionClock: number;
  lastTime: number;
  previousState: MotionState;
  motionWeight: number;
  actionWeight: number;
};

const TAU = Math.PI * 2;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const easeInOutCubic = (v: number) => {
  const x = clamp01(v);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
const approach = (current: number, target: number, rate: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-rate * dt));
const wave = (time: number, frequency: number, phase = 0) =>
  Math.sin(time * TAU * frequency + phase);

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function basePose(facingRadians: number): Pose {
  const zero = (): Euler => ({ x: 0, y: 0, z: 0 });
  return {
    rootPosition: { x: 0, y: 0, z: 0 },
    rootRotation: { x: 0, y: facingRadians, z: 0 },
    chestRotation: zero(),
    headRotation: zero(),
    leftUpperArmRotation: zero(),
    rightUpperArmRotation: zero(),
    leftForearmRotation: zero(),
    rightForearmRotation: zero(),
    leftHandRotation: zero(),
    rightHandRotation: zero(),
    leftThighRotation: zero(),
    rightThighRotation: zero(),
    leftShinRotation: zero(),
    rightShinRotation: zero(),
    leftFootRotation: zero(),
    rightFootRotation: zero(),
  };
}

export class PlayerMotionController {
  private readonly seed: number;
  private memory: MotionMemory;

  public constructor(playerId: string) {
    this.seed = hashSeed(playerId);
    this.memory = {
      idleClock: 0,
      walkClock: 0,
      actionClock: 0,
      lastTime: 0,
      previousState: "idle",
      motionWeight: 0,
      actionWeight: 0,
    };
  }

  public update(input: PlayerMotionInput): Pose {
    const dt = Math.max(0, Math.min(input.deltaSeconds, 0.1));
    const time = Math.max(input.timeSeconds, this.memory.lastTime);
    const moving = input.state === "walking" || input.state === "running";
    const acting = !moving && input.state !== "idle";
    const targetMotionWeight = moving ? clamp01(input.speed01) : 0;
    const targetActionWeight = acting ? 1 : 0;

    if (input.state !== this.memory.previousState) {
      this.memory.actionClock = 0;
      this.memory.previousState = input.state;
    }

    // A slower response gives the body mass: the torso follows the intent
    // instead of snapping to the new speed or action pose.
    this.memory.motionWeight = approach(this.memory.motionWeight, targetMotionWeight, 6.5, dt);
    this.memory.actionWeight = approach(this.memory.actionWeight, targetActionWeight, 8.5, dt);
    this.memory.idleClock = moving || acting ? 0 : this.memory.idleClock + dt;
    // Keep one shared cadence for both legs and derive every opposing limb
    // from it, preventing visual phase drift over long walks.
    this.memory.walkClock += dt * lerp(0.72, 2.05, this.memory.motionWeight);
    this.memory.actionClock += acting ? dt : 0;
    this.memory.lastTime = time;

    const pose = basePose(input.facingRadians);
    this.applyIdleBreathAndMicroSway(pose, time, this.memory.idleClock, this.memory.motionWeight, this.memory.actionWeight);
    this.applyWalkCycle(pose, this.memory.walkClock, this.memory.motionWeight);
    this.applyGroundedWeightShift(pose, this.memory.walkClock, this.memory.motionWeight);

    if (acting || this.memory.actionWeight > 0.001) {
      const progress = easeInOutCubic(clamp01(input.actionProgress01 ?? 0.5));
      this.applyActionPose(pose, input.state, this.memory.actionClock, progress, this.memory.actionWeight);
    }
    return pose;
  }

  private applyIdleBreathAndMicroSway(
    pose: Pose,
    time: number,
    idleClock: number,
    motionWeight: number,
    actionWeight: number,
  ): void {
    const personalPhase = this.seed * TAU;
    const idleFade = lerp(1, 0.28, clamp01(motionWeight + actionWeight));
    const breath = wave(time, 0.19, personalPhase) * 0.5 + wave(time, 0.095, personalPhase * 0.7) * 0.5;
    const secondary = wave(time, 0.31, personalPhase + 1.7);
    const slowSway = wave(time, 0.043, personalPhase + 0.4);
    const tinySway = wave(time, 0.071, personalPhase + 2.1);
    const fatigue = smoothstep(idleClock / 8);
    const swayScale = idleFade * (0.65 + fatigue * 0.35);

    pose.rootPosition.y += breath * 0.008 * idleFade;
    pose.chestRotation.x += breath * 0.018 * idleFade;
    pose.chestRotation.z += secondary * 0.008 * idleFade;
    pose.headRotation.x -= breath * 0.006 * idleFade;
    pose.rootRotation.z += slowSway * 0.012 * swayScale;
    pose.chestRotation.y += tinySway * 0.012 * swayScale;
    pose.leftUpperArmRotation.z += (slowSway * 0.018 + secondary * 0.006) * swayScale;
    pose.rightUpperArmRotation.z += (-slowSway * 0.016 + secondary * 0.005) * swayScale;
    pose.leftHandRotation.y += tinySway * 0.025 * swayScale;
    pose.rightHandRotation.y -= tinySway * 0.021 * swayScale;
    pose.leftThighRotation.z -= tinySway * 0.006 * swayScale;
    pose.rightThighRotation.z += tinySway * 0.007 * swayScale;
  }

  private applyWalkCycle(pose: Pose, clock: number, motionWeight: number): void {
    if (motionWeight < 0.001) return;
    const stride = wave(clock, 1);
    const oppositeStride = -stride; // exact bilateral phase lock
    const stance = 0.5 + 0.5 * Math.cos(clock * TAU);
    const footfallImpact = Math.pow(Math.max(0, Math.cos(clock * TAU)), 3);
    const lift = Math.max(0, -stride);
    const oppositeLift = Math.max(0, -oppositeStride);
    const heavy = 0.88 + motionWeight * 0.5;
    const bounce = Math.abs(wave(clock, 2)) * 0.010 * motionWeight;
    const armSwing = 0.30 * motionWeight;

    // The root settles into each footfall; this gives weight without changing world position.
    pose.rootPosition.y += bounce - (0.008 * stance + 0.010 * footfallImpact) * motionWeight;
    pose.rootRotation.x -= footfallImpact * 0.018 * motionWeight;
    pose.chestRotation.x += footfallImpact * 0.014 * motionWeight;
    pose.chestRotation.y += stride * 0.018 * motionWeight;
    pose.leftThighRotation.x += stride * 0.52 * heavy;
    pose.rightThighRotation.x += oppositeStride * 0.52 * heavy;
    pose.leftShinRotation.x += lift * 0.34 * heavy;
    pose.rightShinRotation.x += oppositeLift * 0.34 * heavy;
    pose.leftFootRotation.x -= lift * 0.16 * heavy;
    pose.rightFootRotation.x -= oppositeLift * 0.16 * heavy;
    pose.leftUpperArmRotation.x += oppositeStride * armSwing;
    pose.rightUpperArmRotation.x += stride * armSwing;
    pose.leftForearmRotation.x += lift * 0.07;
    pose.rightForearmRotation.x += oppositeLift * 0.07;
    pose.headRotation.y -= stride * 0.014 * motionWeight;
  }

  private applyGroundedWeightShift(pose: Pose, clock: number, motionWeight: number): void {
    const footfall = Math.sin(clock * TAU);
    const weight = footfall * 0.020 * motionWeight;
    pose.rootRotation.z += weight;
    pose.chestRotation.z -= weight * 0.7;
    pose.leftHandRotation.z -= weight * 0.35;
    pose.rightHandRotation.z -= weight * 0.35;
  }

  private applyActionPose(
    pose: Pose,
    state: MotionState,
    clock: number,
    progress: number,
    actionWeight: number,
  ): void {
    const ease = easeInOutCubic(progress) * actionWeight;
    const pulse = 0.5 + 0.5 * wave(clock, 0.7);
    switch (state) {
      case "gathering":
        pose.rootPosition.y -= 0.05 * ease;
        pose.chestRotation.x += 0.24 * ease;
        pose.leftUpperArmRotation.x += 0.45 * ease;
        pose.rightUpperArmRotation.x += 0.5 * ease;
        pose.leftForearmRotation.x -= 0.3 * ease;
        pose.rightForearmRotation.x -= 0.34 * ease;
        break;
      case "opening-door":
        pose.chestRotation.y += 0.12 * ease;
        pose.rightUpperArmRotation.x -= 0.52 * ease;
        pose.rightUpperArmRotation.z -= 0.16 * ease;
        pose.rightForearmRotation.x -= 0.35 * ease;
        pose.rootRotation.z -= 0.035 * ease;
        break;
      case "climbing":
        pose.rootPosition.y += wave(clock, 0.65) * 0.02 * actionWeight;
        pose.leftUpperArmRotation.x += wave(clock, 0.65) * 0.45 * actionWeight;
        pose.rightUpperArmRotation.x += wave(clock, 0.65, Math.PI) * 0.45 * actionWeight;
        pose.leftThighRotation.x += wave(clock, 0.65, Math.PI) * 0.28 * actionWeight;
        pose.rightThighRotation.x += wave(clock, 0.65) * 0.28 * actionWeight;
        break;
      case "crawling":
        pose.rootPosition.y -= 0.18 * ease;
        pose.chestRotation.x += 0.32 * ease;
        pose.leftThighRotation.x += wave(clock, 0.8) * 0.3 * actionWeight;
        pose.rightThighRotation.x += wave(clock, 0.8, Math.PI) * 0.3 * actionWeight;
        break;
      default:
        pose.chestRotation.x += pulse * 0.01 * actionWeight;
    }
  }
}

export function blendPose(a: Pose, b: Pose, weight: number): Pose {
  const t = clamp01(weight);
  const blendEuler = (x: Euler, y: Euler): Euler => ({
    x: lerp(x.x, y.x, t), y: lerp(x.y, y.y, t), z: lerp(x.z, y.z, t),
  });
  const blendVec = (x: Vec3, y: Vec3): Vec3 => ({
    x: lerp(x.x, y.x, t), y: lerp(x.y, y.y, t), z: lerp(x.z, y.z, t),
  });
  return {
    rootPosition: blendVec(a.rootPosition, b.rootPosition),
    rootRotation: blendEuler(a.rootRotation, b.rootRotation),
    chestRotation: blendEuler(a.chestRotation, b.chestRotation),
    headRotation: blendEuler(a.headRotation, b.headRotation),
    leftUpperArmRotation: blendEuler(a.leftUpperArmRotation, b.leftUpperArmRotation),
    rightUpperArmRotation: blendEuler(a.rightUpperArmRotation, b.rightUpperArmRotation),
    leftForearmRotation: blendEuler(a.leftForearmRotation, b.leftForearmRotation),
    rightForearmRotation: blendEuler(a.rightForearmRotation, b.rightForearmRotation),
    leftHandRotation: blendEuler(a.leftHandRotation, b.leftHandRotation),
    rightHandRotation: blendEuler(a.rightHandRotation, b.rightHandRotation),
    leftThighRotation: blendEuler(a.leftThighRotation, b.leftThighRotation),
    rightThighRotation: blendEuler(a.rightThighRotation, b.rightThighRotation),
    leftShinRotation: blendEuler(a.leftShinRotation, b.leftShinRotation),
    rightShinRotation: blendEuler(a.rightShinRotation, b.rightShinRotation),
    leftFootRotation: blendEuler(a.leftFootRotation, b.leftFootRotation),
    rightFootRotation: blendEuler(a.rightFootRotation, b.rightFootRotation),
  };
}
