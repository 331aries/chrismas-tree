import React from 'react';
import { TreeMorphState } from '../types';

interface UIOverlayProps {
  state: TreeMorphState;
  onToggle: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ state, onToggle }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      
      {/* Header */}
      <header className="flex flex-col items-center mt-8 opacity-95">
        <div className="font-serif text-[#FFD700] text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
            <h1 className="text-2xl md:text-4xl italic font-light tracking-wide mb-2 text-[#F5F5F5]">
                Best Wish for Christmas
            </h1>
            <div className="flex items-center justify-center gap-4">
                <div className="h-[1px] w-8 md:w-16 bg-[#FFD700]"></div>
                <h2 className="text-xl md:text-3xl font-bold uppercase tracking-[0.2em] text-[#FFD700]">
                    from Miss Wu
                </h2>
                <div className="h-[1px] w-8 md:w-16 bg-[#FFD700]"></div>
            </div>
        </div>
      </header>
      
      {/* Gesture Hint */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 hidden md:flex flex-col gap-4 opacity-60 text-[#FFD700] font-serif text-xs tracking-widest">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 border border-[#FFD700] rounded-full flex items-center justify-center">✋</div>
            <span>OPEN PALM TO SCATTER</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 border border-[#FFD700] rounded-full flex items-center justify-center">✊</div>
            <span>FIST TO ASSEMBLE</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 border border-[#FFD700] rounded-full flex items-center justify-center">↔</div>
            <span>MOVE HAND TO ROTATE</span>
        </div>
      </div>

      {/* Footer / Controls */}
      <footer className="pointer-events-auto flex flex-col items-center gap-6 mb-8">
        <button
          onClick={onToggle}
          className={`
            group relative px-8 py-4 bg-black/40 backdrop-blur-md 
            border border-[#FFD700]/50 hover:border-[#FFD700] 
            transition-all duration-500 ease-out
            overflow-hidden rounded-sm
          `}
        >
          {/* Button Hover Fill Effect */}
          <div className="absolute inset-0 bg-[#FFD700] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
          
          <span className="relative z-10 font-serif text-[#FFD700] group-hover:text-black tracking-[0.15em] uppercase text-sm font-bold transition-colors duration-500">
            {state === TreeMorphState.TREE_SHAPE ? 'Scatter Elements' : 'Assemble Tree'}
          </span>
        </button>
        
        <div className="text-[#005533] text-[10px] tracking-widest opacity-60">
          DESIGNED FOR REACT 18 + THREE FIBER
        </div>
      </footer>
    </div>
  );
};