import * as THREE from 'three';

export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface DualPosition {
  x: number;
  y: number;
  z: number;
}

export interface InstanceData {
  scatterPosition: [number, number, number];
  treePosition: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
}

export interface Uniforms {
  [uniform: string]: THREE.IUniform<any>;
}