import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Character } from "./Character";
import {
  BIOME_NAME,
  HALF,
  TILE_SIZE,
  TILES,
  WATER_LEVEL,
  WORLD,
  getWorld,
  type PropInstance,
} from "./world";

const COLOR = {
  water: new THREE.Color("#4d7380"),
  shore: new THREE.Color("#8a9a6e"),
  meadow: new THREE.Color("#4e7344"),
  forest: new THREE.Color("#355a38"),
  ridge: new THREE.Color("#6d6a52"),
  path: new THREE.Color("#6b5a3d"),
};

function useTerrainGeometry() {
  return useMemo(() => {
    const world = getWorld();
    const geo = new THREE.PlaneGeometry(WORLD, WORLD, TILES - 1, TILES - 1);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position!;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const tx = Math.round((x + HALF) / TILE_SIZE - 0.5);
      const tz = Math.round((z + HALF) / TILE_SIZE - 0.5);
      const ix = Math.max(0, Math.min(TILES - 1, tx));
      const iz = Math.max(0, Math.min(TILES - 1, tz));
      const h = world.heights[iz * TILES + ix]!;
      pos.setY(i, h);
      const biome = BIOME_NAME[world.biomes[iz * TILES + ix]!] ?? "meadow";
      c.copy(COLOR[biome]);
      const n = ((ix * 13 + iz * 7) % 9) / 40;
      c.offsetHSL(0, 0, n * 0.08 - 0.04);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);
}

function Instances({
  items,
  geometry,
  material,
  yLift = 0,
}: {
  items: PropInstance[];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  yLift?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    items.forEach((p, i) => {
      dummy.position.set(p.x, p.y + yLift, p.z);
      dummy.rotation.set(0, p.rot, 0);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, yLift]);
  if (items.length === 0) return null;
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} frustumCulled={false} />;
}

function makeGeo() {
  const pineTrunk = new THREE.CylinderGeometry(0.12, 0.18, 1.1, 6);
  pineTrunk.translate(0, 0.55, 0);
  const pineCrown = new THREE.ConeGeometry(0.95, 2.3, 7);
  pineCrown.translate(0, 2.0, 0);
  const decTrunk = new THREE.CylinderGeometry(0.14, 0.2, 1.0, 6);
  decTrunk.translate(0, 0.5, 0);
  const decCrown = new THREE.IcosahedronGeometry(1.05, 0);
  decCrown.translate(0, 1.55, 0);
  const rock = new THREE.DodecahedronGeometry(0.55, 0);
  const bloom = new THREE.ConeGeometry(0.08, 0.28, 5);
  bloom.translate(0, 0.16, 0);
  return { pineTrunk, pineCrown, decTrunk, decCrown, rock, bloom };
}

export function Environment() {
  const world = getWorld();
  const terrain = useTerrainGeometry();
  const geos = useMemo(() => makeGeo(), []);
  const mats = useMemo(
    () => ({
      ground: new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
      water: new THREE.MeshStandardMaterial({
        color: "#3e6d7a",
        transparent: true,
        opacity: 0.82,
        roughness: 0.22,
        metalness: 0.05,
      }),
      pineBark: new THREE.MeshLambertMaterial({ color: "#4a3424", flatShading: true }),
      pineNeedles: new THREE.MeshLambertMaterial({ color: "#1e3d28", flatShading: true }),
      decBark: new THREE.MeshLambertMaterial({ color: "#5a3d28", flatShading: true }),
      decLeaves: new THREE.MeshLambertMaterial({ color: "#3a5c32", flatShading: true }),
      rock: new THREE.MeshLambertMaterial({ color: "#6a6558", flatShading: true }),
      bloom: new THREE.MeshLambertMaterial({ color: "#c45c5c", flatShading: true }),
      wood: new THREE.MeshLambertMaterial({ color: "#6b4e32", flatShading: true }),
    }),
    [],
  );
  const water = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!water.current) return;
    water.current.position.y = WATER_LEVEL - 0.08 + Math.sin(clock.elapsedTime * 0.6) * 0.04;
  });

  const west = world.landmarks[0]!;
  const east = world.landmarks[1]!;
  const south = world.landmarks[2]!;
  const north = world.landmarks[3]!;

  return (
    <group>
      <mesh geometry={terrain} material={mats.ground} receiveShadow />
      <mesh ref={water} rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_LEVEL - 0.08, 0]} material={mats.water}>
        <planeGeometry args={[WORLD + 40, WORLD + 40, 1, 1]} />
      </mesh>

      <Instances items={world.pines} geometry={geos.pineTrunk} material={mats.pineBark} />
      <Instances items={world.pines} geometry={geos.pineCrown} material={mats.pineNeedles} />
      <Instances items={world.deciduous} geometry={geos.decTrunk} material={mats.decBark} />
      <Instances items={world.deciduous} geometry={geos.decCrown} material={mats.decLeaves} />
      <Instances items={world.rocks} geometry={geos.rock} material={mats.rock} yLift={0.2} />
      <Instances items={world.flowers} geometry={geos.bloom} material={mats.bloom} />

      {/* Southern gate */}
      <group position={[south.x, sampleY(world.heights, south.x, south.z), south.z]}>
        <mesh position={[-1.6, 1.4, 0]} material={mats.wood}>
          <boxGeometry args={[0.28, 2.8, 0.28]} />
        </mesh>
        <mesh position={[1.6, 1.4, 0]} material={mats.wood}>
          <boxGeometry args={[0.28, 2.8, 0.28]} />
        </mesh>
        <mesh position={[0, 2.7, 0]} material={mats.wood}>
          <boxGeometry args={[3.6, 0.28, 0.28]} />
        </mesh>
      </group>

      {/* North bridge */}
      <group position={[north.x, Math.max(WATER_LEVEL + 0.35, sampleY(world.heights, north.x, north.z)), north.z]}>
        <mesh position={[0, 0.15, 0]} material={mats.wood}>
          <boxGeometry args={[2.2, 0.18, 7.2]} />
        </mesh>
        <mesh position={[-1.05, 0.7, 0]} material={mats.wood}>
          <boxGeometry args={[0.12, 0.9, 7.2]} />
        </mesh>
        <mesh position={[1.05, 0.7, 0]} material={mats.wood}>
          <boxGeometry args={[0.12, 0.9, 7.2]} />
        </mesh>
      </group>

      {/* Western dock post */}
      <group position={[west.x, WATER_LEVEL + 0.1, west.z]}>
        <mesh position={[0, 0.9, 0]} material={mats.wood}>
          <boxGeometry args={[0.22, 1.8, 0.22]} />
        </mesh>
        <mesh position={[0.8, 0.12, 0]} material={mats.wood}>
          <boxGeometry args={[2.2, 0.16, 1.1]} />
        </mesh>
      </group>

      {/* Eastern cairn */}
      <group position={[east.x, sampleY(world.heights, east.x, east.z), east.z]}>
        <mesh position={[0, 0.4, 0]} material={mats.rock}>
          <dodecahedronGeometry args={[0.7, 0]} />
        </mesh>
        <mesh position={[0.15, 1.05, 0]} material={mats.rock}>
          <dodecahedronGeometry args={[0.45, 0]} />
        </mesh>
        <mesh position={[0, 1.55, 0.1]} material={mats.rock}>
          <dodecahedronGeometry args={[0.28, 0]} />
        </mesh>
      </group>

      {/* Crossroads sign */}
      <group position={[-4.8, sampleY(world.heights, -4.8, 3.2) + 0.05, 3.2]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.9, 0]} material={mats.wood}>
          <boxGeometry args={[0.12, 1.8, 0.12]} />
        </mesh>
        <mesh position={[0.45, 1.45, 0]} material={mats.wood}>
          <boxGeometry args={[1.1, 0.28, 0.08]} />
        </mesh>
      </group>

      <group
        position={[world.npc.x, sampleY(world.heights, world.npc.x, world.npc.z), world.npc.z]}
        rotation={[0, world.npc.yaw, 0]}
      >
        <Character tunic="#6a6e72" hair="#1a1814" pack="#3a322c" npc />
      </group>
    </group>
  );
}

function sampleY(heights: Float32Array, x: number, z: number): number {
  const fx = (x + HALF) / TILE_SIZE - 0.5;
  const fz = (z + HALF) / TILE_SIZE - 0.5;
  const x0 = Math.max(0, Math.min(TILES - 1, Math.round(fx)));
  const z0 = Math.max(0, Math.min(TILES - 1, Math.round(fz)));
  return heights[z0 * TILES + x0]!;
}

export function Lights() {
  return (
    <>
      <color attach="background" args={["#8fb4c6"]} />
      <fog attach="fog" args={["#8fb4c6", 48, 210]} />
      <hemisphereLight args={["#d7e6ef", "#3d4a32", 0.78]} />
      <ambientLight intensity={0.32} />
      <directionalLight
        position={[48, 70, 28]}
        intensity={1.15}
        color="#fff4e2"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={10}
        shadow-camera-far={220}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
    </>
  );
}
