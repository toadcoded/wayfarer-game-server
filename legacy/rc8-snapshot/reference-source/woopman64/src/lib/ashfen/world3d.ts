import * as THREE from "three";
import { COLS, ROWS, T, WORLD_LANDMARKS, type TileId } from "./world";

const TILE_HEX: Record<number, number> = {
  [T.grass]: 0x7ec94a,
  [T.grass2]: 0x6bb53c,
  [T.path]: 0xe2d09a,
  [T.stone]: 0xc5c8be,
  [T.water]: 0x5aa4cc,
  [T.floor]: 0xb08458,
  [T.keep]: 0x8a9098,
  [T.wall]: 0x5a5248,
  [T.rock]: 0x908c86,
  [T.tree]: 0x6bb53c,
  [T.fountain]: 0x8ab4c8,
  [T.dock]: 0xc09060,
};

export type World3D = {
  root: THREE.Group;
  pickPlane: THREE.Mesh;
  dispose: () => void;
};

function lambert(color: number, opts?: { transparent?: boolean; opacity?: number }) {
  return new THREE.MeshLambertMaterial({
    color,
    flatShading: true,
    ...(opts?.transparent
      ? { transparent: true, opacity: opts.opacity ?? 0.85 }
      : {}),
  });
}

export function buildWorld3D(tiles: Uint8Array): World3D {
  const root = new THREE.Group();
  const mats: THREE.Material[] = [];
  const geos: THREE.BufferGeometry[] = [];

  const keep = (m: THREE.Material) => {
    mats.push(m);
    return m;
  };
  const geo = (g: THREE.BufferGeometry) => {
    geos.push(g);
    return g;
  };

  const tileGeo = geo(new THREE.BoxGeometry(1, 0.08, 1));
  const buckets = new Map<number, THREE.Vector3[]>();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = tiles[y * COLS + x] as TileId;
      const key = t === T.tree ? T.grass : t === T.rock ? T.grass : t;
      let list = buckets.get(key);
      if (!list) {
        list = [];
        buckets.set(key, list);
      }
      list.push(new THREE.Vector3(x + 0.5, 0.04, y + 0.5));
    }
  }

  for (const [kind, positions] of buckets) {
    const mesh = new THREE.InstancedMesh(
      tileGeo,
      keep(lambert(TILE_HEX[kind] ?? 0x6bb53c)),
      positions.length,
    );
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.copy(p);
      if (kind === T.water) dummy.position.y = -0.02;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.receiveShadow = true;
    mesh.instanceMatrix.needsUpdate = true;
    root.add(mesh);
  }

  const wallGeo = geo(new THREE.BoxGeometry(1, 1.55, 1));
  const wallMat = keep(lambert(0x5a5248));
  const wallPos: THREE.Vector3[] = [];
  const treePos: Array<{ x: number; z: number }> = [];
  const rockPos: Array<{ x: number; z: number }> = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = tiles[y * COLS + x]!;
      if (t === T.wall) wallPos.push(new THREE.Vector3(x + 0.5, 0.78, y + 0.5));
      if (t === T.tree) treePos.push({ x: x + 0.5, z: y + 0.5 });
      if (t === T.rock) rockPos.push({ x: x + 0.5, z: y + 0.5 });
    }
  }
  const walls = new THREE.InstancedMesh(wallGeo, wallMat, wallPos.length);
  const dummy = new THREE.Object3D();
  wallPos.forEach((p, i) => {
    dummy.position.copy(p);
    dummy.updateMatrix();
    walls.setMatrixAt(i, dummy.matrix);
  });
  walls.castShadow = true;
  walls.receiveShadow = true;
  root.add(walls);

  const trunkGeo = geo(new THREE.CylinderGeometry(0.08, 0.11, 0.7, 6));
  const canopyGeo = geo(new THREE.ConeGeometry(0.55, 1.15, 7));
  const trunkMat = keep(lambert(0x5a3a22));
  const canopyMat = keep(lambert(0x3d8a38));
  treePos.forEach(({ x, z }, i) => {
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 0.4, z);
    trunk.castShadow = true;
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(x, 1.15, z);
    canopy.castShadow = true;
    canopy.rotation.y = i * 0.7;
    root.add(trunk, canopy);
  });

  const rockGeo = geo(new THREE.IcosahedronGeometry(0.38, 0));
  const rockMat = keep(lambert(0x8a8680));
  rockPos.forEach(({ x, z }, i) => {
    const r = new THREE.Mesh(rockGeo, rockMat);
    r.position.set(x, 0.28, z);
    r.scale.set(1 + (i % 3) * 0.15, 0.7 + (i % 2) * 0.2, 1);
    r.rotation.set(0.2 * i, i, 0.1);
    r.castShadow = true;
    root.add(r);
  });

  // Great Library
  addBuilding(root, keep, geo, { x: 6.5, z: 5.5, w: 8.2, d: 6.4, h: 3.2, color: 0x9a7048, roof: 0x6a4030 });
  // Keep
  addBuilding(root, keep, geo, { x: 20.5, z: 5.2, w: 8.2, d: 5.6, h: 4.4, color: 0x8a9098, roof: 0x4a5058 });
  // Shop
  addBuilding(root, keep, geo, { x: 6, z: 25, w: 7.2, d: 5.4, h: 2.6, color: 0xb08458, roof: 0x6a3a22 });

  const basin = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.85, 0.95, 0.35, 12)), keep(lambert(0x8ab4c8)));
  basin.position.set(18, 0.22, 16.5);
  const water = new THREE.Mesh(
    geo(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 12)),
    keep(lambert(0x6ab4d8, { transparent: true, opacity: 0.85 })),
  );
  water.position.set(18, 0.38, 16.5);
  const spout = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.08, 0.1, 0.7, 8)), keep(lambert(0xa8b0b8)));
  spout.position.set(18, 0.7, 16.5);
  root.add(basin, water, spout);

  const poleGeo = geo(new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6));
  const lampGeo = geo(new THREE.SphereGeometry(0.18, 8, 8));
  const poleMat = keep(lambert(0x6a4a2a));
  const lampMat = keep(
    new THREE.MeshLambertMaterial({ color: 0xf2c98a, emissive: 0xc48a3a, emissiveIntensity: 0.85, flatShading: true }),
  );
  for (const mark of WORLD_LANDMARKS) {
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(mark.x + 0.5, 1.2, mark.y + 0.5);
    pole.castShadow = true;
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(mark.x + 0.5, 2.45, mark.y + 0.5);
    root.add(pole, lamp);
  }

  const pickPlane = new THREE.Mesh(
    geo(new THREE.PlaneGeometry(COLS + 4, ROWS + 4)),
    keep(new THREE.MeshBasicMaterial({ visible: false })),
  );
  pickPlane.rotation.x = -Math.PI / 2;
  pickPlane.position.set(COLS / 2, 0.02, ROWS / 2);
  root.add(pickPlane);

  return {
    root,
    pickPlane,
    dispose: () => {
      for (const m of mats) m.dispose();
      for (const g of geos) g.dispose();
    },
  };
}

function addBuilding(
  root: THREE.Group,
  keep: (m: THREE.Material) => THREE.Material,
  geo: (g: THREE.BufferGeometry) => THREE.BufferGeometry,
  b: { x: number; z: number; w: number; d: number; h: number; color: number; roof: number },
) {
  const body = new THREE.Mesh(geo(new THREE.BoxGeometry(b.w, b.h, b.d)), keep(lambert(b.color)));
  body.position.set(b.x, b.h / 2 + 0.04, b.z);
  body.castShadow = true;
  body.receiveShadow = true;
  const roof = new THREE.Mesh(geo(new THREE.ConeGeometry(Math.max(b.w, b.d) * 0.72, 1.35, 4)), keep(lambert(b.roof)));
  roof.position.set(b.x, b.h + 0.7, b.z);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  root.add(body, roof);
}
