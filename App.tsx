import React, { useState, Suspense } from 'react';
import { Scene } from './components/Scene';
import { UIOverlay } from './components/UIOverlay';
import { TreeMorphState } from './types';
import { GestureController } from './components/GestureController';

function App() {
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.SCATTERED);
  const [rotationVelocity, setRotationVelocity] = useState<number>(0);

  const toggleState = () => {
    setTreeState((prev) => 
      prev === TreeMorphState.SCATTERED 
        ? TreeMorphState.TREE_SHAPE 
        : TreeMorphState.SCATTERED
    );
  };

  return (
    <div className="w-full h-screen bg-[#020202] text-white overflow-hidden relative selection:bg-gold-500 selection:text-black">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<LoadingScreen />}>
          <Scene state={treeState} rotationVelocity={rotationVelocity} />
        </Suspense>
      </div>

      {/* UI Overlay Layer */}
      <UIOverlay state={treeState} onToggle={toggleState} />

      {/* Gesture Control Logic (Hidden but Active) */}
      <GestureController 
        currentState={treeState} 
        onStateChange={setTreeState} 
        onRotationChange={setRotationVelocity}
      />
      
    </div>
  );
}

// Simple Loading Screen
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center w-full h-full bg-[#020202]">
    <div className="w-12 h-12 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin mb-4"></div>
    <div className="text-[#FFD700] font-serif tracking-widest text-sm animate-pulse">LOADING EXPERIENCE</div>
  </div>
);

export default App;