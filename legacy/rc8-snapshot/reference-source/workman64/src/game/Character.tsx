import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

type Palette = {
  tunic: string;
  cloak: string;
  pants: string;
  pack: string;
  hair: string;
  skin: string;
  staff: string;
  sash: string;
};

export type CharacterKind = "player" | "rowan" | "miller" | "keeper" | "trader";

const PALETTES: Record<CharacterKind, Palette> = {
  player: {
    tunic: "#6db35a",
    cloak: "#3a2c22",
    pants: "#2c241c",
    pack: "#8a5a32",
    hair: "#1c1410",
    skin: "#d4a878",
    staff: "#6a4628",
    sash: "#efe4c8",
  },
  rowan: {
    tunic: "#e6d7b8",
    cloak: "#5a6b48",
    pants: "#3a342c",
    pack: "#6b5234",
    hair: "#c8b48a",
    skin: "#c49a72",
    staff: "#4a3424",
    sash: "#6b8f6a",
  },
  miller: {
    tunic: "#8a6238",
    cloak: "#4a3428",
    pants: "#2a221c",
    pack: "#5a4030",
    hair: "#3a2418",
    skin: "#c49a72",
    staff: "#5a4030",
    sash: "#d8c8a0",
  },
  keeper: {
    tunic: "#4a6a48",
    cloak: "#2c241c",
    pants: "#24201c",
    pack: "#4a3a28",
    hair: "#1a1410",
    skin: "#b89068",
    staff: "#3d4a3a",
    sash: "#c45c4a",
  },
  trader: {
    tunic: "#8a4a38",
    cloak: "#5a3a28",
    pants: "#2c241c",
    pack: "#6b5234",
    hair: "#4a3020",
    skin: "#d4a878",
    staff: "#6b5234",
    sash: "#d8c070",
  },
};

export function Character({
  walking = false,
  walkRef,
  npc = false,
  kind,
  scale,
}: {
  walking?: boolean;
  walkRef?: MutableRefObject<boolean>;
  npc?: boolean;
  kind?: CharacterKind;
  scale?: number;
}) {
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const cloak = useRef<Group>(null);
  const root = useRef<Group>(null);
  const role: CharacterKind = kind ?? (npc ? "rowan" : "player");
  const p = PALETTES[role];
  const s = scale ?? (role === "player" ? 1.92 : 1.72);

  useFrame((state) => {
    const moving = walkRef ? walkRef.current : walking;
    const t = state.clock.elapsedTime;
    const amp = moving ? 0.62 : 0;
    const speed = moving ? 8.2 : 0;
    const swing = Math.sin(t * speed) * amp;
    const breath = Math.sin(t * 1.7) * 0.018;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.72;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.38;
    if (torso.current) {
      torso.current.position.y = 1.18 + (moving ? Math.abs(Math.sin(t * speed)) * 0.05 : breath);
      torso.current.rotation.x = moving ? 0.12 : 0.02;
    }
    if (cloak.current) cloak.current.rotation.x = moving ? 0.34 + Math.sin(t * speed) * 0.1 : 0.18;
    if (root.current) root.current.position.y = -0.08 + (moving ? Math.abs(Math.sin(t * speed)) * 0.04 : 0);
  });

  return (
    <group scale={s}>
      <group ref={root} rotation={[0, Math.PI, 0]} position={[0, -0.08, 0]}>
        <group ref={torso} position={[0, 1.18, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.48, 0.62, 0.32]} />
            <meshStandardMaterial color={p.tunic} roughness={0.62} emissive={p.tunic} emissiveIntensity={0.08} />
          </mesh>
          <mesh position={[0, -0.06, 0.01]} castShadow>
            <boxGeometry args={[0.5, 0.12, 0.34]} />
            <meshStandardMaterial color={p.sash} roughness={0.55} />
          </mesh>
          <group ref={cloak} position={[0, 0.04, 0.18]}>
            <mesh position={[0, -0.22, 0.1]} rotation={[0.18, 0, 0]} castShadow>
              <boxGeometry args={[0.62, 0.88, 0.1]} />
              <meshStandardMaterial color={p.cloak} roughness={0.9} />
            </mesh>
          </group>
          <mesh position={[0, -0.02, 0.2]} castShadow>
            <boxGeometry args={[0.34, 0.3, 0.16]} />
            <meshStandardMaterial color={p.pack} roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.44, 0]} castShadow>
            <sphereGeometry args={[0.22, 10, 8]} />
            <meshStandardMaterial color={p.skin} roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.54, 0.02]} castShadow>
            <sphereGeometry args={[0.24, 10, 7]} />
            <meshStandardMaterial color={p.hair} roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.5, 0.06]} rotation={[0.22, 0, 0]} castShadow>
            <boxGeometry args={[0.38, 0.14, 0.32]} />
            <meshStandardMaterial color={p.cloak} roughness={0.86} />
          </mesh>
          <mesh position={[-0.07, 0.46, -0.18]}>
            <boxGeometry args={[0.05, 0.04, 0.04]} />
            <meshStandardMaterial color="#1a1410" />
          </mesh>
          <mesh position={[0.07, 0.46, -0.18]}>
            <boxGeometry args={[0.05, 0.04, 0.04]} />
            <meshStandardMaterial color="#1a1410" />
          </mesh>
        </group>
        <group ref={leftArm} position={[-0.32, 1.32, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.14, 0.5, 0.14]} />
            <meshStandardMaterial color={p.tunic} roughness={0.62} />
          </mesh>
          <mesh position={[0, -0.5, 0]} castShadow>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshStandardMaterial color={p.skin} />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.32, 1.32, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.14, 0.5, 0.14]} />
            <meshStandardMaterial color={p.tunic} roughness={0.62} />
          </mesh>
          <mesh position={[0.05, -0.52, 0.14]} rotation={[0.38, 0, 0.08]} castShadow>
            <cylinderGeometry args={[0.03, 0.042, 1.62, 6]} />
            <meshStandardMaterial color={p.staff} roughness={0.82} />
          </mesh>
        </group>
        <group ref={leftLeg} position={[-0.13, 0.78, 0]}>
          <mesh position={[0, -0.32, 0]} castShadow>
            <boxGeometry args={[0.18, 0.58, 0.18]} />
            <meshStandardMaterial color={p.pants} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.64, 0.05]} castShadow>
            <boxGeometry args={[0.2, 0.12, 0.26]} />
            <meshStandardMaterial color="#1a1612" />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.13, 0.78, 0]}>
          <mesh position={[0, -0.32, 0]} castShadow>
            <boxGeometry args={[0.18, 0.58, 0.18]} />
            <meshStandardMaterial color={p.pants} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.64, 0.05]} castShadow>
            <boxGeometry args={[0.2, 0.12, 0.26]} />
            <meshStandardMaterial color="#1a1612" />
          </mesh>
        </group>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.42, 0.58, 20]} />
        <meshBasicMaterial color={role === "player" ? "#efe4c8" : "#6b8f6a"} transparent opacity={0.72} />
      </mesh>
    </group>
  );
}
