import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import BikeCard from "./BikeCard";

type SpecType = "horsepower" | "fuelEfficiency" | "seatHeight" | "totalLength" | "weight" | "price" | "year";
type DirectionType = "up" | "down";

interface DeclarationPhaseProps {
  playerName: string;
  onDeclare: (spec: SpecType, direction: DirectionType) => void;
  isLoading?: boolean;
  hand?: any[];
  prevDeclaredSpec?: string | null;
  prevDeclaredDirection?: string | null;
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

export default function DeclarationPhase({
  playerName,
  onDeclare,
  isLoading = false,
  hand = [],
  prevDeclaredSpec = null,
  prevDeclaredDirection = null,
}: DeclarationPhaseProps) {
  const [selectedSpec, setSelectedSpec] = useState<SpecType>("horsepower");
  const [selectedDirection, setSelectedDirection] = useState<DirectionType>("up");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showHand, setShowHand] = useState(true);

  // Check if current selection matches the banned previous declaration
  const isBanned = selectedSpec === prevDeclaredSpec && selectedDirection === prevDeclaredDirection;
  const hasBan = prevDeclaredSpec != null && prevDeclaredDirection != null;

  const handleDeclare = () => {
    onDeclare(selectedSpec, selectedDirection);
  };

  const selectedSpecLabel =
    SPEC_OPTIONS.find((s) => s.value === selectedSpec)?.label || "馬力";

  // Get the spec value from a bike for highlighting
  const getSpecValue = (bike: any, spec: SpecType): string | number => {
    switch (spec) {
      case "horsepower": return bike.horsepower ?? "-";
      case "fuelEfficiency": return bike.fuelEfficiency ?? "-";
      case "seatHeight": return bike.seatHeight ?? "-";
      case "totalLength": return bike.totalLength ?? "-";
      case "weight": return bike.weight ?? "-";
      case "price": return bike.price ?? "-";
      case "year": return bike.year ?? "-";
      default: return "-";
    }
  };

  const getSpecUnit = (spec: SpecType): string => {
    return SPEC_OPTIONS.find((s) => s.value === spec)?.unit || "";
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 flex flex-col items-center z-50 overflow-y-auto py-6 sm:py-12">
      <div className="w-full max-w-4xl mx-auto px-4 my-auto flex flex-col animate-in fade-in zoom-in duration-300">
        
        <Card className="bg-slate-900/95 border-cyan-500/50 w-full p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-white tracking-wider mb-2">宣言フェーズ</h2>
            <p className="text-sm font-bold text-cyan-400">{playerName}の宣言</p>
          </div>

          {/* Hand Display */}
          {hand.length > 0 && (
            <div className="w-full mb-8 bg-slate-950/50 rounded-2xl p-4 border border-white/5 shadow-inner">
              <p className="text-sm font-bold text-white/60 text-center mb-4">
                あなたの手札（{hand.length}枚）
              </p>
              <div className="flex justify-start md:justify-center gap-3 sm:gap-4 overflow-x-auto pb-4 pt-2 px-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {hand.map((bike: any) => (
                  <div key={bike.id} className="flex-shrink-0 transition-transform hover:-translate-y-2 duration-300">
                    <div className="shadow-[0_10px_20px_rgba(0,0,0,0.5)] rounded-2xl">
                      <BikeCard bike={bike} size="medium" showDetails={true} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Declaration Form Container */}
          <div className="max-w-xl mx-auto w-full bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
            {/* Spec Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                スペックを選択
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-xl p-4 text-white flex justify-between items-center hover:border-cyan-500 hover:bg-slate-800 transition-all shadow-sm"
                >
                  <span className="font-bold text-lg">{selectedSpecLabel}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-cyan-400 transition-transform ${
                      showDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl overflow-hidden z-20 shadow-2xl">
                    {SPEC_OPTIONS.map((spec) => (
                      <button
                        key={spec.value}
                        onClick={() => {
                          setSelectedSpec(spec.value);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-white font-bold border-b border-slate-700/50 hover:bg-cyan-900/30 hover:text-cyan-300 transition-colors last:border-0"
                      >
                        {spec.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Direction Selection */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                方向を選択
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedDirection("up")}
                  className={`py-4 px-4 rounded-xl font-black text-lg transition-all shadow-sm ${
                    selectedDirection === "up"
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-[1.02]"
                      : "bg-slate-900/80 text-slate-400 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800"
                  }`}
                >
                  ↑ 大きい
                </button>
                <button
                  onClick={() => setSelectedDirection("down")}
                  className={`py-4 px-4 rounded-xl font-black text-lg transition-all shadow-sm ${
                    selectedDirection === "down"
                      ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] scale-[1.02]"
                      : "bg-slate-900/80 text-slate-400 border border-slate-700 hover:border-pink-500/50 hover:bg-slate-800"
                  }`}
                >
                  ↓ 小さい
                </button>
              </div>
            </div>

            {/* Banned declaration warning */}
            {hasBan && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl shadow-inner">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-amber-500">⚠️</div>
                  <p className="text-sm font-bold text-amber-400 leading-relaxed">
                    前回の宣言「{SPEC_OPTIONS.find(s => s.value === prevDeclaredSpec)?.label ?? prevDeclaredSpec}
                    {prevDeclaredDirection === 'up' ? ' ↑大きい' : ' ↓小さい'}」と同じ組み合わせは選べません
                  </p>
                </div>
              </div>
            )}

            {/* Preview */}
            <div className={`mb-8 p-5 rounded-xl border shadow-inner transition-colors ${
              isBanned
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-slate-900/50 border-cyan-500/30'
            }`}>
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">宣言内容プレビュー</p>
              <p className={`text-xl font-black ${isBanned ? 'text-red-400' : 'text-white'}`}>
                {selectedSpecLabel} が
                <span className={selectedDirection === "up" ? "text-cyan-400 mx-1" : "text-pink-400 mx-1"}>
                  {selectedDirection === "up" ? "大きい" : "小さい"}
                </span>
                ほうが勝ち
                {isBanned && <span className="block text-sm mt-2 text-red-500/80 font-bold">（この組み合わせは選択不可です）</span>}
              </p>
            </div>

            {/* Declare Button */}
            <Button
              onClick={handleDeclare}
              disabled={isLoading || isBanned}
              className={`w-full font-black text-lg py-6 rounded-xl shadow-lg transition-all ${
                isBanned
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] border-none'
              }`}
            >
              {isLoading ? "宣言中..." : isBanned ? "宣言不可" : "この内容で宣言する"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
