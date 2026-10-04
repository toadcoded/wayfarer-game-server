import * as THREE from "three";
import { clampZoom, hopHeight, rigForZoom } from "./papyrus-physics";
import {
  PLAZA,
  TILES,
  type Building,
  type Npc,
  type PapyrusWorld,
  type Prop,
} from "./papyrus-world";

const SKY = 0xc5bba8;
const STREET = 0xd9d0c0;
const RING = 0x9a7a54;
const WATER_C = 0x2f5c58;
const SPAWN_CAM = { x: 32.5, y: 9.2, z: 48.5 };
const _o = new THREE.Object3D();
const _ray = new THREE.Raycaster();
const _ndc = new THREE.Vector2();

type Mats = ReturnType<typeof makeMats>;

function makeMats() {
  const lambert = (color: number, opts: THREE.MeshLambertMaterialParameters = {}) =>
    new THREE.MeshLambertMaterial({ color, ...opts });
  return {
    street: lambert(STREET),
    ring: lambert(RING),
    water: new THREE.MeshPhongMaterial({
      color: WATER_C,
      shininess: 42,
      transparent: true,
      opacity: 0.92,
    }),
    plaster: lambert(0xcbb99a),
    plasterDeep: lambert(0xb9a686),
    roof: lambert(0x6a4534),
    keep: lambert(0x1c1c1a),
    timber: lambert(0x6b4a32),
    stone: lambert(0x8a8880),
    sage: lambert(0x3d4a38),
    stall: lambert(0x4a6a48),
    pole: lambert(0x161614),
    lamp: new THREE.MeshLambertMaterial({
      color: 0xf3ead4,
      emissive: 0xe8d9a8,
      emissiveIntensity: 0.85,
    }),
    crate: lambert(0x7a7a72),
    silver: lambert(0xc5c8c2),
    cloak: lambert(0x141414),
    mark: lambert(0xe8e6df),
    grass: lambert(0x8a9a72),
  };
}

function addBox(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildingGroup(b: Building, mats: Mats): THREE.Group {
  const g = new THREE.Group();
  const cx = b.tx + b.w / 2;
  const cz = b.tz + b.d / 2;
  g.position.set(cx, 0, cz);
  g.rotation.y = b.yaw;
  const w = b.w * 0.96;
  const d = b.d * 0.96;
  const wall = b.kind === "keep" || b.kind === "warehouse" ? mats.keep : mats.plaster;
  const roof = b.kind === "keep" ? mats.keep : mats.roof;

  if (b.kind === "stall") {
    addBox(g, mats.timber, 0, 0.42, 0, w, 0.16, d);
    addBox(g, mats.stall, 0, 0.95, 0, w * 1.05, 0.08, d * 1.05);
    addBox(g, mats.timber, -w * 0.42, 0.7, -d * 0.42, 0.08, 1.1, 0.08);
    addBox(g, mats.timber, w * 0.42, 0.7, -d * 0.42, 0.08, 1.1, 0.08);
    addBox(g, mats.timber, -w * 0.42, 0.7, d * 0.42, 0.08, 1.1, 0.08);
    addBox(g, mats.timber, w * 0.42, 0.7, d * 0.42, 0.08, 1.1, 0.08);
    return g;
  }
  if (b.kind === "dock") {
    addBox(g, mats.timber, 0, 0.16, 0, w * 1.15, 0.2, d * 0.9);
    addBox(g, mats.timber, 0, 0.55, -d * 0.2, w * 0.45, 0.35, 0.7);
    addBox(g, mats.crate, w * 0.25, 0.5, 0, 0.7, 0.5, 0.7);
    return g;
  }
  if (b.kind === "wall") {
    addBox(g, mats.keep, -w * 0.38, b.h * 0.5, 0, 1.2, b.h, 1.6);
    addBox(g, mats.keep, w * 0.38, b.h * 0.5, 0, 1.2, b.h, 1.6);
    addBox(g, mats.timber, 0, b.h * 0.72, 0, w * 0.7, 0.4, 0.7);
    return g;
  }

  addBox(g, wall, 0, b.h * 0.42, 0, w, b.h * 0.84, d);
  addBox(g, roof, 0, b.h * 0.92, 0, w * 1.12, Math.max(0.28, b.h * 0.12), d * 1.12);
  if (b.kind === "chapel") {
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.2, 8), mats.sage);
    spire.position.set(0, b.h + 0.9, 0);
    spire.castShadow = true;
    g.add(spire);
  }
  if (b.kind === "oven") {
    const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.8, 8), mats.stone);
    chim.position.set(w * 0.28, b.h + 0.4, -d * 0.15);
    chim.castShadow = true;
    g.add(chim);
  }
  if (b.kind === "hall" || b.kind === "inn") {
    addBox(g, mats.plasterDeep, 0, b.h * 0.55, d * 0.02, w * 0.45, b.h * 0.5, d * 0.55);
  }
  if (b.kind === "keep") {
    addBox(g, mats.keep, -w * 0.38, b.h * 0.7, -d * 0.32, 1.6, b.h * 0.7, 1.6);
    addBox(g, mats.keep, w * 0.38, b.h * 0.7, -d * 0.32, 1.6, b.h * 0.7, 1.6);
  }
  addBox(g, mats.timber, 0, 0.85, d * 0.48, 0.7, 1.7, 0.1);
  return g;
}

function makeFountain(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  g.position.set(PLAZA.x, 0, PLAZA.z);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(4.55, 4.75, 0.42, 16), mats.stone);
  rim.position.y = 0.2;
  rim.receiveShadow = true;
  rim.castShadow = true;
  g.add(rim);
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(4.05, 4.05, 0.22, 16), mats.water);
  pool.position.y = 0.28;
  g.add(pool);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 1.9, 8), mats.timber);
  pillar.position.y = 1.15;
  pillar.castShadow = true;
  g.add(pillar);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.045, 8, 32), mats.silver);
  ring.position.y = 2.15;
  ring.rotation.x = Math.PI / 2.6;
  g.add(ring);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mats.lamp);
  orb.position.y = 2.22;
  g.add(orb);
  return g;
}

function makePerson(cloak: number, isPlayer = false): THREE.Group {
  const g = new THREE.Group();
  const cloakMat = new THREE.MeshLambertMaterial({ color: cloak });
  const dark = new THREE.MeshLambertMaterial({ color: 0x101010 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.62, 4, 8), cloakMat);
  body.name = "torso";
  body.position.y = 0.78;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), dark);
  head.name = "head";
  head.position.y = 1.32;
  head.castShadow = true;
  g.add(head);
  const mark = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.16, 3),
    new THREE.MeshLambertMaterial({ color: isPlayer ? 0xb8e0dc : 0xe8e6df }),
  );
  mark.name = "mark";
  mark.position.set(0, 0.82, 0.26);
  mark.rotation.x = Math.PI;
  g.add(mark);
  const lleg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.22, 3, 6), dark);
  lleg.name = "lleg";
  lleg.position.set(-0.1, 0.2, 0);
  g.add(lleg);
  const rleg = lleg.clone();
  rleg.name = "rleg";
  rleg.position.x = 0.1;
  g.add(rleg);
  return g;
}

function posePerson(
  g: THREE.Group,
  pose: "idle" | "walk" | "sit" | "talk" | "hop" | "reach",
  gait: number,
  hopY: number,
) {
  const torso = g.getObjectByName("torso");
  const head = g.getObjectByName("head");
  const mark = g.getObjectByName("mark");
  const lleg = g.getObjectByName("lleg");
  const rleg = g.getObjectByName("rleg");
  const sit = pose === "sit";
  const reach = pose === "reach";
  const walkAmt = pose === "walk" || pose === "hop" ? 1 : pose === "idle" ? 0.12 : 0;
  if (torso) {
    torso.position.y = sit ? 0.52 : 0.78;
    torso.rotation.x = sit ? 0.22 : reach ? 0.18 : 0;
  }
  if (head) head.position.y = sit ? 1.02 : 1.32;
  if (mark) mark.position.y = sit ? 0.56 : 0.82;
  const swing = Math.sin(gait) * 0.72 * walkAmt;
  if (lleg) {
    lleg.position.y = sit ? 0.34 : 0.2;
    lleg.rotation.x = sit ? 1.15 : swing;
  }
  if (rleg) {
    rleg.position.y = sit ? 0.34 : 0.2;
    rleg.rotation.x = sit ? 1.15 : -swing;
  }
  g.position.y = sit ? 0.12 : hopY;
}

function labelSprite(title: string, sub?: string, wide = false): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = wide ? 512 : 320;
  c.height = sub ? 96 : 64;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgba(14,15,12,0.72)";
  const pad = 10;
  ctx.beginPath();
  ctx.roundRect(pad, pad, c.width - pad * 2, c.height - pad * 2, 14);
  ctx.fill();
  ctx.fillStyle = "#e8e6df";
  ctx.font = wide ? "500 36px Outfit, sans-serif" : "600 26px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, c.width / 2, sub ? c.height * 0.4 : c.height / 2);
  if (sub) {
    ctx.fillStyle = "#9a9b93";
    ctx.font = "500 16px Outfit, sans-serif";
    ctx.fillText(sub, c.width / 2, c.height * 0.7);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(wide ? 4.4 : 1.9, wide ? 0.82 : sub ? 0.56 : 0.4, 1);
  spr.position.y = wide ? 2.4 : 1.85;
  spr.renderOrder = 2;
  return spr;
}

function instanced(
  list: Prop[],
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  place: (p: Prop, o: THREE.Object3D) => void,
): THREE.InstancedMesh | null {
  if (!list.length) return null;
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  for (let i = 0; i < list.length; i++) {
    place(list[i]!, _o);
    _o.updateMatrix();
    mesh.setMatrixAt(i, _o.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function makeGround(_world: PapyrusWorld, mats: Mats): THREE.Group {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(TILES + 8, TILES + 8), mats.street);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(TILES / 2, 0, TILES / 2);
  floor.receiveShadow = true;
  floor.name = "ground";
  g.add(floor);

  const ring = new THREE.Mesh(new THREE.RingGeometry(5.05, 8.55, 48), mats.ring);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(PLAZA.x, 0.025, PLAZA.z);
  ring.receiveShadow = true;
  g.add(ring);

  const inner = new THREE.Mesh(new THREE.CircleGeometry(5.05, 40), mats.street);
  inner.rotation.x = -Math.PI / 2;
  inner.position.set(PLAZA.x, 0.02, PLAZA.z);
  inner.receiveShadow = true;
  g.add(inner);

  const grassGeo = new THREE.PlaneGeometry(16, 16);
  for (const [x, z] of [
    [11, 11],
    [52, 52],
  ] as const) {
    const grass = new THREE.Mesh(grassGeo, mats.grass);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(x, 0.015, z);
    grass.receiveShadow = true;
    g.add(grass);
  }

  const water = new THREE.Mesh(new THREE.PlaneGeometry(18, 28), mats.water);
  water.rotation.x = -Math.PI / 2;
  water.position.set(61, -0.08, 33);
  g.add(water);
  const wild = new THREE.Mesh(new THREE.PlaneGeometry(28, 10), mats.water);
  wild.rotation.x = -Math.PI / 2;
  wild.position.set(52, -0.08, 62);
  g.add(wild);

  // Outer walls as long boxes
  const wallH = 4.2;
  const wallMat = mats.keep;
  addBox(g, wallMat, TILES / 2, wallH / 2, 0.8, TILES, wallH, 1.6);
  addBox(g, wallMat, TILES / 2, wallH / 2, TILES - 0.8, TILES, wallH, 1.6);
  addBox(g, wallMat, 0.8, wallH / 2, TILES / 2, 1.6, wallH, TILES);
  addBox(g, wallMat, TILES - 0.8, wallH / 2, TILES / 2, 1.6, wallH, TILES);

  return g;
}

export type SceneHandle = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  resize: (w: number, h: number, dpr: number) => void;
  render: (t: number) => void;
  syncPlayer: (
    x: number,
    z: number,
    yaw: number,
    gait: number,
    pose: "idle" | "walk" | "sit" | "talk" | "hop" | "reach",
    hopT: number,
    reduceMotion: boolean,
  ) => void;
  syncNpc: (n: Npc) => void;
  followCam: (
    x: number,
    z: number,
    yaw: number,
    dt: number,
    zoom: number,
    vx: number,
    vz: number,
  ) => void;
  pickGround: (cx: number, cy: number, w: number, h: number) => { x: number; z: number } | null;
  dispose: () => void;
};

function disposeMat(mat: THREE.Material) {
  const m = mat as THREE.MeshLambertMaterial;
  if (m.map) m.map.dispose();
  mat.dispose();
}

export function createPapyrusScene(canvas: HTMLCanvasElement, world: PapyrusWorld): SceneHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(SKY, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 70, 160);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.12, 220);
  camera.position.set(SPAWN_CAM.x, SPAWN_CAM.y, SPAWN_CAM.z);

  const hemi = new THREE.HemisphereLight(0xf0e8d4, 0x5a5040, 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d2, 1.28);
  sun.position.set(18, 34, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 80;
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  scene.add(sun);
  scene.add(sun.target);

  const mats = makeMats();
  const ground = makeGround(world, mats);
  scene.add(ground);
  scene.add(makeFountain(mats));

  for (const b of world.buildings) scene.add(buildingGroup(b, mats));

  const lamps = world.props.filter((p) => p.kind === "lamp");
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.08, 3.7, 6);
  const bulbGeo = new THREE.SphereGeometry(0.28, 10, 8);
  const poles = instanced(lamps, poleGeo, mats.pole, (p, o) => {
    o.position.set(p.x, 1.85, p.z);
    o.scale.set(1, 1, 1);
    o.rotation.set(0, 0, 0);
  });
  const bulbs = instanced(lamps, bulbGeo, mats.lamp, (p, o) => {
    o.position.set(p.x, 3.82, p.z);
    o.scale.set(1, 1, 1);
    o.rotation.set(0, 0, 0);
  });
  if (poles) scene.add(poles);
  if (bulbs) scene.add(bulbs);
  for (const p of lamps.slice(0, 8)) {
    const light = new THREE.PointLight(0xf3ead4, 0.45, 8, 2);
    light.position.set(p.x, 3.6, p.z);
    scene.add(light);
  }

  const benches = world.props.filter((p) => p.kind === "bench");
  const benchGeo = new THREE.BoxGeometry(1.65, 0.18, 0.42);
  const benchMesh = instanced(benches, benchGeo, mats.timber, (p, o) => {
    o.position.set(p.x, 0.38, p.z);
    o.scale.set(1, 1, 1);
    o.rotation.set(0, p.yaw, 0);
  });
  if (benchMesh) scene.add(benchMesh);
  const legGeo = new THREE.BoxGeometry(0.1, 0.32, 0.1);
  const legs: Prop[] = benches.flatMap((p) => {
    const c = Math.cos(p.yaw);
    const s = Math.sin(p.yaw);
    const ox = 0.62;
    return [
      { ...p, x: p.x + c * ox, z: p.z + s * ox },
      { ...p, x: p.x - c * ox, z: p.z - s * ox },
    ];
  });
  const legMesh = instanced(legs, legGeo, mats.timber, (p, o) => {
    o.position.set(p.x, 0.16, p.z);
    o.scale.set(1, 1, 1);
    o.rotation.set(0, 0, 0);
  });
  if (legMesh) scene.add(legMesh);

  const crates = world.props.filter((p) => p.kind === "crate");
  const crateGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
  const crateMesh = instanced(crates, crateGeo, mats.crate, (p, o) => {
    o.position.set(p.x, 0.22, p.z);
    o.scale.set(1, 1, 1);
    o.rotation.set(0, p.yaw, 0);
  });
  if (crateMesh) scene.add(crateMesh);

  const trees = world.props.filter((p) => p.kind === "tree");
  const coneGeo = new THREE.ConeGeometry(1.15, 2.4, 7);
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.7, 6);
  const treeMesh = instanced(trees, coneGeo, mats.sage, (p, o) => {
    o.position.set(p.x, 1.85, p.z);
    o.scale.set(1, 1, 1);
    o.rotation.set(0, p.yaw, 0);
  });
  const trunkMesh = instanced(trees, trunkGeo, mats.timber, (p, o) => {
    o.position.set(p.x, 0.35, p.z);
    o.scale.set(1, 1, 1);
    o.rotation.set(0, 0, 0);
  });
  if (treeMesh) scene.add(treeMesh);
  if (trunkMesh) scene.add(trunkMesh);

  const flags = world.props.filter((p) => p.kind === "flag");
  for (const p of flags) {
    addBox(scene, mats.pole, p.x, 1.4, p.z, 0.08, 2.8, 0.08);
    addBox(scene, mats.stall, p.x + 0.45, 2.35, p.z, 0.9, 0.55, 0.06);
  }

  const streetLabels: [string, number, number][] = [
    ["Reedhaven", PLAZA.x + 4.8, PLAZA.z + 6.2],
    ["Keep Way", 32.5, 20.5],
    ["Wright Row", 20.5, 32.5],
    ["Codex Lane", 32.5, 46.5],
    ["Quay Gate", 46.5, 32.5],
  ];
  for (const [name, x, z] of streetLabels) {
    const spr = labelSprite(name, undefined, true);
    spr.position.set(x, 2.15, z);
    scene.add(spr);
  }

  const player = makePerson(0x141414, true);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.54, 24),
    new THREE.MeshBasicMaterial({ color: 0x8ad4d0, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  player.add(ring);
  player.add(labelSprite("Wayfarer"));
  scene.add(player);

  const npcGroups = new Map<string, THREE.Group>();
  for (const n of world.npcs) {
    const g = makePerson(n.cloak);
    g.add(labelSprite(n.name, n.role));
    g.position.set(n.x, 0, n.z);
    scene.add(g);
    npcGroups.set(n.id, g);
  }

  const pickupMeshes: THREE.Mesh[] = [];
  const leafGeo = new THREE.SphereGeometry(0.14, 8, 6);
  for (const pk of world.pickups) {
    const mat = pk.kind === "leaf" ? mats.sage : pk.kind === "coin" ? mats.lamp : mats.silver;
    const m = new THREE.Mesh(leafGeo, mat);
    m.position.set(pk.x, 0.4, pk.z);
    m.userData.id = pk.id;
    scene.add(m);
    pickupMeshes.push(m);
  }

  const groundMesh = ground.getObjectByName("ground") as THREE.Mesh;
  const cam = { x: SPAWN_CAM.x, y: SPAWN_CAM.y, z: SPAWN_CAM.z, fov: 46 };
  const extras: THREE.BufferGeometry[] = [poleGeo, bulbGeo, benchGeo, legGeo, crateGeo, coneGeo, trunkGeo, leafGeo];

  return {
    renderer,
    camera,
    resize(w, h, dpr) {
      const ww = Math.max(1, Math.floor(w));
      const hh = Math.max(1, Math.floor(h));
      renderer.setPixelRatio(Math.min(2, dpr));
      renderer.setSize(ww, hh, false);
      camera.aspect = ww / hh;
      camera.updateProjectionMatrix();
    },
    render(t) {
      for (const m of pickupMeshes) {
        const pk = world.pickups.find((p) => p.id === m.userData.id);
        if (!pk || pk.taken) {
          m.visible = false;
          continue;
        }
        m.visible = true;
        m.position.y = 0.38 + Math.sin(t * 3 + pk.x) * 0.08;
      }
      renderer.render(scene, camera);
    },
    syncPlayer(x, z, yaw, gait, pose, hopT, reduceMotion) {
      player.position.x = x;
      player.position.z = z;
      player.rotation.y = yaw + Math.PI;
      posePerson(player, pose, gait, hopHeight(hopT, reduceMotion));
    },
    syncNpc(n) {
      const g = npcGroups.get(n.id);
      if (!g) return;
      g.position.x = n.x;
      g.position.z = n.z;
      g.rotation.y = n.yaw + Math.PI;
      posePerson(g, n.pose, n.gait, 0);
    },
    followCam(x, z, yaw, dt, zoom, vx, vz) {
      const zed = clampZoom(zoom);
      const rig = rigForZoom(zed);
      const fx = -Math.sin(yaw);
      const fz = -Math.cos(yaw);
      const leadX = x + vx * 0.16;
      const leadZ = z + vz * 0.16;
      const desiredX = leadX + fx * -rig.dist;
      const desiredZ = leadZ + fz * -rig.dist;
      const desiredY = rig.height;
      const k = 1 - Math.exp(-dt * (zed < 0.72 ? 3.2 : 5.1));
      cam.x += (desiredX - cam.x) * k;
      cam.y += (desiredY - cam.y) * k;
      cam.z += (desiredZ - cam.z) * k;
      cam.fov += (rig.fov - cam.fov) * k;
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
      camera.position.set(cam.x, cam.y, cam.z);
      camera.lookAt(leadX, rig.lookY, leadZ);
      const fogFar = zed < 0.7 ? 220 : 160;
      const fogNear = zed < 0.7 ? 90 : 70;
      scene.fog = new THREE.Fog(SKY, fogNear, fogFar);
      const shadowSpan = zed < 0.7 ? 48 : 24;
      sun.position.set(x + 16, yLift(rig.height), z + 10);
      sun.target.position.set(x, 0, z);
      sun.target.updateMatrixWorld();
      sun.shadow.camera.left = -shadowSpan;
      sun.shadow.camera.right = shadowSpan;
      sun.shadow.camera.top = shadowSpan;
      sun.shadow.camera.bottom = -shadowSpan;
      sun.shadow.camera.updateProjectionMatrix();
    },
    pickGround(cx, cy, w, h) {
      _ndc.x = (cx / w) * 2 - 1;
      _ndc.y = -(cy / h) * 2 + 1;
      _ray.setFromCamera(_ndc, camera);
      const hit = _ray.intersectObject(groundMesh, false)[0];
      if (!hit) return null;
      return { x: hit.point.x, z: hit.point.z };
    },
    dispose() {
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((mm) => disposeMat(mm));
        else if (mat) disposeMat(mat);
      });
      extras.forEach((g) => g.dispose());
      renderer.dispose();
    },
  };
}

function yLift(h: number) {
  return Math.max(28, h + 8);
}
