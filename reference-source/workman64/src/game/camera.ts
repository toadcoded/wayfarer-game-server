import { ISO_PITCH, ISO_YAW } from "./iso.ts";

/** Close over-the-shoulder chase. Cube-button snap returns to true isometric. */
export const CAM_YAW0 = ISO_YAW;
export const CAM_PITCH0 = 0.46;
export const CAM_ISO_PITCH = ISO_PITCH;
export const CAM_DIST0 = 8.2;
export const CAM_DIST_MIN = 4.6;
export const CAM_DIST_MAX = 15.5;
export const CAM_PITCH_MIN = 0.2;
export const CAM_PITCH_MAX = 0.86;
export const CAM_LOOK_Y = 1.48;
export const CAM_FOV = 50;
export const CAM_SHOULDER = 1.12;

export type CamRig = {
  yaw: number;
  pitch: number;
  dist: number;
  chase: boolean;
};

export function defaultCam(): CamRig {
  return { yaw: CAM_YAW0, pitch: CAM_PITCH0, dist: CAM_DIST0, chase: true };
}

export const liveCam: CamRig = defaultCam();

export function clampCam(rig: CamRig): CamRig {
  return {
    yaw: rig.yaw,
    pitch: Math.min(CAM_PITCH_MAX, Math.max(CAM_PITCH_MIN, rig.pitch)),
    dist: Math.min(CAM_DIST_MAX, Math.max(CAM_DIST_MIN, rig.dist)),
    chase: rig.chase,
  };
}

export function camOffset(rig: Pick<CamRig, "yaw" | "pitch" | "dist">) {
  const h = rig.dist * Math.cos(rig.pitch);
  return {
    x: h * Math.sin(rig.yaw),
    y: rig.dist * Math.sin(rig.pitch),
    z: h * Math.cos(rig.yaw),
  };
}

/** Camera-relative ground axes. W walks into the look direction on XZ. */
export function camAxes(yaw: number) {
  return {
    fwd: { x: -Math.sin(yaw), z: -Math.cos(yaw) },
    right: { x: Math.cos(yaw), z: -Math.sin(yaw) },
  };
}

export function applyZoom(deltaY: number) {
  const next = liveCam.dist * (1 + deltaY * 0.00135);
  liveCam.dist = Math.min(CAM_DIST_MAX, Math.max(CAM_DIST_MIN, next));
}

export function applyOrbit(dx: number, dy: number) {
  liveCam.yaw += dx * 0.0055;
  liveCam.pitch = Math.min(
    CAM_PITCH_MAX,
    Math.max(CAM_PITCH_MIN, liveCam.pitch + dy * 0.0038),
  );
  liveCam.chase = false;
}

export function resetCam(iso = false) {
  liveCam.yaw = CAM_YAW0;
  liveCam.pitch = iso ? CAM_ISO_PITCH : CAM_PITCH0;
  liveCam.dist = iso ? 12.5 : CAM_DIST0;
  liveCam.chase = true;
}

export function zoomBy(rig: CamRig, deltaY: number): CamRig {
  return clampCam({ ...rig, dist: rig.dist * (1 + deltaY * 0.00135) });
}

export function orbitBy(rig: CamRig, dx: number, dy: number): CamRig {
  return clampCam({
    ...rig,
    yaw: rig.yaw + dx * 0.0055,
    pitch: rig.pitch + dy * 0.0038,
    chase: false,
  });
}
