import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls, ContactShadows, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { TopStar } from './TopStar';
import { TreeMorphState } from '../types';
import { CONFIG, COLORS } from '../constants';

interface SceneProps {
  state: TreeMorphState;
  rotationVelocity: number;
}

const RotatingGroup: React.FC<{children: React.ReactNode; state: TreeMorphState; velocity: number}> = ({ children, state, velocity }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    // Base Rotation (Automatic)
    // Rotate faster when scattered, slow and majestic when tree
    const baseSpeed = state === TreeMorphState.TREE_SHAPE ? 0.1 : 0.05;
    
    // Combined Speed: Automatic + Hand Gesture
    // Hand gesture velocity dominates if present
    const finalSpeed = baseSpeed + velocity;
    
    groupRef.current.rotation.y += delta * finalSpeed;
  });

  return <group ref={groupRef}>{children}</group>;
};

export const Scene: React.FC<SceneProps> = ({ state, rotationVelocity }) => {
  return (
    <Canvas
      dpr={[1, 2]} // Handle high DPI screens
      gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
      shadows
    >
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={50} />
      
      {/* Lighting Setup for Gold & Emerald */}
      <ambientLight intensity={0.2} color={COLORS.EMERALD_DEEP} />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        color={COLORS.WHITE_WARM} 
        castShadow 
        shadow-bias={-0.0001}
      />
      <pointLight position={[-10, -10, -10]} intensity={1} color={COLORS.GOLD_METALLIC} />
      {/* Backlight for silhouette */}
      <pointLight position={[0, 5, -10]} intensity={2} color={COLORS.EMERALD_LIGHT} distance={20} />

      {/* Environment for Reflections */}
      <Environment preset="city" />

      {/* The Christmas Tree Group */}
      <RotatingGroup state={state} velocity={rotationVelocity}>
        <Foliage state={state} />
        <Ornaments type="box" count={CONFIG.ORNAMENT_COUNT_BOXES} state={state} />
        <Ornaments type="sphere" count={CONFIG.ORNAMENT_COUNT_BAUBLES} state={state} />
        <TopStar state={state} />
      </RotatingGroup>

      {/* Background Ambience */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Floor Shadows */}
      <ContactShadows 
        opacity={0.6} 
        scale={40} 
        blur={2} 
        far={10} 
        resolution={256} 
        color="#000000" 
        position={[0, -CONFIG.TREE_HEIGHT/2 - 2, 0]}
      />

      {/* Cinematic Post Processing */}
      <EffectComposer disableNormalPass>
        {/* Luxurious Bloom */}
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.6} 
        />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
        <Noise opacity={0.02} /> 
      </EffectComposer>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={40}
        enableZoom={true}
      />
    </Canvas>
  );
};