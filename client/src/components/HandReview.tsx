import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Activity, Terminal, Database, Sparkles } from "lucide-react";
import BikeCard from "./BikeCard";
import GameButton from "./ui/GameButton";

interface HandReviewProps {
  hand: any[];
  playerNumber: number;
  onConfirm: () => void;
}

const SPEC_ITEMS = [
  { key: "horsepower", label: "HP", unit: "PS" },
  { key: "fuelEfficiency", label: "FE", unit: "km/L" },
  { key: "price", label: "PRC", unit: "万円" },
  { key: "weight", label: "WGT", unit: "kg" },
];

/**
 * HandReview - Tactical Briefing Screen.
 * Logical design: Strategic Stillness. Calm before the storm.
 */
export default function HandReview({ hand, onConfirm }: HandReviewProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const selectedBike = hand[selectedIdx];

  const handleConfirm = () => {
    if (isConfirming) return;
    setIsConfirming(true);
    onConfirm();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col p-6 bg-[#020617] font-mono select-none overflow-hidden">
      
      {/* 1. Briefing Header */}
      <div className="shrink-0 mb-8 flex justify-between items-end border-b border-white/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
            <span className="text-[10px] font-black text-cyan-400 tracking-[0.3em] uppercase">Tactical Briefing</span>
          </div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter italic">Analyzing <span className="text-slate-500">Hand</span></h1>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Total Assets</p>
          <p className="text-lg font-black text-white italic leading-none">{hand.length}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 gap-6">
        
        {/* 2. Main Inspection Area (The Focused Bike) */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Diagnostic Grid Background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.2)_0%,transparent_70%)] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedBike.id}
              initial={{ scale: 0.9, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 1.1, opacity: 0, x: -20 }}
              className="relative"
            >
              {/* Scanline overlay for focus */}
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-2xl opacity-20">
                <div className="w-full h-full bg-[linear-gradient(transparent_50%,#000_50%)] bg-[size:100%_4px] animate-scan" />
              </div>
              <BikeCard bike={selectedBike} size="medium" isPokerRatio={true} />
            </motion.div>
          </AnimatePresence>

          {/* Asset Selection Dots */}
          <div className="mt-6 flex gap-1.5 overflow-x-auto no-scrollbar max-w-full px-4">
            {hand.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`flex-shrink-0 w-8 h-1 rounded-full transition-all ${selectedIdx === idx ? 'bg-cyan-500 shadow-[0_0_8px_cyan]' : 'bg-slate-800'}`}
              />
            ))}
          </div>
        </div>

        {/* 3. Asset Intelligence Panel (Details) */}
        <div className="shrink-0 bg-slate-900/60 border-2 border-white/5 rounded-3xl p-5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/40" />
          <div className="mb-4 flex justify-between items-start">
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Asset Model</p>
              <h3 className="text-base font-black text-white uppercase italic leading-none">{selectedBike.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
              <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[8px] font-black border border-green-500/20 uppercase tracking-tighter">Synchronized</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-1">
            {SPEC_ITEMS.map(spec => (
              <div key={spec.key} className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 flex justify-between items-center">
                <span className="text-[8px] font-black text-slate-600 uppercase">{spec.label}</span>
                <p className="text-xs font-black text-slate-300 italic">
                  {selectedBike[spec.key] ?? "--"}
                  <span className="text-[7px] ml-0.5 text-slate-600 not-italic">{spec.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Action Area */}
      <div className="shrink-0 pt-8 pb-4">
        <GameButton
          onClick={handleConfirm}
          disabled={isConfirming}
          className="w-full py-5 text-sm"
        >
          {isConfirming ? "TRANSMITTING..." : "FINALIZE BRIEFING"}
        </GameButton>
        <p className="text-[8px] text-slate-600 font-bold uppercase text-center mt-4 tracking-widest opacity-40">
          Confirm hand assets to begin synchronization protocol.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
      `}} />
    </div>
  );
}
