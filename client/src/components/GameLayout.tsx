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
    <div className={`fixed inset-0 w-full h-full overflow-hidden flex items-center justify-center ${bgClass} select-none`}>
      {/* --- Global Juice Layer (Background) --- */}
      <div className="absolute inset-0 z-0">
        {/* Dynamic Background Orbs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-cyan-500 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-pink-500 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[150px]" />
        </div>
        
        {/* Deep Space Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10" />
      </div>

      {/* --- Main Game Stage --- */}
      <div 
        className="relative w-full h-full max-w-[100vh] max-h-[100vw] aspect-[9/16] bg-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col z-10 border-x border-white/5"
        style={{
          maxWidth: 'calc(100vh * (9 / 16))',
          maxHeight: '100vh',
        }}
      >
        {children}

        {/* --- Global Juice Layer (Overlay on Stage) --- */}
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden mix-blend-overlay opacity-[0.15]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%]" />
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none z-[51] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
        
        {/* Top Glitch Line (Optional subtle detail) */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/20 z-50 animate-scan" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(1000%); opacity: 0; }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
      `}} />
    </div>
  );
}
