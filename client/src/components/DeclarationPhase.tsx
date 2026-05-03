import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

type SpecType = "horsepower" | "fuelEfficiency" | "seatHeight" | "totalLength" | "weight" | "price" | "year";
type DirectionType = "up" | "down";

interface DeclarationPhaseProps {
  playerName: string;
  onDeclare: (spec: SpecType, direction: DirectionType) => void;
  isLoading?: boolean;
  hand?: any[];
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
}: DeclarationPhaseProps) {
  const [selectedSpec, setSelectedSpec] = useState<SpecType>("horsepower");
  const [selectedDirection, setSelectedDirection] = useState<DirectionType>("up");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showHand, setShowHand] = useState(true);

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="w-full max-w-lg mx-4 flex flex-col gap-4">
        {/* Hand Display (collapsible) */}
        {hand.length > 0 && (
          <Card className="bg-slate-900/95 border-slate-600 p-4">
            <button
              onClick={() => setShowHand(!showHand)}
              className="w-full flex items-center justify-between text-sm text-slate-300 mb-2 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                {showHand ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                あなたの手札（{hand.length}枚）
              </span>
              {showHand ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHand && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {hand.map((bike: any) => (
                  <div
                    key={bike.id}
                    className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 hover:border-cyan-500/50 transition-colors"
                  >
                    <p className="text-xs font-semibold text-white truncate">{bike.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{bike.maker}</p>
                    <div className="flex justify-center gap-1 mt-1 mb-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">{bike.transmission}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">{bike.cylinders}気筒</span>
                    </div>
                    <div className="space-y-1">
                      {SPEC_OPTIONS.map((spec) => {
                        const isSelected = spec.value === selectedSpec;
                        const value = getSpecValue(bike, spec.value);
                        return (
                          <div
                            key={spec.value}
                            className={`flex justify-between text-[10px] px-1 py-0.5 rounded ${
                              isSelected
                                ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                                : "text-slate-400"
                            }`}
                          >
                            <span>{spec.label}</span>
                            <span>{value}{spec.unit}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Declaration Card */}
        <Card className="bg-slate-900 border-cyan-500/50 w-full p-6">
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

          {/* Preview */}
          <div className="mb-6 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
            <p className="text-sm text-slate-400 mb-2">宣言内容:</p>
            <p className="text-lg font-bold text-white">
              {selectedSpecLabel}が
              {selectedDirection === "up" ? "大きい" : "小さい"}
              ほうが勝ち
            </p>
          </div>

          {/* Declare Button */}
          <Button
            onClick={handleDeclare}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg"
          >
            {isLoading ? "宣言中..." : "宣言する"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
