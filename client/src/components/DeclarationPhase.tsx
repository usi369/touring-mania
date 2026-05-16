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
    <div className="fixed inset-0 bg-slate-950/20 flex flex-col items-center justify-center z-50 overflow-y-auto py-8">
      <div className="w-full max-w-4xl mx-4 flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
        {/* Hand Display (Always visible in a row) */}
        {hand.length > 0 && (
          <div className="w-full">
            <p className="text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-3 ml-2">あなたの手札（{hand.length}枚）</p>
            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory -mx-2 px-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {hand.map((bike: any) => (
                <div key={bike.id} className="flex-shrink-0 snap-center transition-transform hover:scale-110 duration-300">
                  <div className="shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-2xl">
                    <BikeCard bike={bike} size="medium" showDetails={true} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Declaration Card */}
        <div className="w-full flex justify-center">
          <Card className="bg-slate-900/90 border-cyan-500/50 w-full max-w-lg p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">宣言フェーズ</h2>
            <p className="text-sm text-cyan-400">{playerName}の宣言</p>
          </div>

          {/* Spec Selection */}
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">
              スペックを選択
            </label>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white flex justify-between items-center hover:border-cyan-500 transition-colors"
              >
                <span>{selectedSpecLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden z-10">
                  {SPEC_OPTIONS.map((spec) => (
                    <button
                      key={spec.value}
                      onClick={() => {
                        setSelectedSpec(spec.value);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-white hover:bg-slate-700 transition-colors"
                    >
                      {spec.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Direction Selection */}
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">
              方向を選択
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedDirection("up")}
                className={`py-3 px-4 rounded-lg font-bold transition-all ${
                  selectedDirection === "up"
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-cyan-500"
                }`}
              >
                ↑ 大きい
              </button>
              <button
                onClick={() => setSelectedDirection("down")}
                className={`py-3 px-4 rounded-lg font-bold transition-all ${
                  selectedDirection === "down"
                    ? "bg-pink-500 text-white"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-pink-500"
                }`}
              >
                ↓ 小さい
              </button>
            </div>
          </div>

          {/* Banned declaration warning */}
          {hasBan && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-xs text-amber-400">
                前回の宣言「{SPEC_OPTIONS.find(s => s.value === prevDeclaredSpec)?.label ?? prevDeclaredSpec}
                {prevDeclaredDirection === 'up' ? ' ↑大きい' : ' ↓小さい'}」と同じ組み合わせは選べません
              </p>
            </div>
          )}

          {/* Preview */}
          <div className={`mb-6 p-4 rounded-lg border ${
            isBanned
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-slate-800/30 border-slate-700'
          }`}>
            <p className="text-sm text-slate-400 mb-2">宣言内容:</p>
            <p className={`text-lg font-bold ${isBanned ? 'text-red-400' : 'text-white'}`}>
              {selectedSpecLabel}が
              {selectedDirection === "up" ? "大きい" : "小さい"}
              ほうが勝ち
              {isBanned && <span className="text-sm ml-2">（選択不可）</span>}
            </p>
          </div>

          {/* Declare Button */}
          <Button
            onClick={handleDeclare}
            disabled={isLoading || isBanned}
            className={`w-full font-bold py-3 rounded-lg ${
              isBanned
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white'
            }`}
          >
            {isLoading ? "宣言中..." : isBanned ? "この組み合わせは宣言できません" : "宣言する"}
          </Button>
        </Card>
      </div>
    </div>
  </div>
  );
}
