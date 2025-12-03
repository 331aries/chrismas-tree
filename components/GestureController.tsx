import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { TreeMorphState } from '../types';

interface GestureControllerProps {
  onStateChange: (state: TreeMorphState) => void;
  onRotationChange: (velocity: number) => void;
  currentState: TreeMorphState;
}

export const GestureController: React.FC<GestureControllerProps> = ({ 
  onStateChange, 
  onRotationChange,
  currentState 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const lastStateChange = useRef<number>(0);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startCamera();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    const startCamera = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, facingMode: "user" } 
        });
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
        setLoaded(true);
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };

    const predictWebcam = () => {
      if (!videoRef.current || !handLandmarkerRef.current) return;
      
      const startTimeMs = performance.now();
      if (videoRef.current.videoWidth > 0) {
        const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // 1. GESTURE RECOGNITION (Fist vs Open)
          detectGesture(landmarks);
          
          // 2. ROTATION CONTROL (Hand X Position)
          detectRotation(landmarks);
        } else {
            // No hand detected, slow down rotation to 0
            onRotationChange(0);
        }
      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    const detectGesture = (landmarks: any[]) => {
      const now = Date.now();
      // Debounce state changes (1 second cooldown)
      if (now - lastStateChange.current < 1000) return;

      // Wrist is index 0
      const wrist = landmarks[0];
      // Middle finger knuckle (MCP) is index 9
      const middleMCP = landmarks[9];
      
      // Calculate palm scale (distance from wrist to middle knuckle)
      const palmScale = Math.sqrt(
        Math.pow(wrist.x - middleMCP.x, 2) + 
        Math.pow(wrist.y - middleMCP.y, 2)
      );

      // Fingertips: Index(8), Middle(12), Ring(16), Pinky(20)
      const tips = [8, 12, 16, 20];
      let avgTipDistance = 0;

      tips.forEach(idx => {
        const tip = landmarks[idx];
        const dist = Math.sqrt(
          Math.pow(tip.x - wrist.x, 2) + 
          Math.pow(tip.y - wrist.y, 2)
        );
        avgTipDistance += dist;
      });
      avgTipDistance /= 4;

      // Ratio: How far are tips compared to palm size?
      // Fist: Tips are close to palm/wrist. Ratio ~ 0.5 - 0.8
      // Open: Tips are far. Ratio > 1.2
      const extensionRatio = avgTipDistance / palmScale;

      if (extensionRatio < 0.9) {
        // FIST -> TREE
        if (currentState !== TreeMorphState.TREE_SHAPE) {
            onStateChange(TreeMorphState.TREE_SHAPE);
            lastStateChange.current = now;
        }
      } else if (extensionRatio > 1.3) {
        // OPEN -> SCATTER
        if (currentState !== TreeMorphState.SCATTERED) {
            onStateChange(TreeMorphState.SCATTERED);
            lastStateChange.current = now;
        }
      }
    };

    const detectRotation = (landmarks: any[]) => {
      // Use wrist x position
      // MediaPipe X: 0 (left) to 1 (right)
      const x = landmarks[0].x;
      
      // We want center (0.5) to be 0 speed.
      // Left (< 0.5) -> Negative rotation
      // Right (> 0.5) -> Positive rotation
      // Invert X because camera is usually mirrored for user interaction
      // Actually, if I move hand right, I expect scene to rotate right (or left depending on metaphor).
      // Let's assume standard "Grab and Spin" metaphor or Joystick.
      // 1.0 (Right side of frame) -> Rotate +
      // 0.0 (Left side of frame) -> Rotate -
      
      // Since video is CSS transformed scaleX(-1) to look like a mirror:
      // Real X 0 is Left. Mirrored X 1 is Left.
      // Let's stick to raw coordinate.
      // Raw 0 (Left of camera) -> User sees it on Right of screen (if mirrored).
      // Let's just Map (0.5 - x).
      
      const deadZone = 0.1;
      let velocity = 0;
      
      // Center is 0.5
      const diff = 0.5 - x; // Range -0.5 to 0.5
      
      if (Math.abs(diff) > deadZone) {
         velocity = diff * 3.0; // Multiplier for speed
      }
      
      onRotationChange(velocity);
    };

    setupMediaPipe();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentState, onStateChange, onRotationChange]);

  return (
    <video 
      ref={videoRef} 
      autoPlay 
      playsInline
      className="camera-feed"
      muted
    />
  );
};