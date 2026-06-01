import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GameButton from "./ui/GameButton";

type SpecType = "horsepower" | "fuelEfficiency" | "seatHeight" | "totalLength" | "weight" | "price" | "year";
type DirectionType = "up" | "down";

interface DeclarationPhaseProps {
  playerName: string;
  onDeclare: (spec: SpecType, direction: DirectionType) => void;
  isLoading?: boolean;
  hand?: any[];
  prevDeclaredSpec?: string | null;
  prevDeclaredDirection?: string | null;
  fieldCards?: any[];
}

const SPEC_OPTIONS: { value: SpecType; label: string; unit: string }[] = [
  { value: "horsepower", label: "馬力", unit: "PS" },
  { value: "fuelEfficiency", label: "燃費", unit: "km/L" },
  { value: "seatHeight", label: "シート高", unit: "mm" },
  { value: "totalLength", label: "全長", unit: "mm" },
  { value: "weight", label: "重量", unit: "kg" },
  { value: "price", label: "価格", unit: "万円" },
  { value: "year", label: "発売年月日", unit: "年" },
];

const SPEC_ITEMS = [
  { key: "horsepower", label: "馬力", unit: "PS" },
  { key: "fuelEfficiency", label: "燃費", unit: "km/L" },
  { key: "seatHeight", label: "シート高", unit: "mm" },
  { key: "totalLength", label: "全長", unit: "mm" },
  { key: "weight", label: "重量", unit: "kg" },
  { key: "price", label: "価格", unit: "万円" },
  { key: "year", label: "発売年月日", unit: "年" },
];

export default function DeclarationPhase({
  playerName,
  onDeclare,
  isLoading = false,
  hand = [],
  prevDeclaredSpec = null,
  prevDeclaredDirection = null,
  fieldCards = [],
}: DeclarationPhaseProps) {
  const [selectedSpec, setSelectedSpec] = useState<SpecType>("horsepower");
  const [selectedDirection, setSelectedDirection] = useState<DirectionType>("up");
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedBike, setExpandedBike] = useState<any | null>(null);

  const isBanned =
    selectedSpec === prevDeclaredSpec && selectedDirection === prevDeclaredDirection;
  const hasBan = prevDeclaredSpec != null && prevDeclaredDirection != null;

  const handleDeclare = () => {
    onDeclare(selectedSpec, selectedDirection);
  };

  const selectedSpecLabel =
    SPEC_OPTIONS.find((s) => s.value === selectedSpec)?.label || "馬力";

  return (
    <>
      {/* ===== Main Stage Overlay ===== */}
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-sm flex flex-col gap-4 bg-slate-900/95 border-2 border-cyan-500/30 p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl relative z-10 overflow-y-auto no-scrollbar"
          style={{ maxHeight: "100%" }}
        >
          {/* Header */}
          <div className="text-center flex-shrink-0 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
              Declaration
            </h2>
            <p className="text-[9px] font-black text-cyan-400 mt-1 uppercase tracking-widest">{playerName}'S CHOICE</p>
          </div>

          {/* Hand List */}
          {hand.length > 0 && (
            <div className="flex-shrink-0 bg-slate-950/40 p-3 rounded-2xl border border-white/5 overflow-hidden">
              <p className="text-[8px] font-black text-slate-500 text-center mb-3 tracking-widest uppercase">
                YOUR HAND ({hand.length})
              </p>
              <div className="flex justify-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {hand.map((bike: any) => (
                  <motion.button
                    key={bike.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setExpandedBike(bike)}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 focus:outline-none"
                  >
                    <div className="w-16 h-16 rounded-xl border border-white/10 bg-slate-900/80 overflow-hidden shadow-lg relative">
                      {bike.photoUrl ? (
                        <img src={bike.photoUrl} alt={bike.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-700">BIKE</div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-5 py-2">
            {hasBan && (
              <div className="px-4 py-2 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                <p className="text-[10px] font-black text-pink-400 uppercase tracking-tighter leading-tight text-center">
                  LOCKOUT: {SPEC_OPTIONS.find((s) => s.value === prevDeclaredSpec)?.label} {prevDeclaredDirection === "up" ? "UP" : "DOWN"} BANNED
                </p>
              </div>
            )}

            {/* Spec Selection */}
            <div className="relative">
              <label className="block text-[9px] font-black text-slate-500 mb-1.5 tracking-widest uppercase">Select Spec</label>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-slate-950/80 border-2 border-slate-800 rounded-2xl px-5 py-3 text-white flex justify-between items-center hover:border-cyan-500/50 transition-all"
              >
                <span className="font-black text-sm uppercase italic">{selectedSpecLabel}</span>
                <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
              </button>
              
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border-2 border-slate-700 rounded-2xl overflow-hidden z-30 shadow-2xl"
                  >
                    {SPEC_OPTIONS.map((spec) => (
                      <button
                        key={spec.value}
                        onClick={() => { setSelectedSpec(spec.value); setShowDropdown(false); }}
                        className="w-full px-5 py-3 text-white font-bold border-b border-slate-700 last:border-0 hover:bg-cyan-600 transition-colors text-xs flex items-center justify-between"
                      >
                        <span className="uppercase italic">{spec.label}</span>
                        <span className="text-[10px] text-cyan-300 font-mono">
                          {spec.unit}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direction Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedDirection("up")}
                className={`py-3 rounded-2xl font-black text-xs uppercase italic transition-all border-2 ${
                  selectedDirection === "up"
                    ? "bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-900/30"
                    : "bg-slate-950/50 border-slate-800 text-slate-600 hover:border-slate-700"
                }`}
              >
                High / Up
              </button>
              <button
                onClick={() => setSelectedDirection("down")}
                className={`py-3 rounded-2xl font-black text-xs uppercase italic transition-all border-2 ${
                  selectedDirection === "down"
                    ? "bg-pink-600 border-pink-400 text-white shadow-lg shadow-pink-900/30"
                    : "bg-slate-950/50 border-slate-800 text-slate-600 hover:border-slate-700"
                }`}
              >
                Low / Down
              </button>
            </div>

            {/* Result Preview */}
            <div className="bg-slate-950/80 border-2 border-white/5 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Rule Strategy</p>
              <p className={`text-base font-black italic uppercase leading-none ${isBanned ? "text-pink-500" : "text-white"}`}>
                {selectedSpecLabel} 
                <span className={`mx-2 text-xl ${selectedDirection === "up" ? "text-cyan-400" : "text-pink-400"}`}>
                  {selectedDirection === "up" ? "↑" : "↓"}
                </span>
                {selectedDirection === "up" ? "HIGHER" : "LOWER"} Wins
              </p>
            </div>

            {/* Action */}
            <GameButton
              onClick={handleDeclare}
              disabled={isLoading || isBanned}
              variant={isBanned ? "secondary" : "primary"}
              className="w-full py-4 text-sm"
            >
              {isLoading ? "SYNCING..." : isBanned ? "RULE BANNED" : "CONFIRM DECLARE"}
            </GameButton>
          </div>
        </motion.div>
      </div>

      {/* ===== Bike Details Modal (Stage-relative) ===== */}
      <AnimatePresence>
        {expandedBike && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border-2 border-cyan-500/40 overflow-hidden shadow-2xl relative bg-slate-950"
            >
              <button
                onClick={() => setExpandedBike(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/80 text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6">
                <div className="h-40 rounded-2xl bg-slate-900 border border-white/5 mb-6 flex items-center justify-center relative overflow-hidden">
                  {expandedBike.photoUrl ? (
                    <img src={expandedBike.photoUrl} alt={expandedBike.name} className="max-w-[85%] max-h-[85%] object-contain" />
                  ) : (
                    <span className="text-[10px] font-black text-slate-800">NO DATA</span>
                  )}
                </div>

                <div className="mb-6">
                  <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">{expandedBike.maker}</p>
                  <h3 className="text-2xl font-black text-white italic uppercase">{expandedBike.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-8">
                  {SPEC_ITEMS.map((spec) => (
                    <div key={spec.key} className="bg-slate-900/60 border border-white/5 rounded-xl p-2.5">
                      <p className="text-[8px] text-slate-500 font-black uppercase">{spec.label}</p>
                      <p className="text-sm font-black text-white italic">
                        {(expandedBike as any)[spec.key] ?? "-"}
                        <span className="text-[8px] ml-1 text-slate-600 not-italic uppercase">{spec.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>

                <GameButton onClick={() => setExpandedBike(null)} variant="secondary" className="w-full py-4">CLOSE DATA</GameButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
