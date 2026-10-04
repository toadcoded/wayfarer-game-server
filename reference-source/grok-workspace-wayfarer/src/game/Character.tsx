import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

type Palette = {
  tunic: string;
  pants: string;
  pack: string;
  hair: string;
  skin: string;
};

const PLAYER: Palette = {
  tunic: "#4a6b48",
  pants: "#2a2420",
  pack: "#6b4a32",
  hair: "#1a1410",
  skin: "#c4a07a",
};

const NPC: Palette = {
  tunic: "#5c4a38",
  pants: "#2c2824",
  pack: "#3d4a38",
  hair: "#c8b48a",
  skin: "#b8906a",
};

export function Character({
  walking = false,
  walkRef,
  npc = false,
  scale = 1,
}: {
  walking?: boolean;
  walkRef?: MutableRefObject<boolean>;
  npc?: boolean;
  scale?: number;
}) {
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const p = npc ? NPC : PLAYER;

  useFrame((state) => {
    const moving = walkRef ? walkRef.current : walking;
    const t = state.clock.elapsedTime;
    const amp = moving ? 0.55 : 0;
    const speed = moving ? 9 : 0;
    const swing = Math.sin(t * speed) * amp;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.7;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.7;
    if (torso.current) torso.current.position.y = moving ? Math.abs(Math.sin(t * speed)) * 0.04 : 0;
  });

  return (
    <group scale={scale}>
      <group rotation={[0, Math.PI, 0]}>
        <group ref={torso} position={[0, 0.92, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.52, 0.28]} />
            <meshStandardMaterial color={p.tunic} roughness={0.78} />
          </mesh>
          <mesh position={[0, -0.08, 0.16]} castShadow>
            <boxGeometry args={[0.34, 0.32, 0.14]} />
            <meshStandardMaterial color={p.pack} roughness={0.86} />
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color={p.skin} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.4, 0.02]} castShadow>
            <sphereGeometry args={[0.21, 8, 6]} />
            <meshStandardMaterial color={p.hair} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.28, -0.18]}>
            <boxGeometry args={[0.06, 0.05, 0.06]} />
            <meshStandardMaterial color={p.skin} />
          </mesh>
        </group>
        <group ref={leftArm} position={[-0.28, 1.05, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <boxGeometry args={[0.12, 0.42, 0.12]} />
            <meshStandardMaterial color={p.tunic} />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.28, 1.05, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <boxGeometry args={[0.12, 0.42, 0.12]} />
            <meshStandardMaterial color={p.tunic} />
          </mesh>
        </group>
        <group ref={leftLeg} position={[-0.12, 0.66, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <boxGeometry args={[0.16, 0.5, 0.16]} />
            <meshStandardMaterial color={p.pants} />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.12, 0.66, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <boxGeometry args={[0.16, 0.5, 0.16]} />
            <meshStandardMaterial color={p.pants} />
          </mesh>
        </group>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.38, 12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>
    </group>
  );
}
