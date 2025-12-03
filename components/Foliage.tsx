import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONFIG, COLORS } from '../constants';
import { getConePosition, getRandomSpherePosition } from '../utils/math';
import { TreeMorphState } from '../types';

const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uMorphFactor: { value: 0 },
    uColorA: { value: new THREE.Color(COLORS.EMERALD_DEEP) },
    uColorB: { value: new THREE.Color(COLORS.EMERALD_LIGHT) },
    uColorGold: { value: new THREE.Color(COLORS.GOLD_METALLIC) },
    uPixelRatio: { value: 1 }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uMorphFactor;
    uniform float uPixelRatio;
    
    attribute vec3 aPositionScatter;
    attribute vec3 aPositionTree;
    attribute float aRandom;
    attribute float aSize;
    
    varying float vAlpha;
    varying vec3 vColor;
    varying float vRandom;

    float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
    }

    // Simple noise
    float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vRandom = aRandom;
      
      float t = easeInOutCubic(uMorphFactor);
      
      // Calculate Tree Position with subtle wind
      vec3 posTree = aPositionTree;
      float treeWind = sin(uTime * 1.0 + posTree.y * 0.5) * 0.05;
      posTree.x += treeWind;
      posTree.z += treeWind * 0.5;

      // Calculate Scatter Position with luxurious flow
      vec3 posScatter = aPositionScatter;
      // Galaxy swirl logic in shader
      float dist = length(posScatter.xz);
      float angle = atan(posScatter.z, posScatter.x);
      // Rotate based on distance and time
      float spiral = angle + uTime * 0.1 + (dist * 0.05);
      posScatter.x = cos(spiral) * dist;
      posScatter.z = sin(spiral) * dist;
      // Gentle vertical wave
      posScatter.y += sin(uTime * 0.5 + posScatter.x * 0.2) * 2.0;

      // Mix
      vec3 pos = mix(posScatter, posTree, t);
      
      // Extra sparkle shake
      if (t < 0.9) {
         pos.x += sin(uTime * 5.0 + aRandom * 10.0) * 0.05;
         pos.y += cos(uTime * 3.0 + aRandom * 10.0) * 0.05;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      gl_PointSize = (aSize * uPixelRatio * 90.0) / -mvPosition.z;
      
      vAlpha = mix(0.5, 0.95, t);
    }
  `,
  fragmentShader: `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorGold;
    
    varying float vAlpha;
    varying vec3 vColor;
    varying float vRandom;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 1.5);
      
      vec3 finalColor = mix(uColorA, uColorB, vRandom);
      // Add more gold tips
      if (vRandom > 0.85) {
        finalColor = mix(finalColor, uColorGold, 0.9);
      }
      
      gl_FragColor = vec4(finalColor, vAlpha * strength);
    }
  `
};

interface FoliageProps {
  state: TreeMorphState;
}

export const Foliage: React.FC<FoliageProps> = ({ state }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const count = CONFIG.PARTICLE_COUNT;

  const { positionsTree, positionsScatter, randoms, sizes } = useMemo(() => {
    const pTree = new Float32Array(count * 3);
    const pScatter = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const [tx, ty, tz] = getConePosition(i, count, CONFIG.TREE_HEIGHT, CONFIG.TREE_RADIUS);
      pTree[i * 3] = tx;
      pTree[i * 3 + 1] = ty;
      pTree[i * 3 + 2] = tz;

      const [sx, sy, szPos] = getRandomSpherePosition(CONFIG.SCATTER_RADIUS);
      pScatter[i * 3] = sx;
      pScatter[i * 3 + 1] = sy;
      pScatter[i * 3 + 2] = szPos;

      rnd[i] = Math.random();
      sz[i] = Math.random() * 0.8 + 0.5;
    }

    return {
      positionsTree: pTree,
      positionsScatter: pScatter,
      randoms: rnd,
      sizes: sz
    };
  }, [count]);

  const shaderArgs = useMemo(() => [FoliageShaderMaterial], []);

  useFrame((stateThree, delta) => {
    if (!shaderRef.current) return;
    shaderRef.current.uniforms.uTime.value += delta;
    shaderRef.current.uniforms.uPixelRatio.value = stateThree.viewport.dpr;

    const targetMorph = state === TreeMorphState.TREE_SHAPE ? 1 : 0;
    const current = shaderRef.current.uniforms.uMorphFactor.value;
    const speed = delta * (1.0 / (CONFIG.MORPH_SPEED / 3)); 
    
    shaderRef.current.uniforms.uMorphFactor.value = THREE.MathUtils.lerp(current, targetMorph, speed);
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positionsTree} itemSize={3} />
        <bufferAttribute attach="attributes-aPositionTree" count={count} array={positionsTree} itemSize={3} />
        <bufferAttribute attach="attributes-aPositionScatter" count={count} array={positionsScatter} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        args={shaderArgs}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};