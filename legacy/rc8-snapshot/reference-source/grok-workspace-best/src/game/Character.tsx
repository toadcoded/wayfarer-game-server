import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  tunic?: string;
  skin?: string;
  hair?: string;
  pack?: string;
  walkRef?: MutableRefObject<number>;
  npc?: boolean;
};

export function Character({
  tunic = "#4f6a4a",
  skin = "#c4a07a",
  hair = "#2a2118",
  pack = "#6b4a32",
  walkRef,
  npc = false,
}: Props) {
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const body = useRef<THREE.Group>(null);
  const phase = useRef(0);

  const mats = useMemo(
    () => ({
      tunic: new THREE.MeshStandardMaterial({ color: tunic, roughness: 0.86 }),
      skin: new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 }),
      hair: new THREE.MeshStandardMaterial({ color: hair, roughness: 0.9 }),
      pack: new THREE.MeshStandardMaterial({ color: pack, roughness: 0.8 }),
      dark: new THREE.MeshStandardMaterial({ color: "#2c241c", roughness: 0.85 }),
    }),
    [tunic, skin, hair, pack],
  );

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1);
    const walking = walkRef ? walkRef.current : 0;
    phase.current += walking * 9.5 * d;
    const swing = Math.sin(phase.current) * Math.min(1, walking) * 0.55;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.7;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.7;
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(phase.current * 2)) * walking * 0.05;
    }
  });

  return (
    <group>
      <group ref={body}>
        <mesh position={[0, 0.95, 0]} material={mats.tunic} castShadow>
          <boxGeometry args={[0.38, 0.52, 0.26]} />
        </mesh>
        <mesh position={[0, 1.32, 0]} material={mats.skin} castShadow>
          <sphereGeometry args={[0.155, 8, 8]} />
        </mesh>
        <mesh position={[0, 1.4, -0.02]} material={mats.hair} castShadow>
          <sphereGeometry args={[0.165, 8, 8]} />
        </mesh>
        {!npc && (
          <mesh position={[0, 1.02, -0.2]} material={mats.pack} castShadow>
            <boxGeometry args={[0.28, 0.32, 0.14]} />
          </mesh>
        )}
        <group ref={leftArm} position={[-0.26, 1.08, 0]}>
          <mesh position={[0, -0.16, 0]} material={mats.tunic} castShadow>
            <boxGeometry args={[0.1, 0.38, 0.1]} />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.26, 1.08, 0]}>
          <mesh position={[0, -0.16, 0]} material={mats.tunic} castShadow>
            <boxGeometry args={[0.1, 0.38, 0.1]} />
          </mesh>
        </group>
        <group ref={leftLeg} position={[-0.1, 0.62, 0]}>
          <mesh position={[0, -0.22, 0]} material={mats.dark} castShadow>
            <boxGeometry args={[0.12, 0.44, 0.12]} />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.1, 0.62, 0]}>
          <mesh position={[0, -0.22, 0]} material={mats.dark} castShadow>
            <boxGeometry args={[0.12, 0.44, 0.12]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
