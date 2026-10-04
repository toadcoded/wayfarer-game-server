import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  BIOME_NAME,
  CROSSROADS,
  DISTRICTS,
  FOLK,
  TILE_SIZE,
  TILES,
  VERT,
  WATER_LEVEL,
  getWorld,
  sampleGround,
  tileCenter,
  tileLeftEdge,
  trailBeacons,
  type ResourceNode,
  type World,
} from "./world.ts";
import { Character } from "./Character.tsx";
import { useGame } from "./store.ts";

const BIOME_COLOR: Record<string, [number, number, number]> = {
  water: [0.32, 0.64, 0.82],
  shore: [0.84, 0.74, 0.48],
  path: [0.86, 0.76, 0.5],
  meadow: [0.4, 0.78, 0.28],
  forest: [0.26, 0.54, 0.2],
  highland: [0.8, 0.82, 0.84],
  bridge: [0.72, 0.76, 0.8],
};

const BIOME_COLOR_B: Record<string, [number, number, number]> = {
  water: [0.22, 0.5, 0.7],
  shore: [0.72, 0.62, 0.38],
  path: [0.72, 0.62, 0.4],
  meadow: [0.26, 0.56, 0.16],
  forest: [0.18, 0.4, 0.14],
  highland: [0.62, 0.64, 0.68],
  bridge: [0.56, 0.6, 0.64],
};

const NODE_COLOR: Record<string, string> = {
  wood: "#6b4a28",
  forage: "#c45c6a",
  stone: "#8a8478",
  reed: "#7a8f4a",
};

function Terrain({ world }: { world: World }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(TILES * TILE_SIZE, TILES * TILE_SIZE, TILES, TILES);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const ix = i % VERT;
      const iz = (i / VERT) | 0;
      pos.setY(i, world.heights[iz * VERT + ix]);
      const ctx = Math.min(TILES - 1, ix);
      const ctz = Math.min(TILES - 1, iz);
      const biome = BIOME_NAME[world.biomes[ctz * TILES + ctx]] ?? "meadow";
      const check = ((ix + iz) & 1) === 0;
      const c = (check ? BIOME_COLOR : BIOME_COLOR_B)[biome];
      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
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

function Orchard({ world }: { world: World }) {
  const trees = useMemo(() => world.trees.filter((t) => t.kind === 2), [world]);
  const trunk = useMemo(() => new THREE.CylinderGeometry(0.09, 0.14, 0.9, 5), []);
  const crown = useMemo(() => new THREE.IcosahedronGeometry(0.72, 0), []);
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
    place(tRef.current, 0.45);
    place(cRef.current, 1.2, 1.05);
  }, [trees, dummy]);
  if (!trees.length) return null;
  return (
    <group>
      <instancedMesh ref={tRef} args={[trunk, undefined, trees.length]} castShadow>
        <meshStandardMaterial color="#4a3424" />
      </instancedMesh>
      <instancedMesh ref={cRef} args={[crown, undefined, trees.length]} castShadow>
        <meshStandardMaterial color="#6a8a3a" roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

function StreetLanterns({ world }: { world: World }) {
  const posts = useMemo(() => {
    const pts = trailBeacons();
    pts.push({ tx: 45, tz: 45 }, { tx: 51, tz: 45 }, { tx: 45, tz: 51 }, { tx: 51, tz: 51 });
    pts.push({ tx: 54, tz: 50 }, { tx: 45, tz: 60 }, { tx: 40, tz: 24 }, { tx: 16, tz: 47 });
    return pts;
  }, []);
  return (
    <group>
      {posts.map((p) => {
        const y = world.walkHeight[p.tz * TILES + p.tx] ?? 2;
        return (
          <group key={`${p.tx},${p.tz}`} position={[tileCenter(p.tx) + 1.15, y, tileCenter(p.tz) + 1.15]}>
            <mesh position={[0, 1.35, 0]} castShadow>
              <cylinderGeometry args={[0.055, 0.08, 2.7, 5]} />
              <meshStandardMaterial color="#3a2a1c" />
            </mesh>
            <mesh position={[0, 2.75, 0]}>
              <sphereGeometry args={[0.16, 8, 6]} />
              <meshStandardMaterial color="#e8c46a" emissive="#e8c46a" emissiveIntensity={0.85} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function MarketStalls({ world }: { world: World }) {
  const d = DISTRICTS.find((x) => x.id === "market")!;
  const stalls = [
    { tx: d.tx0 + 1, tz: d.tz0 + 1 },
    { tx: d.tx0 + 3, tz: d.tz0 + 1 },
    { tx: d.tx0 + 1, tz: d.tz0 + 3 },
  ];
  return (
    <group>
      {stalls.map((s) => {
        const y = world.walkHeight[s.tz * TILES + s.tx];
        return (
          <group key={`${s.tx},${s.tz}`} position={[tileCenter(s.tx), y, tileCenter(s.tz)]}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <boxGeometry args={[2.2, 1.1, 1.4]} />
              <meshStandardMaterial color="#6b5234" />
            </mesh>
            <mesh position={[0, 1.35, 0]} rotation={[0, 0.2, 0.12]} castShadow>
              <boxGeometry args={[2.6, 0.12, 1.7]} />
              <meshStandardMaterial color="#8a3a32" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function GardenBeds({ world }: { world: World }) {
  const d = DISTRICTS.find((x) => x.id === "garden")!;
  const beds = [
    [d.tx0 + 1, d.tz0 + 1],
    [d.tx0 + 3, d.tz0 + 2],
    [d.tx0 + 1, d.tz0 + 4],
  ] as const;
  return (
    <group>
      {beds.map(([tx, tz]) => {
        const y = world.walkHeight[tz * TILES + tx];
        return (
          <group key={`${tx},${tz}`} position={[tileCenter(tx), y, tileCenter(tz)]}>
            <mesh position={[0, 0.08, 0]} receiveShadow>
              <boxGeometry args={[2.4, 0.16, 1.4]} />
              <meshStandardMaterial color="#5a4630" />
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <boxGeometry args={[2.1, 0.22, 1.1]} />
              <meshStandardMaterial color="#3d6a32" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function MillWheel({ world }: { world: World }) {
  const b = world.buildings.find((x) => x.id === "mill");
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.45;
  });
  if (!b) return null;
  const x = tileCenter(b.tx) + ((b.sx - 1) * TILE_SIZE) / 2;
  const z = tileCenter(b.tz) + ((b.sz - 1) * TILE_SIZE) / 2;
  const y = world.walkHeight[b.tz * TILES + b.tx];
  return (
    <group position={[x + b.sx * 1.6, y + 1.8, z]} rotation={[0, Math.PI / 2, 0]}>
      <group ref={ref}>
        <mesh>
          <torusGeometry args={[1.35, 0.12, 6, 16]} />
          <meshStandardMaterial color="#4a3424" />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
            <boxGeometry args={[2.5, 0.1, 0.28]} />
            <meshStandardMaterial color="#5a4030" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Water({ world }: { world: World }) {
  const geo = useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    let v = 0;
    for (let tz = 0; tz < TILES; tz++) {
      for (let tx = 0; tx < TILES; tx++) {
        if (BIOME_NAME[world.biomes[tz * TILES + tx]] !== "water") continue;
        const x0 = tileLeftEdge(tx);
        const z0 = tileLeftEdge(tz);
        const x1 = x0 + TILE_SIZE;
        const z1 = z0 + TILE_SIZE;
        const y = 0;
        positions.push(x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1);
        indices.push(v, v + 1, v + 2, v, v + 2, v + 3);
        v += 4;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [world]);
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.position.y = WATER_LEVEL + Math.sin(s.clock.elapsedTime * 0.45) * 0.035;
  });
  if (geo.getAttribute("position")?.count === 0) return null;
  return (
    <mesh ref={ref} geometry={geo}>
      <meshStandardMaterial
        color="#2d6a74"
        transparent
        opacity={0.78}
        roughness={0.16}
        metalness={0.14}
        depthWrite={false}
      />
    </mesh>
  );
}

function TrailCones({ world }: { world: World }) {
  const cones = useMemo(() => trailBeacons(), []);
  return (
    <group>
      {cones.map((c) => {
        const y = world.walkHeight[c.tz * TILES + c.tx];
        return (
          <group key={`${c.tx},${c.tz}`} position={[tileCenter(c.tx), y, tileCenter(c.tz)]}>
            <mesh position={[0, 0.28, 0]} castShadow>
              <coneGeometry args={[0.18, 0.46, 5]} />
              <meshStandardMaterial color="#c45c4a" roughness={0.55} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Folio({ world }: { world: World }) {
  const trails = useGame((s) => s.trails);
  return (
    <group>
      {world.landmarks.map((lm) => {
        if (trails[lm.id]) return null;
        const y = world.walkHeight[lm.tz * TILES + lm.tx];
        return (
          <group key={lm.id} position={[tileCenter(lm.tx), y + 0.85, tileCenter(lm.tz)]}>
            <mesh rotation={[-0.55, 0.4, 0.08]} castShadow>
              <boxGeometry args={[0.42, 0.04, 0.56]} />
              <meshStandardMaterial color="#e8e0d0" roughness={0.7} />
            </mesh>
            <mesh rotation={[-0.55, 0.4, 0.08]} position={[0, 0.03, 0]}>
              <boxGeometry args={[0.28, 0.02, 0.4]} />
              <meshStandardMaterial color="#6b8f6a" roughness={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Signpost({ world }: { world: World }) {
  const y = world.walkHeight[CROSSROADS.tz * TILES + CROSSROADS.tx];
  const arms: [number, number, number][] = [
    [0, 1.55, -0.55],
    [0, 1.35, 0.55],
    [-0.55, 1.45, 0],
    [0.55, 1.25, 0],
  ];
  return (
    <group position={[tileCenter(CROSSROADS.tx), y, tileCenter(CROSSROADS.tz)]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.11, 2.3, 6]} />
        <meshStandardMaterial color="#4a3424" roughness={0.95} />
      </mesh>
      {arms.map(([x, yy, z], i) => (
        <mesh key={i} position={[x, yy, z]} rotation={[0, i < 2 ? 0 : Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[0.7, 0.16, 0.08]} />
          <meshStandardMaterial color="#6b5234" />
        </mesh>
      ))}
    </group>
  );
}

function NodeMarker({ node, world }: { node: ResourceNode; world: World }) {
  const ready = useGame((s) => s.isNodeReady(node.id));
  const y = world.walkHeight[node.tz * TILES + node.tx];
  const bob = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (!bob.current) return;
    bob.current.position.y = y + 0.55 + Math.sin(st.clock.elapsedTime * 2 + node.tx) * 0.08;
    bob.current.rotation.y = st.clock.elapsedTime * 0.6;
  });
  if (!ready) return null;
  const color = NODE_COLOR[node.kind] ?? "#c4bba8";
  return (
    <group position={[tileCenter(node.tx), 0, tileCenter(node.tz)]}>
      <group ref={bob}>
        <mesh castShadow>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.35}
            roughness={0.45}
          />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y + 0.04, 0]}>
        <ringGeometry args={[0.35, 0.48, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
    </group>
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
      <group position={[tileCenter(n.tx), ny, tileCenter(n.tz)]}>
        <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[TILE_SIZE * 3 - 0.4, 0.2, TILE_SIZE * 5 - 0.4]} />
          <meshStandardMaterial color="#6b4e32" roughness={0.9} />
        </mesh>
        <mesh position={[-(TILE_SIZE * 1.5 - 0.32), 0.42, 0]} castShadow>
          <boxGeometry args={[0.16, 0.55, TILE_SIZE * 5 - 0.4]} />
          <meshStandardMaterial color="#4a3424" />
        </mesh>
        <mesh position={[TILE_SIZE * 1.5 - 0.32, 0.42, 0]} castShadow>
          <boxGeometry args={[0.16, 0.55, TILE_SIZE * 5 - 0.4]} />
          <meshStandardMaterial color="#4a3424" />
        </mesh>
        {[-(TILE_SIZE * 2), TILE_SIZE * 2].map((z) => (
          <group key={z}>
            <mesh position={[-(TILE_SIZE * 1.5 - 0.32), 0.85, z]}>
              <boxGeometry args={[0.22, 1.2, 0.22]} />
              <meshStandardMaterial color="#3d2a1c" />
            </mesh>
            <mesh position={[TILE_SIZE * 1.5 - 0.32, 0.85, z]}>
              <boxGeometry args={[0.22, 1.2, 0.22]} />
              <meshStandardMaterial color="#3d2a1c" />
            </mesh>
          </group>
        ))}
      </group>

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

function Fountain({ world }: { world: World }) {
  const y = world.walkHeight[CROSSROADS.tz * TILES + CROSSROADS.tx];
  const lit = useGame((s) => s.tithe.lantern);
  return (
    <group position={[tileCenter(CROSSROADS.tx), y, tileCenter(CROSSROADS.tz)]}>
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <cylinderGeometry args={[2.15, 2.3, 0.32, 12]} />
        <meshStandardMaterial color="#8aa0b0" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[1.55, 1.7, 0.22, 12]} />
        <meshStandardMaterial color="#6a90a8" roughness={0.3} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.9, 8]} />
        <meshStandardMaterial color="#7a90a0" />
      </mesh>
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.7, 0.55, 0.18, 10]} />
        <meshStandardMaterial color="#6a90a8" roughness={0.25} />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial
          color={lit ? "#ffe08a" : "#5a5040"}
          emissive={lit ? "#ffcc66" : "#000000"}
          emissiveIntensity={lit ? 1.4 : 0}
        />
      </mesh>
      {lit && <pointLight intensity={1.6} distance={14} color="#ffd27a" position={[0, 2.2, 0]} />}
    </group>
  );
}

function VillageBuildings({ world }: { world: World }) {
  return (
    <group>
      {world.buildings.map((b) => {
        const x = tileCenter(b.tx) + ((b.sx - 1) * TILE_SIZE) / 2;
        const z = tileCenter(b.tz) + ((b.sz - 1) * TILE_SIZE) / 2;
        const y = world.walkHeight[b.tz * TILES + b.tx];
        const w = b.sx * TILE_SIZE - 0.35;
        const d = b.sz * TILE_SIZE - 0.35;
        return (
          <group key={b.id} position={[x, y, z]}>
            <mesh position={[0, b.h * 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, b.h, d]} />
              <meshStandardMaterial color={b.wall} roughness={0.92} />
            </mesh>
            <mesh position={[0, b.h + 0.85, 0]} rotation={[0, 0, 0]} castShadow>
              <boxGeometry args={[w + 0.4, 1.7, d + 0.4]} />
              <meshStandardMaterial color={b.roof} roughness={0.88} />
            </mesh>
            {b.id === "chapel" && (
              <mesh position={[0, b.h + 2.6, 0]} castShadow>
                <coneGeometry args={[1.1, 2.4, 4]} />
                <meshStandardMaterial color="#3d4a3a" />
              </mesh>
            )}
            {b.id === "mill" && (
              <mesh position={[w * 0.2, b.h + 2.2, 0]} castShadow>
                <cylinderGeometry args={[0.45, 0.55, 2.2, 8]} />
                <meshStandardMaterial color="#6a5a4a" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Villagers({ world }: { world: World }) {
  return (
    <group>
      {FOLK.map((f) => {
        const x = tileCenter(f.tx);
        const z = tileCenter(f.tz);
        const y = sampleGround(world, x, z);
        return (
          <group key={f.id} position={[x, y, z]} rotation={[0, f.yaw, 0]}>
            <Character npc kind={f.kind} />
          </group>
        );
      })}
    </group>
  );
}

export function Environment() {
  const world = getWorld();
  const rockGeo = useMemo(() => new THREE.IcosahedronGeometry(0.55, 0), []);
  const flowerGeo = useMemo(() => new THREE.ConeGeometry(0.12, 0.28, 5), []);
  return (
    <group>
      <Terrain world={world} />
      <Water world={world} />
      <Pines world={world} />
      <Deciduous world={world} />
      <Orchard world={world} />
      <Instanced items={world.rocks} geometry={rockGeo} color="#6a6560" yLift={0.2} />
      <Instanced items={world.flowers} geometry={flowerGeo} color="#c45c6a" yLift={0.12} cast={false} />
      <Landmarks world={world} />
      <VillageBuildings world={world} />
      <MillWheel world={world} />
      <MarketStalls world={world} />
      <GardenBeds world={world} />
      <StreetLanterns world={world} />
      <Fountain world={world} />
      <TrailCones world={world} />
      <Folio world={world} />
      <Signpost world={world} />
      {world.nodes.map((n) => (
        <NodeMarker key={n.id} node={n} world={world} />
      ))}
      <Villagers world={world} />
    </group>
  );
}


