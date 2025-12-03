import * as THREE from 'three';

// Aesthetic Palette
export const COLORS = {
  EMERALD_DEEP: '#002816',
  EMERALD_LIGHT: '#006B3C',
  GOLD_METALLIC: '#FFD700',
  GOLD_ROSE: '#E0BFB8',
  WHITE_WARM: '#FFFDD0',
  BG_DARK: '#020202',
  
  // New Festive Colors
  RED_VELVET: '#8A0303',
  RED_BRIGHT: '#D42424',
  WHITE_SNOW: '#F5F5F5',
  BLACK_OBSIDIAN: '#1A1A1A',
  GREEN_CHRISTMAS: '#0B4F28'
};

// Configuration
export const CONFIG = {
  PARTICLE_COUNT: 12000,
  ORNAMENT_COUNT_BOXES: 200, // Increased slightly for better density
  ORNAMENT_COUNT_BAUBLES: 300,
  TREE_HEIGHT: 12,
  TREE_RADIUS: 4.5,
  SCATTER_RADIUS: 25,
  MORPH_SPEED: 1.5, // Seconds
};

// Reusable vector objects to avoid GC
export const VEC3_ZERO = new THREE.Vector3(0, 0, 0);
export const DUMMY_OBJ = new THREE.Object3D();