import * as THREE from 'three';
import { CONFIG } from '../constants';

/**
 * Generates a random position within a sphere
 */
export const getRandomSpherePosition = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  
  return [x, y, z];
};

/**
 * Generates a position on a cone surface (The Tree)
 * Uses a spiral algorithm for better distribution
 */
export const getConePosition = (
  index: number, 
  total: number, 
  height: number, 
  baseRadius: number
): [number, number, number] => {
  // Normalized height (0 at bottom, 1 at top)
  // We want more density at the bottom, so we distribute linearly
  const yNorm = index / total; 
  const y = (yNorm - 0.5) * height; // Centered vertically

  // Radius at this height
  // Linear cone: r = baseRadius * (1 - yNorm)
  // We curve it slightly for a fuller look: Math.pow
  const radiusAtHeight = baseRadius * (1 - yNorm);

  // Golden Angle spiral for organic distribution
  const angle = index * 2.39996; // Golden angle in radians (approx 137.5 deg)

  const x = radiusAtHeight * Math.cos(angle);
  const z = radiusAtHeight * Math.sin(angle);

  // Add slight noise to keep it natural
  const noise = 0.2;
  return [
    x + (Math.random() - 0.5) * noise, 
    y, 
    z + (Math.random() - 0.5) * noise
  ];
};