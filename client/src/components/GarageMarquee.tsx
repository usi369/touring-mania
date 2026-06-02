import { motion } from "framer-motion";
import { Camera, Radio, Database, ShieldCheck } from "lucide-react";

interface GarageMarqueeProps {
  bikes?: any[];
}

/**
 * GarageMarquee - Asset Surveillance Stream.
 * Logical design: Functional Storytelling. The garage is being monitored.
 */
export default function GarageMarquee({}: GarageMarqueeProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 110, opacity: 1 }}
      className="w-full bg-[#020617] border-y-2 border-white/5 relative overflow-hidden flex flex-col items-center justify-center font-mono shadow-inner"
    >
      {/* 1. Background Visuals (Grid & CRT) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-[0.03]" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 z-10" />
      </div>

      {/* 2. Scanning Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,#000_50%)] bg-[size:100%_4px] opacity-[0.05]" />
        <motion.div 
          animate={{ x: ["-100%", "200%"] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent skew-x-12" 
        />
      </div>

      {/* 3. Status Display Area */}
      <div className="relative z-30 w-full px-8 flex justify-between items-center">
        {/* Left: Feed Identity */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Camera className="w-3 h-3 text-pink-500 animate-pulse" />
            <span className="text-[9px] font-black text-white italic tracking-[0.2em] uppercase">CAM_SEC_01</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-2.5 h-2.5 text-slate-700" />
            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Signal // Encrypted</span>
          </div>
        </div>

        {/* Center: Live Data (Marquee replacement) */}
        <div className="flex flex-col items-center gap-1">
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }} 
            transition={{ duration: 2, repeat: Infinity }}
            className="px-3 py-1 rounded-full bg-cyan-600/10 border border-cyan-400/30"
          >
            <span className="text-[10px] font-black text-cyan-400 tracking-[0.3em] uppercase italic">Surveillance Active</span>
          </motion.div>
          <div className="flex items-center gap-4 text-[7px] text-slate-600 font-bold uppercase">
            <span className="flex items-center gap-1"><Database className="w-2 h-2" /> Asset_Registry_Ready</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-2 h-2 text-green-700" /> Shutter_Sync_OK</span>
          </div>
        </div>

        {/* Right: Telemetry */}
        <div className="text-right space-y-1">
          <p className="text-[8px] text-slate-600 font-black uppercase">Telemetry</p>
          <p className="text-[10px] font-black text-white italic leading-none tabular-nums">40.71°N / 74.01°E</p>
          <div className="h-0.5 w-16 bg-slate-900 rounded-full ml-auto overflow-hidden">
             <motion.div animate={{ scaleX: [1, 0.4, 0.8, 1] }} transition={{ duration: 3, repeat: Infinity }} className="h-full w-full bg-pink-500/40 origin-right" />
          </div>
        </div>
      </div>

      {/* Decorative Corners */}
      <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-white/20" />
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-white/20" />
    </motion.div>
  );
}
