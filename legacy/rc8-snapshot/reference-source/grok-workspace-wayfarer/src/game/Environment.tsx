import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  BIOME_NAME,
  HALF,
  TILE_SIZE,
  TILES,
  VERT,
  WATER_LEVEL,
  getWorld,
  tileCenter,
  type World,
} from "./world.ts";
import { Character } from "./Character.tsx";

const BIOME_COLOR: Record<string, [number, number, number]> = {
  water: [0.16, 0.34, 0.38],
  shore: [0.72, 0.66, 0.46],
  path: [0.52, 0.42, 0.26],
  meadow: [0.38, 0.55, 0.28],
  forest: [0.2, 0.36, 0.2],
  highland: [0.34, 0.48, 0.28],
  bridge: [0.48, 0.36, 0.22],
};

function Terrain({ world }: { world: World }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(TILES * TILE_SIZE, TILES * TILE_SIZE, TILES, TILES);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const ix = Math.max(0, Math.min(TILES, Math.round((x + HALF) / TILE_SIZE)));
      const iz = Math.max(0, Math.min(TILES, Math.round((z + HALF) / TILE_SIZE)));
      const h = world.heights[iz * VERT + ix];
      pos.setY(i, h);
      const ctx = Math.max(0, Math.min(TILES - 1, ix === TILES ? TILES - 1 : ix));
      const ctz = Math.max(0, Math.min(TILES - 1, iz === TILES ? TILES - 1 : iz));
      const biome = BIOME_NAME[world.biomes[ctz * TILES + ctx]] ?? "meadow";
      const c = BIOME_COLOR[biome];
      const n = 0.92 + ((ix * 13 + iz * 7) % 5) * 0.02;
      colors[i * 3] = c[0] * n;
      colors[i * 3 + 1] = c[1] * n;
      colors[i * 3 + 2] = c[2] * n;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [world]);

  return (
    <mesh geometry={geo} receiveShadow name="terrain">
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0} />
    </mesh>
  );
}

function Instanced({
  items,
  geometry,
  color,
  yLift = 0,
  cast = true,
}: {
  items: World["trees"];
  geometry: THREE.BufferGeometry;
  color: string;
  yLift?: number;
  cast?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      dummy.position.set(p.x, p.y + yLift, p.z);
      dummy.rotation.set(0, p.r, 0);
      dummy.scale.setScalar(p.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [items, dummy, yLift]);
  if (!items.length) return null;
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} castShadow={cast} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.85} />
    </instancedMesh>
  );
}

function Pines({ world }: { world: World }) {
  const pines = useMemo(() => world.trees.filter((t) => t.kind === 0), [world]);
  const trunk = useMemo(() => new THREE.CylinderGeometry(0.12, 0.18, 1.1, 5), []);
  const cone = useMemo(() => new THREE.ConeGeometry(0.85, 2.1, 6), []);
  const cone2 = useMemo(() => new THREE.ConeGeometry(0.62, 1.5, 6), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);
  const crown2Ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const place = (mesh: THREE.InstancedMesh | null, lift: number, sy = 1, sx = 1) => {
      if (!mesh) return;
      for (let i = 0; i < pines.length; i++) {
        const p = pines[i];
        dummy.position.set(p.x, p.y + lift * p.s, p.z);
        dummy.rotation.set(0, p.r, 0);
        dummy.scale.set(p.s * sx, p.s * sy, p.s * sx);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    place(trunkRef.current, 0.55, 1, 1);
    place(crownRef.current, 1.7, 1, 1);
    place(crown2Ref.current, 2.55, 0.85, 0.78);
  }, [pines, dummy]);

  if (!pines.length) return null;
  return (
    <group>
      <instancedMesh ref={trunkRef} args={[trunk, undefined, pines.length]} castShadow>
        <meshStandardMaterial color="#3a2a1c" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={crownRef} args={[cone, undefined, pines.length]} castShadow>
        <meshStandardMaterial color="#1f3d24" roughness={0.88} />
      </instancedMesh>
      <instancedMesh ref={crown2Ref} args={[cone2, undefined, pines.length]} castShadow>
        <meshStandardMaterial color="#2a4e2e" roughness={0.86} />
      </instancedMesh>
    </group>
  );
}

function Deciduous({ world }: { world: World }) {
  const trees = useMemo(() => world.trees.filter((t) => t.kind === 1), [world]);
  const trunk = useMemo(() => new THREE.CylinderGeometry(0.1, 0.16, 1.0, 5), []);
  const crown = useMemo(() => new THREE.IcosahedronGeometry(0.85, 0), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tRef = useRef<THREE.InstancedMesh>(null);
  const cRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const place = (mesh: THREE.InstancedMesh | null, lift: number, s = 1) => {
      if (!mesh) return;
      for (let i = 0; i < trees.length; i++) {
        const p = trees[i];
        dummy.position.set(p.x, p.y + lift * p.s, p.z);
        dummy.rotation.set(0, p.r, 0);
        dummy.scale.setScalar(p.s * s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    place(tRef.current, 0.5);
    place(cRef.current, 1.45, 1.15);
  }, [trees, dummy]);
  if (!trees.length) return null;
  return (
    <group>
      <instancedMesh ref={tRef} args={[trunk, undefined, trees.length]} castShadow>
        <meshStandardMaterial color="#4a3424" />
      </instancedMesh>
      <instancedMesh ref={cRef} args={[crown, undefined, trees.length]} castShadow>
        <meshStandardMaterial color="#4a7a3a" roughness={0.84} />
      </instancedMesh>
    </group>
  );
}

function Water() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.position.y = WATER_LEVEL + Math.sin(s.clock.elapsedTime * 0.4) * 0.04;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_LEVEL, 0]}>
      <planeGeometry args={[TILES * TILE_SIZE, TILES * TILE_SIZE]} />
      <meshStandardMaterial
        color="#2a6570"
        transparent
        opacity={0.72}
        roughness={0.18}
        metalness={0.12}
        depthWrite={false}
      />
    </mesh>
  );
}

function Landmarks({ world }: { world: World }) {
  const n = world.landmarks.find((l) => l.id === "north")!;
  const w = world.landmarks.find((l) => l.id === "west")!;
  const e = world.landmarks.find((l) => l.id === "east")!;
  const s = world.landmarks.find((l) => l.id === "south")!;
  const ny = world.walkHeight[n.tz * TILES + n.tx];
  const wy = world.walkHeight[w.tz * TILES + w.tx];
  const ey = world.walkHeight[e.tz * TILES + e.tx];
  const sy = world.walkHeight[s.tz * TILES + s.tx];

  return (
    <group>
      {/* North bridge — deck spans Z across the east-west river. */}
      <group position={[tileCenter(n.tx), ny, tileCenter(n.tz)]}>
        <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.2, 8.4]} />
          <meshStandardMaterial color="#6b4e32" roughness={0.9} />
        </mesh>
        <mesh position={[-1.1, 0.38, 0]} castShadow>
          <boxGeometry args={[0.16, 0.55, 8.4]} />
          <meshStandardMaterial color="#4a3424" />
        </mesh>
        <mesh position={[1.1, 0.38, 0]} castShadow>
          <boxGeometry args={[0.16, 0.55, 8.4]} />
          <meshStandardMaterial color="#4a3424" />
        </mesh>
        {[-3.2, 3.2].map((z) => (
          <group key={z}>
            <mesh position={[-1.1, 0.7, z]}>
              <boxGeometry args={[0.22, 1.2, 0.22]} />
              <meshStandardMaterial color="#3d2a1c" />
            </mesh>
            <mesh position={[1.1, 0.7, z]}>
              <boxGeometry args={[0.22, 1.2, 0.22]} />
              <meshStandardMaterial color="#3d2a1c" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Western dock */}
      <group position={[tileCenter(w.tx), wy, tileCenter(w.tz)]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[3.4, 0.16, 1.6]} />
          <meshStandardMaterial color="#6a5136" />
        </mesh>
        {[-1.2, 0, 1.2].map((x) => (
          <mesh key={x} position={[x, -0.4, 0.7]}>
            <cylinderGeometry args={[0.1, 0.12, 1.1, 5]} />
            <meshStandardMaterial color="#3a2a1c" />
          </mesh>
        ))}
        <mesh position={[0.9, 0.38, 0]} castShadow>
          <boxGeometry args={[0.7, 0.5, 0.55]} />
          <meshStandardMaterial color="#8a6a40" />
        </mesh>
      </group>

      {/* Eastern cairn */}
      <group position={[tileCenter(e.tx), ey, tileCenter(e.tz)]}>
        {[
          [0, 0.55, 0, 0.7],
          [-0.55, 0.35, 0.2, 0.5],
          [0.5, 0.4, -0.15, 0.55],
          [0.1, 1.05, 0.05, 0.38],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <icosahedronGeometry args={[r, 0]} />
            <meshStandardMaterial color={i % 2 ? "#7a7368" : "#5e5850"} roughness={0.95} />
          </mesh>
        ))}
      </group>

      {/* Southern gate */}
      <group position={[tileCenter(s.tx), sy, tileCenter(s.tz)]}>
        <mesh position={[-1.6, 1.6, 0]} castShadow>
          <boxGeometry args={[0.7, 3.2, 0.7]} />
          <meshStandardMaterial color="#6a6560" />
        </mesh>
        <mesh position={[1.6, 1.6, 0]} castShadow>
          <boxGeometry args={[0.7, 3.2, 0.7]} />
          <meshStandardMaterial color="#6a6560" />
        </mesh>
        <mesh position={[0, 3.05, 0]} castShadow>
          <boxGeometry args={[4.1, 0.5, 0.7]} />
          <meshStandardMaterial color="#5a5550" />
        </mesh>
        <mesh position={[0, 1.1, 0.05]}>
          <boxGeometry args={[2.4, 2.1, 0.12]} />
          <meshStandardMaterial color="#4a3428" roughness={0.88} />
        </mesh>
      </group>
    </group>
  );
}

export function Environment() {
  const world = getWorld();
  const rockGeo = useMemo(() => new THREE.DodecahedronGeometry(0.55, 0), []);
  const flowerGeo = useMemo(() => new THREE.ConeGeometry(0.12, 0.28, 5), []);
  return (
    <group>
      <Terrain world={world} />
      <Water />
      <Pines world={world} />
      <Deciduous world={world} />
      <Instanced items={world.rocks} geometry={rockGeo} color="#6a6560" yLift={0.2} />
      <Instanced items={world.flowers} geometry={flowerGeo} color="#c45c6a" yLift={0.12} cast={false} />
      <Landmarks world={world} />
      <group position={[world.npc.x, sampleY(world, world.npc.x, world.npc.z), world.npc.z]} rotation={[0, world.npc.yaw, 0]}>
        <Character npc scale={0.95} />
      </group>
    </group>
  );
}

function sampleY(world: World, x: number, z: number) {
  const { tx, tz } = { tx: Math.floor((x + HALF) / TILE_SIZE), tz: Math.floor((z + HALF) / TILE_SIZE) };
  const ttx = Math.max(0, Math.min(TILES - 1, tx));
  const ttz = Math.max(0, Math.min(TILES - 1, tz));
  return world.walkHeight[ttz * TILES + ttx];
}
