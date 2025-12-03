import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG, COLORS } from '../constants';
import { TreeMorphState } from '../types';
import { getRandomSpherePosition } from '../utils/math';

interface TopStarProps {
  state: TreeMorphState;
}

export const TopStar: React.FC<TopStarProps> = ({ state }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const positions = useMemo(() => {
    return {
      tree: new THREE.Vector3(0, CONFIG.TREE_HEIGHT / 2 + 0.8, 0),
      scatter: new THREE.Vector3(...getRandomSpherePosition(CONFIG.SCATTER_RADIUS))
    };
  }, []);

  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 0.8; 
    const innerRadius = 0.35;
    const points = 5;
    
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2;
      // -PI/2 aligns top point with Y if we lay it flat, but we will extrude Z
      const x = r * Math.cos(angle - Math.PI / 2);
      const y = r * Math.sin(angle - Math.PI / 2);
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.25,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    });
  }, []);

  useMemo(() => starGeometry.center(), [starGeometry]);

  useFrame((stateThree, delta) => {
    if (!groupRef.current) return;

    const targetFactor = state === TreeMorphState.TREE_SHAPE ? 1 : 0;
    if (groupRef.current.userData.morphFactor === undefined) groupRef.current.userData.morphFactor = 0;
    
    const speed = delta * 1.0;
    const current = groupRef.current.userData.morphFactor;
    const next = THREE.MathUtils.lerp(current, targetFactor, speed);
    groupRef.current.userData.morphFactor = next;
    
    const t = next;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Position
    groupRef.current.position.lerpVectors(positions.scatter, positions.tree, ease);

    // Scale
    const targetScale = THREE.MathUtils.lerp(0.5, 1.2, ease); 
    groupRef.current.scale.setScalar(targetScale);

    // Rotation
    const time = stateThree.clock.elapsedTime;
    // Rotate around Y to show off the 3D shape
    groupRef.current.rotation.y = time * 0.8; 
    
    // Bobbing
    groupRef.current.position.y += Math.sin(time * 1.5) * 0.005;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={starGeometry} castShadow receiveShadow>
         {/* Vertical light source glow */}
        <meshStandardMaterial 
          color={COLORS.GOLD_METALLIC} 
          emissive={COLORS.GOLD_METALLIC}
          emissiveIntensity={2.0} // Strong steady glow
          roughness={0.1}
          metalness={1.0}
          toneMapped={false}
        />
      </mesh>
      {/* Halo Light */}
      <pointLight color="#FFD700" intensity={5} distance={8} decay={2} />
    </group>
  );
};