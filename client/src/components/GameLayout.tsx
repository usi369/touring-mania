import React from "react";

interface GameLayoutProps {
  children: React.ReactNode;
  bgClass?: string;
}

/**
 * GameLayout - Provide a fixed aspect ratio stage for the game.
 * Mobile-first focus with scaling for tablets and desktops.
 */
export default function GameLayout({ 
  children, 
  bgClass = "bg-slate-950" 
}: GameLayoutProps) {
  return (
    <div className={`fixed inset-0 w-full h-full overflow-hidden flex items-center justify-center ${bgClass}`}>
      {/* Background decoration or extended area */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        {/* You can add decorative elements here that bleed out of the stage */}
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-cyan-500 rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-pink-500 rounded-full blur-[120px]" />
      </div>

      {/* Main Game Stage - Fixed Aspect Ratio */}
      <div 
        className="relative w-full h-full max-w-[100vh] max-h-[100vw] aspect-[9/16] bg-slate-900 shadow-2xl overflow-hidden flex flex-col"
        style={{
          // For screens wider than 9:16, height will be 100vh and width will scale.
          // For screens taller than 9:16, width will be 100vw and height will scale.
          // Tailwind's aspect ratio and max-w/max-h handle this mostly, but we can refine.
          maxWidth: 'calc(100vh * (9 / 16))',
          maxHeight: '100vh',
        }}
      >
        {children}
      </div>
    </div>
  );
}
