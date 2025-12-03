import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG, COLORS, DUMMY_OBJ } from '../constants';
import { TreeMorphState, InstanceData } from '../types';
import { getConePosition, getRandomSpherePosition } from '../utils/math';

interface OrnamentsProps {
  type: 'box' | 'sphere';
  count: number;
  state: TreeMorphState;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ type, count, state }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // Data generation
  const data = useMemo(() => {
    const instances: InstanceData[] = [];
    for (let i = 0; i < count; i++) {
      // Tree placement
      const radiusOffset = type === 'box' ? 1.0 : 1.15;
      const [tx, ty, tz] = getConePosition(i, count, CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS * radiusOffset);
      
      // Scatter placement
      const [sx, sy, sz] = getRandomSpherePosition(CONFIG.SCATTER_RADIUS * 0.8);

      let scale = Math.random() * 0.3 + 0.2;

      // Color Palette Selection
      let color;
      if (type === 'box') {
        const boxColors = [
          COLORS.RED_VELVET, 
          COLORS.RED_BRIGHT,
          COLORS.GREEN_CHRISTMAS, 
          COLORS.WHITE_SNOW, 
          COLORS.BLACK_OBSIDIAN,
          COLORS.GOLD_METALLIC
        ];
        // Weighted random
        const r = Math.random();
        if (r > 0.5) {
            // High chance for Red
            color = Math.random() > 0.5 ? COLORS.RED_VELVET : COLORS.RED_BRIGHT;
            // MAKE RED BOXES BIGGER AND BOLDER
            scale *= 1.5; 
        } else {
            color = boxColors[Math.floor(Math.random() * boxColors.length)];
        }
      } else {
        // Spheres: Red, Gold, and White
        const sphereColors = [
          COLORS.GOLD_METALLIC, 
          COLORS.GOLD_METALLIC, 
          COLORS.RED_BRIGHT,
          COLORS.RED_VELVET,
          COLORS.WHITE_SNOW // White shouldn't flash later
        ];
        color = sphereColors[Math.floor(Math.random() * sphereColors.length)];
      }

      instances.push({
        treePosition: [tx, ty, tz],
        scatterPosition: [sx, sy, sz],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
        scale,
        color
      });
    }
    return instances;
  }, [count, type]);

  // Apply colors once
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    if (!meshRef.current.instanceColor) {
      meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    }
    const tempColor = new THREE.Color();
    data.forEach((d, i) => {
      tempColor.set(d.color);
      meshRef.current!.setColorAt(i, tempColor);
    });
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [data, count]);

  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;

    // Update Uniforms
    if (type === 'sphere' && materialRef.current && materialRef.current.userData.shader) {
        materialRef.current.userData.shader.uniforms.uTime.value = stateThree.clock.elapsedTime;
    }

    // Morphing Logic
    const targetFactor = state === TreeMorphState.TREE_SHAPE ? 1 : 0;
    if (meshRef.current.userData.morphFactor === undefined) meshRef.current.userData.morphFactor = 0;
    
    const currentFactor = meshRef.current.userData.morphFactor;
    // Slower, heavier feel for boxes
    const speed = delta * (type === 'box' ? 0.6 : 0.8);
    const newFactor = THREE.MathUtils.lerp(currentFactor, targetFactor, speed);
    meshRef.current.userData.morphFactor = newFactor;

    const t = newFactor;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const time = stateThree.clock.elapsedTime;

    data.forEach((d, i) => {
      const { treePosition, scatterPosition, rotation, scale } = d;

      // Luxurious Scatter Motion:
      // Instead of just lerping, add a rotational orbit when ease is low (scattered)
      let sx = scatterPosition[0];
      let sy = scatterPosition[1];
      let sz = scatterPosition[2];

      if (ease < 0.9) {
          // Galaxy spiral effect
          const dist = Math.sqrt(sx*sx + sz*sz);
          const angleOffset = dist * 0.1;
          const orbitSpeed = 0.1;
          const currentAngle = Math.atan2(sz, sx) + time * orbitSpeed + angleOffset;
          
          sx = Math.cos(currentAngle) * dist;
          sz = Math.sin(currentAngle) * dist;
          // Bobbing
          sy += Math.sin(time * 0.5 + i) * 1.0; 
      }

      // Position Mix
      const x = THREE.MathUtils.lerp(sx, treePosition[0], ease);
      const y = THREE.MathUtils.lerp(sy, treePosition[1], ease);
      const z = THREE.MathUtils.lerp(sz, treePosition[2], ease);

      // Rotation
      // Spin red boxes slightly more to catch light
      const idleRot = time * 0.2;
      const rotX = rotation[0] + (1 - ease) * time * 0.3 + idleRot;
      const rotY = rotation[1] + (1 - ease) * time * 0.1 + idleRot;
      
      DUMMY_OBJ.position.set(x, y, z);
      DUMMY_OBJ.rotation.set(rotX, rotY, rotation[2]);
      DUMMY_OBJ.scale.setScalar(scale);
      
      DUMMY_OBJ.updateMatrix();
      meshRef.current!.setMatrixAt(i, DUMMY_OBJ.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Shader for Spheres (Twinkling)
  const onBeforeCompile = useMemo(() => (shader: THREE.Shader) => {
    shader.uniforms.uTime = { value: 0 };
    if (materialRef.current) materialRef.current.userData.shader = shader;

    shader.fragmentShader = `uniform float uTime;\n` + shader.fragmentShader;

    // Replace emissive logic
    // Logic: 
    // 1. Calculate brightness/whiteness of the color.
    // 2. If it's very white (RGB all high), disable flashing (keep steady).
    // 3. Else, animate.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `
      #include <emissivemap_fragment>
      
      float flashSpeed = 3.0;
      float seed = vColor.r * 10.0 + vColor.g * 5.0 + vColor.b * 2.0; 
      
      // Determine if color is "white" (or close to it)
      // If R, G, B are all > 0.8, it's white/pale
      bool isWhite = (vColor.r > 0.8 && vColor.g > 0.8 && vColor.b > 0.8);
      
      float twinkle = 1.0;
      
      if (!isWhite) {
          // Flashing pattern for Gold/Red
          float wave = sin(uTime * flashSpeed + seed);
          twinkle = wave * 0.5 + 0.5; // 0 to 1
          twinkle = pow(twinkle, 4.0); // Spiky flash
          twinkle = twinkle * 1.5 + 0.5; // Base brightness + flash
      } else {
          // Steady glow for white pearls
          twinkle = 0.8; 
      }
      
      totalEmissiveRadiance += vColor * twinkle;
      `
    );
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      {type === 'box' ? (
        <boxGeometry args={[0.8, 0.8, 0.8]} />
      ) : (
        <sphereGeometry args={[0.5, 32, 32]} />
      )}
      
      {type === 'box' ? (
        <meshStandardMaterial 
          roughness={0.2} // Shinier boxes
          metalness={0.6} 
          envMapIntensity={2.0}
        />
      ) : (
        <meshStandardMaterial 
            ref={materialRef}
            roughness={0.1}
            metalness={0.9}
            emissive="#FFFFFF" // Base emissive color, modulated by vColor in shader
            emissiveIntensity={0.1} 
            onBeforeCompile={onBeforeCompile}
            envMapIntensity={2.5}
            toneMapped={false} 
        />
      )}
    </instancedMesh>
  );
};