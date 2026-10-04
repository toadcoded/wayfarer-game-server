import * as THREE from "three";
import {
  TILES,
  WATER,
  groundY,
  type Building,
  type Npc,
  type PapyrusWorld,
} from "./papyrus-world";

const SKY = 0xb7c8b8;
const _o = new THREE.Object3D();
const _ray = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const SPAWN_CAM = { x: 36.5, y: 8, z: 48 };

type Mats = ReturnType<typeof makeMats>;

function makeMats() {
  const lambert = (color: number, opts: THREE.MeshLambertMaterialParameters = {}) =>
    new THREE.MeshLambertMaterial({ color, ...opts });
  return {
    terrain: new THREE.MeshLambertMaterial({ vertexColors: true }),
    water: new THREE.MeshPhongMaterial({
      color: 0x3a6a78,
      transparent: true,
      opacity: 0.78,
      shininess: 48,
    }),
    timber: lambert(0x6a5340),
    plaster: lambert(0xe8dcc4),
    roof: lambert(0x4a3028),
    stone: lambert(0x7a7c74),
    sage: lambert(0x4a5a40),
    sand: lambert(0xb89a62),
    pine: lambert(0x3d4a38),
    oak: lambert(0x4a5a40),
    bloom: lambert(0x8a6a72),
    lamp: new THREE.MeshLambertMaterial({ color: 0xf0d78a, emissive: 0xc4a050, emissiveIntensity: 0.7 }),
  };
}

function colorBiome(biome: string, shade: number, tx: number, tz: number): [number, number, number] {
  const flicker = ((tx * 13 + tz * 7) % 5) * 0.012;
  const k = Math.min(1.18, Math.max(0.72, shade + flicker));
  const pal: Record<string, [number, number, number]> = {
    water: [46, 78, 92],
    path: [118, 108, 82],
    meadow: [86, 118, 78],
    forest: [52, 78, 54],
    sand: [168, 148, 104],
    rock: [110, 112, 104],
  };
  const [r, g, b] = pal[biome] ?? pal.meadow!;
  return [(r * k) / 255, (g * k) / 255, (b * k) / 255];
}

function makeTerrain(world: PapyrusWorld, mat: THREE.Material): THREE.Mesh {
  const n = TILES + 1;
  const pos = new Float32Array(n * n * 3);
  const col = new Float32Array(n * n * 3);
  const index: number[] = [];
  for (let tz = 0; tz < n; tz++) {
    for (let tx = 0; tx < n; tx++) {
      const i = tz * n + tx;
      const sx = Math.min(TILES - 1, tx);
      const sz = Math.min(TILES - 1, tz);
      const bi = sz * TILES + sx;
      const h = world.heights[bi]!;
      pos[i * 3] = tx;
      pos[i * 3 + 1] = groundY(h);
      pos[i * 3 + 2] = tz;
      const shade = 0.82 + h * 0.4;
      const [r, g, b] = colorBiome(world.biomes[bi]!, shade, tx, tz);
      col[i * 3] = r;
      col[i * 3 + 1] = g;
      col[i * 3 + 2] = b;
    }
  }
  for (let tz = 0; tz < TILES; tz++) {
    for (let tx = 0; tx < TILES; tx++) {
      const a = tz * n + tx;
      const b = a + 1;
      const c = a + n;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = "terrain";
  return mesh;
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

function buildingGroup(b: Building, world: PapyrusWorld, mats: Mats): THREE.Group {
  const g = new THREE.Group();
  const cx = b.tx + b.w / 2;
  const cz = b.tz + b.d / 2;
  const ti = Math.min(TILES * TILES - 1, Math.max(0, b.tz * TILES + b.tx));
  const y0 = groundY(world.heights[ti] ?? WATER) + 0.02;
  g.position.set(cx, 0, cz);
  g.rotation.y = b.yaw;
  const w = b.w * 0.92;
  const d = b.d * 0.92;

  if (b.kind === "hall") {
    addBox(g, mats.plaster, 0, y0 + b.h * 0.38, 0, w, b.h * 0.76, d);
    addBox(g, mats.roof, 0, y0 + b.h * 0.92, 0, w * 1.12, 0.18, d * 1.12);
    addBox(g, mats.roof, 0, y0 + b.h * 1.12, 0, w * 0.72, 0.16, d * 0.4);
    addBox(g, mats.timber, 0, y0 + 0.7, d * 0.5, 0.7, 1.4, 0.12);
    addBox(g, mats.stone, -w * 0.45, y0 + 0.35, -d * 0.4, 0.28, 0.7, 0.28);
    addBox(g, mats.stone, w * 0.45, y0 + 0.35, -d * 0.4, 0.28, 0.7, 0.28);
  } else if (b.kind === "forge") {
    addBox(g, mats.stone, 0, y0 + b.h * 0.4, 0, w, b.h * 0.8, d);
    addBox(g, mats.roof, 0, y0 + b.h * 0.9, 0, w * 1.1, 0.16, d * 1.1);
    const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.6, 8), mats.stone);
    chim.position.set(w * 0.28, y0 + b.h + 0.4, -d * 0.2);
    chim.castShadow = true;
    g.add(chim);
    addBox(g, mats.lamp, 0, y0 + 0.55, d * 0.42, 0.35, 0.35, 0.12);
  } else if (b.kind === "chapel") {
    addBox(g, mats.plaster, 0, y0 + b.h * 0.32, 0, w, b.h * 0.64, d);
    addBox(g, mats.roof, 0, y0 + b.h * 0.78, 0, w * 1.08, 0.2, d * 1.08);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.8, 8), mats.sage);
    spire.position.set(0, y0 + b.h + 0.5, 0);
    spire.castShadow = true;
    g.add(spire);
    addBox(g, mats.timber, 0, y0 + 0.75, d * 0.5, 0.55, 1.5, 0.1);
  } else if (b.kind === "cottage") {
    addBox(g, mats.plaster, 0, y0 + b.h * 0.42, 0, w, b.h * 0.84, d);
    addBox(g, mats.roof, 0, y0 + b.h * 0.95, 0, w * 1.15, 0.22, d * 1.15);
    addBox(g, mats.timber, 0, y0 + 0.55, d * 0.5, 0.5, 1.1, 0.08);
  } else if (b.kind === "gate") {
    addBox(g, mats.stone, -w * 0.38, y0 + b.h * 0.5, 0, 1.15, b.h, 1.4);
    addBox(g, mats.stone, w * 0.38, y0 + b.h * 0.5, 0, 1.15, b.h, 1.4);
    addBox(g, mats.timber, 0, y0 + b.h * 0.72, 0, w * 0.72, 0.45, 0.7);
    addBox(g, mats.sage, -w * 0.38, y0 + b.h + 0.25, 0, 1.2, 0.35, 1.45);
    addBox(g, mats.sage, w * 0.38, y0 + b.h + 0.25, 0, 1.2, 0.35, 1.45);
  } else if (b.kind === "tower") {
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, b.h, 10), mats.stone);
    cyl.position.set(0, y0 + b.h * 0.5, 0);
    cyl.castShadow = true;
    g.add(cyl);
    addBox(g, mats.roof, 0, y0 + b.h + 0.15, 0, 2.6, 0.28, 2.6);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.1, 8), mats.sage);
    cap.position.set(0, y0 + b.h + 0.8, 0);
    g.add(cap);
  } else if (b.kind === "dock") {
    addBox(g, mats.timber, 0, y0 + 0.18, 0, w * 1.4, 0.18, d * 0.7);
    addBox(g, mats.timber, -w * 0.5, y0 + 0.08, 0, 0.18, 0.7, d * 0.7);
    addBox(g, mats.plaster, w * 0.35, y0 + 0.85, 0, 2.2, 1.5, 2.4);
    addBox(g, mats.roof, w * 0.35, y0 + 1.7, 0, 2.5, 0.16, 2.7);
  } else if (b.kind === "stall") {
    addBox(g, mats.timber, 0, y0 + 0.35, 0, w, 0.15, d);
    addBox(g, mats.sage, 0, y0 + 1.15, 0, w * 1.2, 0.08, d * 1.2);
    addBox(g, mats.timber, -w * 0.45, y0 + 0.7, -d * 0.45, 0.1, 1.3, 0.1);
    addBox(g, mats.timber, w * 0.45, y0 + 0.7, -d * 0.45, 0.1, 1.3, 0.1);
  } else if (b.kind === "well") {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.55, 12), mats.stone);
    ring.position.set(0, y0 + 0.28, 0);
    g.add(ring);
    addBox(g, mats.timber, 0, y0 + 1.05, 0, 0.08, 1.1, 0.08);
    addBox(g, mats.timber, 0, y0 + 1.55, 0, 1.1, 0.08, 0.08);
  } else if (b.kind === "bridge") {
    addBox(g, mats.timber, 0, y0 + 0.22, 0, w * 1.05, 0.22, d * 1.4);
    addBox(g, mats.timber, -w * 0.48, y0 + 0.7, 0, 0.1, 0.7, d * 1.4);
    addBox(g, mats.timber, w * 0.48, y0 + 0.7, 0, 0.1, 0.7, d * 1.4);
  }
  return g;
}

function makePerson(cloak: number, isPlayer = false): THREE.Group {
  const g = new THREE.Group();
  const cloakMat = new THREE.MeshLambertMaterial({ color: cloak });
  const skin = new THREE.MeshLambertMaterial({ color: 0xd8c4a8 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2a3328 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 4, 8), cloakMat);
  body.position.y = 0.72;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), skin);
  head.position.y = 1.22;
  head.castShadow = true;
  g.add(head);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.12, 8), dark);
  hat.position.y = 1.36;
  g.add(hat);
  const lleg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.28, 3, 6), dark);
  lleg.position.set(-0.1, 0.22, 0);
  g.add(lleg);
  const rleg = lleg.clone();
  rleg.position.x = 0.1;
  g.add(rleg);
  if (isPlayer) {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.14), dark);
    pack.position.set(0, 0.82, -0.2);
    g.add(pack);
  }
  return g;
}

function nameSprite(label: string): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = "rgba(14,15,12,0.62)";
  ctx.beginPath();
  ctx.roundRect(8, 12, 240, 40, 10);
  ctx.fill();
  ctx.fillStyle = "#e8e6df";
  ctx.font = "600 22px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(1.8, 0.45, 1);
  spr.position.y = 1.7;
  return spr;
}

function instancedProps(
  world: PapyrusWorld,
  kind: "pine" | "oak" | "rock" | "bloom",
  proto: THREE.BufferGeometry,
  mat: THREE.Material,
): THREE.InstancedMesh | null {
  const list = world.props.filter((p) => p.kind === kind);
  if (!list.length) return null;
  const mesh = new THREE.InstancedMesh(proto, mat, list.length);
  mesh.castShadow = kind !== "bloom";
  mesh.receiveShadow = true;
  for (let i = 0; i < list.length; i++) {
    const p = list[i]!;
    const y = groundY(world.heights[p.tz * TILES + p.tx]!);
    if (kind === "pine") {
      _o.position.set(p.x, y + 1.35, p.z);
      _o.scale.set(1, 1.15 + (p.tx % 3) * 0.08, 1);
    } else if (kind === "oak") {
      _o.position.set(p.x, y + 0.95, p.z);
      _o.scale.set(1.1, 1, 1.1);
    } else if (kind === "rock") {
      _o.position.set(p.x, y + 0.28, p.z);
      _o.scale.set(1, 0.7, 1);
    } else {
      _o.position.set(p.x, y + 0.12, p.z);
      _o.scale.set(1, 1, 1);
    }
    _o.rotation.set(0, (p.tx * 1.7 + p.tz) % 6, 0);
    _o.updateMatrix();
    mesh.setMatrixAt(i, _o.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

export type SceneHandle = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  resize: (w: number, h: number, dpr: number) => void;
  render: (t: number) => void;
  syncPlayer: (x: number, z: number, y: number, yaw: number) => void;
  syncNpc: (n: Npc, y: number) => void;
  followCam: (x: number, z: number, y: number, yaw: number, dt: number) => void;
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
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 42, 130);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.12, 160);
  camera.position.set(SPAWN_CAM.x, SPAWN_CAM.y, SPAWN_CAM.z);

  const hemi = new THREE.HemisphereLight(0xe8efe4, 0x3d4a38, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4d6, 1.35);
  sun.position.set(28, 42, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 4;
  sun.shadow.camera.far = 90;
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  scene.add(sun);
  scene.add(sun.target);

  const mats = makeMats();
  const terrain = makeTerrain(world, mats.terrain);
  scene.add(terrain);

  const water = new THREE.Mesh(new THREE.PlaneGeometry(TILES + 24, TILES + 24, 1, 1), mats.water);
  water.rotation.x = -Math.PI / 2;
  water.position.set(TILES / 2, groundY(WATER) + 0.04, TILES / 2);
  scene.add(water);

  const pineGeo = new THREE.ConeGeometry(0.55, 2.4, 7);
  const oakGeo = new THREE.SphereGeometry(0.7, 8, 6);
  const rockGeo = new THREE.DodecahedronGeometry(0.42, 0);
  const bloomGeo = new THREE.SphereGeometry(0.12, 6, 5);
  const pine = instancedProps(world, "pine", pineGeo, mats.pine);
  const oak = instancedProps(world, "oak", oakGeo, mats.oak);
  const rocks = instancedProps(world, "rock", rockGeo, mats.stone);
  const blooms = instancedProps(world, "bloom", bloomGeo, mats.bloom);
  if (pine) scene.add(pine);
  if (oak) scene.add(oak);
  if (rocks) scene.add(rocks);
  if (blooms) scene.add(blooms);

  const pineTrunks = world.props.filter((p) => p.kind === "pine" || p.kind === "oak");
  if (pineTrunks.length) {
    const tgeo = new THREE.CylinderGeometry(0.08, 0.12, 0.7, 5);
    const tmesh = new THREE.InstancedMesh(tgeo, mats.timber, pineTrunks.length);
    tmesh.castShadow = true;
    for (let i = 0; i < pineTrunks.length; i++) {
      const p = pineTrunks[i]!;
      const y = groundY(world.heights[p.tz * TILES + p.tx]!);
      _o.position.set(p.x, y + 0.32, p.z);
      _o.scale.set(1, 1, 1);
      _o.rotation.set(0, 0, 0);
      _o.updateMatrix();
      tmesh.setMatrixAt(i, _o.matrix);
    }
    tmesh.instanceMatrix.needsUpdate = true;
    scene.add(tmesh);
  }

  for (const b of world.buildings) scene.add(buildingGroup(b, world, mats));

  const plazaY = groundY(world.heights[40 * TILES + 36] ?? WATER) + 0.06;
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.14, 8.4), mats.stone);
  plaza.position.set(36.5, plazaY, 40.6);
  plaza.receiveShadow = true;
  scene.add(plaza);

  for (const [lx, lz] of [
    [33.5, 39.5],
    [39.5, 39.5],
    [33.5, 42.5],
    [39.5, 42.5],
    [36.5, 50.5],
    [36.5, 58.5],
  ] as const) {
    const txi = Math.min(TILES - 1, Math.max(0, Math.floor(lx)));
    const tzi = Math.min(TILES - 1, Math.max(0, Math.floor(lz)));
    const y = groundY(world.heights[tzi * TILES + txi]!);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.1, 6), mats.timber);
    pole.position.set(lx, y + 1.05, lz);
    pole.castShadow = true;
    scene.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mats.lamp);
    bulb.position.set(lx, y + 2.15, lz);
    scene.add(bulb);
  }

  const player = makePerson(0x7d9b84, true);
  player.scale.setScalar(1.35);
  scene.add(player);

  const npcGroups = new Map<string, THREE.Group>();
  for (const n of world.npcs) {
    const g = makePerson(n.cloak);
    g.scale.setScalar(1.3);
    g.add(nameSprite(`${n.name} · ${n.role}`));
    g.position.set(n.x, 0, n.z);
    scene.add(g);
    npcGroups.set(n.id, g);
  }

  const pickupMeshes: THREE.Mesh[] = [];
  const leafGeo = new THREE.SphereGeometry(0.14, 8, 6);
  for (const pk of world.pickups) {
    const m = new THREE.Mesh(leafGeo, pk.kind === "leaf" ? mats.sage : mats.sand);
    m.position.set(pk.x, 0.4, pk.z);
    m.userData.id = pk.id;
    scene.add(m);
    pickupMeshes.push(m);
  }

  const cam = { x: SPAWN_CAM.x, y: SPAWN_CAM.y, z: SPAWN_CAM.z };
  const extras: THREE.BufferGeometry[] = [pineGeo, oakGeo, rockGeo, bloomGeo, leafGeo];

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
      water.position.y = groundY(WATER) + 0.05 + Math.sin(t * 0.7) * 0.04;
      for (const m of pickupMeshes) {
        const pk = world.pickups.find((p) => p.id === m.userData.id);
        if (!pk || pk.taken) {
          m.visible = false;
          continue;
        }
        const txi = Math.min(TILES - 1, Math.max(0, Math.floor(pk.x)));
        const tzi = Math.min(TILES - 1, Math.max(0, Math.floor(pk.z)));
        m.visible = true;
        m.position.y = groundY(world.heights[tzi * TILES + txi]!) + 0.38 + Math.sin(t * 3 + pk.x) * 0.08;
      }
      renderer.render(scene, camera);
    },
    syncPlayer(x, z, y, yaw) {
      player.position.set(x, y, z);
      player.rotation.y = yaw + Math.PI;
    },
    syncNpc(n, y) {
      const g = npcGroups.get(n.id);
      if (!g) return;
      g.position.set(n.x, y, n.z);
      g.rotation.y = n.yaw + Math.PI;
    },
    followCam(x, z, y, yaw, dt) {
      const fx = -Math.sin(yaw);
      const fz = -Math.cos(yaw);
      const desiredX = x + fx * -5.6;
      const desiredZ = z + fz * -5.6;
      const desiredY = y + 3.35;
      const k = 1 - Math.exp(-dt * 5.5);
      cam.x += (desiredX - cam.x) * k;
      cam.y += (desiredY - cam.y) * k;
      cam.z += (desiredZ - cam.z) * k;
      camera.position.set(cam.x, cam.y, cam.z);
      camera.lookAt(x, y + 1.25, z);
      sun.position.set(x + 22, y + 36, z + 14);
      sun.target.position.set(x, y, z);
      sun.target.updateMatrixWorld();
    },
    pickGround(cx, cy, w, h) {
      _ndc.x = (cx / w) * 2 - 1;
      _ndc.y = -(cy / h) * 2 + 1;
      _ray.setFromCamera(_ndc, camera);
      const hit = _ray.intersectObject(terrain, false)[0];
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
