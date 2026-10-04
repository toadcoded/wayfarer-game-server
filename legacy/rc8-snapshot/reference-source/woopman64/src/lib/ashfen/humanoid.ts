import * as THREE from "three";
import { walkJoints, type WalkJoints } from "./pose";

export type HumanoidPalette = {
  skin: number;
  hair: number;
  shirt: number;
  pants: number;
  boots: number;
  belt: number;
};

export const PAL_PLAYER: HumanoidPalette = {
  skin: 0xc4a07a,
  hair: 0x2c2418,
  shirt: 0x3d6b3a,
  pants: 0x3a342c,
  boots: 0x241c14,
  belt: 0xc4a574,
};

export const PAL_WREN: HumanoidPalette = {
  skin: 0xb8906c,
  hair: 0x4a3a68,
  shirt: 0x4a3d78,
  pants: 0x2e2a38,
  boots: 0x1c1814,
  belt: 0xd4c4a0,
};

export const PAL_HALDEN: HumanoidPalette = {
  skin: 0xc8b090,
  hair: 0x6a6860,
  shirt: 0x6a7078,
  pants: 0x3a3e44,
  boots: 0x2a2c30,
  belt: 0xb8a070,
};

export const PAL_TOLLER: HumanoidPalette = {
  skin: 0xc8a070,
  hair: 0x3a2818,
  shirt: 0x8a5a32,
  pants: 0x4a3828,
  boots: 0x2a1c10,
  belt: 0xe2d09a,
};

export type HumanoidRig = {
  root: THREE.Group;
  hips: THREE.Object3D;
  torso: THREE.Object3D;
  head: THREE.Object3D;
  lThigh: THREE.Object3D;
  rThigh: THREE.Object3D;
  lShin: THREE.Object3D;
  rShin: THREE.Object3D;
  lArm: THREE.Object3D;
  rArm: THREE.Object3D;
  lFore: THREE.Object3D;
  rFore: THREE.Object3D;
  phase: number;
  mats: THREE.Material[];
};

function mat(color: number, mats: THREE.Material[]): THREE.MeshLambertMaterial {
  const m = new THREE.MeshLambertMaterial({ color, flatShading: true });
  mats.push(m);
  return m;
}

function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  y = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.y = y;
  mesh.castShadow = true;
  return mesh;
}

/** Jointed low-poly person. Local +Z is the face/walk forward. Feet at y=0. */
export function createHumanoid(
  palette: HumanoidPalette,
  scale = 1,
  opts?: { lantern?: boolean },
): HumanoidRig {
  const mats: THREE.Material[] = [];
  const skin = mat(palette.skin, mats);
  const hair = mat(palette.hair, mats);
  const shirt = mat(palette.shirt, mats);
  const pants = mat(palette.pants, mats);
  const boots = mat(palette.boots, mats);
  const belt = mat(palette.belt, mats);
  const eye = mat(0x1a1612, mats);

  const root = new THREE.Group();
  root.scale.setScalar(scale);

  const hips = new THREE.Group();
  hips.position.y = 0.9;
  root.add(hips);

  const pelvis = box(0.26, 0.14, 0.15, pants, 0);
  hips.add(pelvis);
  const beltMesh = box(0.28, 0.05, 0.16, belt, 0.08);
  hips.add(beltMesh);

  const torso = new THREE.Group();
  torso.position.y = 0.1;
  hips.add(torso);
  torso.add(box(0.3, 0.42, 0.16, shirt, 0.28));
  if (opts?.lantern) {
    const copper = mat(0xb08968, mats);
    const glow = new THREE.MeshLambertMaterial({
      color: 0xc9e8c4,
      emissive: 0x6f8f78,
      emissiveIntensity: 0.85,
      flatShading: true,
    });
    mats.push(glow);
    const pole = box(0.03, 0.28, 0.03, copper, 0.18);
    pole.position.set(0, 0.18, -0.12);
    torso.add(pole);
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.09), glow);
    housing.position.set(0, 0.38, -0.12);
    housing.castShadow = true;
    torso.add(housing);
  }
  // collarbone / neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 6), skin);
  neck.position.y = 0.54;
  neck.castShadow = true;
  torso.add(neck);

  const head = new THREE.Group();
  head.position.y = 0.68;
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.112, 8, 6), skin);
  skull.castShadow = true;
  head.add(skull);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.116, 8, 6), hair);
  hairCap.scale.set(1.02, 0.72, 1.05);
  hairCap.position.y = 0.05;
  hairCap.castShadow = true;
  head.add(hairCap);
  const nose = box(0.03, 0.035, 0.05, skin, -0.01);
  nose.position.z = 0.11;
  head.add(nose);
  const le = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), eye);
  le.position.set(-0.038, 0.02, 0.096);
  const re = le.clone();
  re.position.x = 0.038;
  head.add(le, re);

  function arm(side: number) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.2, 0.42, 0);
    torso.add(shoulder);
    const upper = new THREE.Group();
    shoulder.add(upper);
    const u = box(0.07, 0.28, 0.07, shirt, -0.14);
    upper.add(u);
    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    upper.add(elbow);
    elbow.add(box(0.06, 0.26, 0.06, skin, -0.13));
    const hand = box(0.055, 0.08, 0.07, skin, -0.3);
    elbow.add(hand);
    return { upper, elbow };
  }
  const L = arm(-1);
  const R = arm(1);

  function leg(side: number) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.075, -0.04, 0);
    hips.add(hip);
    const thigh = new THREE.Group();
    hip.add(thigh);
    thigh.add(box(0.09, 0.42, 0.1, pants, -0.21));
    const knee = new THREE.Group();
    knee.position.y = -0.42;
    thigh.add(knee);
    knee.add(box(0.078, 0.4, 0.08, pants, -0.2));
    const foot = box(0.08, 0.07, 0.18, boots, -0.43);
    foot.position.z = 0.04;
    knee.add(foot);
    return { thigh, knee };
  }
  const lLeg = leg(-1);
  const rLeg = leg(1);

  return {
    root,
    hips,
    torso,
    head,
    lThigh: lLeg.thigh,
    rThigh: rLeg.thigh,
    lShin: lLeg.knee,
    rShin: rLeg.knee,
    lArm: L.upper,
    rArm: R.upper,
    lFore: L.elbow,
    rFore: R.elbow,
    phase: 0,
    mats,
  };
}

export function applyJoints(rig: HumanoidRig, j: WalkJoints) {
  rig.hips.position.y = 0.9 + j.bob;
  rig.hips.rotation.z = j.sway;
  rig.hips.rotation.y = j.torsoYaw * 0.35;
  rig.torso.rotation.x = j.lean;
  rig.torso.rotation.y = j.torsoYaw;
  rig.head.rotation.x = j.headPitch;
  rig.lThigh.rotation.x = j.leftThigh;
  rig.rThigh.rotation.x = j.rightThigh;
  rig.lShin.rotation.x = j.leftShin;
  rig.rShin.rotation.x = j.rightShin;
  rig.lArm.rotation.x = j.leftArm;
  rig.rArm.rotation.x = j.rightArm;
  rig.lFore.rotation.x = j.leftFore;
  rig.rFore.rotation.x = j.rightFore;
}

export function applyWalk(rig: HumanoidRig, moving: boolean | number, gather = 0) {
  applyJoints(rig, walkJoints(rig.phase, moving, gather));
}

export type MireRig = {
  root: THREE.Group;
  body: THREE.Object3D;
  legs: THREE.Object3D[];
  phase: number;
  mats: THREE.Material[];
};

export function createMireling(): MireRig {
  const mats: THREE.Material[] = [];
  const moss = mat(0x4a6a38, mats);
  const belly = mat(0x6a7a48, mats);
  const eye = mat(0xc4a574, mats);
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.28;
  root.add(body);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5), moss);
  torso.scale.set(1.1, 0.75, 1.35);
  torso.castShadow = true;
  body.add(torso);
  const gut = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 4), belly);
  gut.position.set(0, -0.04, 0.08);
  body.add(gut);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), moss);
  head.position.set(0, 0.1, 0.22);
  head.castShadow = true;
  body.add(head);
  const le = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 4), eye);
  le.position.set(-0.045, 0.13, 0.31);
  const re = le.clone();
  re.position.x = 0.045;
  body.add(le, re);
  const legs: THREE.Object3D[] = [];
  for (const [x, z] of [
    [-0.12, 0.1],
    [0.12, 0.1],
    [-0.12, -0.12],
    [0.12, -0.12],
  ] as const) {
    const g = new THREE.Group();
    g.position.set(x, 0.18, z);
    root.add(g);
    g.add(box(0.05, 0.22, 0.05, moss, -0.1));
    legs.push(g);
  }
  return { root, body, legs, phase: 0, mats };
}

export function applyMireWalk(rig: MireRig, moving: boolean) {
  rig.body.rotation.x = moving ? -0.18 : -0.08;
  rig.legs.forEach((leg, i) => {
    const s = moving ? Math.sin(rig.phase + (i % 2 === 0 ? 0 : Math.PI)) : 0;
    leg.rotation.x = s * 0.55;
  });
}

export function disposeRig(mats: THREE.Material[]) {
  for (const m of mats) m.dispose();
}
