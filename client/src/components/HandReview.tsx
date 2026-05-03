import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import BikeCard from "./BikeCard";

interface HandReviewProps {
  hand: any[];
  playerNumber: number;
  onConfirm: () => void;
}

const SPEC_ITEMS = [
  { key: "horsepower", label: "馬力", unit: "PS" },
  { key: "fuelEfficiency", label: "燃費", unit: "km/L" },
  { key: "seatHeight", label: "シート高", unit: "mm" },
  { key: "totalLength", label: "全長", unit: "mm" },
  { key: "weight", label: "重量", unit: "kg" },
  { key: "price", label: "価格", unit: "万円" },
  { key: "year", label: "発売年月日", unit: "年" },
];

/**
 * Hand Review Screen - Display dealt cards before declaration
 */
export default function HandReview({ hand, playerNumber, onConfirm }: HandReviewProps) {
  const [selectedBikeId, setSelectedBikeId] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    if (isConfirming) return;
    setIsConfirming(true);
    onConfirm();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          プレイヤー {playerNumber} の手札
        </h1>
        <p className="text-slate-400">配られたバイクを確認してください</p>
      </div>

      {/* Hand Display */}
      <div className="w-full max-w-2xl bg-slate-800/50 border border-cyan-500/30 rounded-lg p-6 mb-8">
        <p className="text-xs text-slate-400 mb-3">（← 横スクロールで確認できます →）</p>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-1 px-1 mb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          {hand.map((bike) => (
            <div
              key={bike.id}
              onClick={() => setSelectedBikeId(bike.id)}
              className={`flex-shrink-0 w-[140px] sm:w-[160px] p-2.5 sm:p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 snap-start ${
                selectedBikeId === bike.id
                  ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-400/20 scale-[1.02]"
                  : "border-slate-600 bg-slate-700/30 hover:border-cyan-500/50"
              }`}
            >
              <div className="text-center">
                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                  {bike.name}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400 truncate">{bike.maker}</p>
                <div className="flex justify-center gap-1 mt-1 mb-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">{bike.transmission}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">{bike.cylinders}気筒</span>
                </div>
                <div className="space-y-0.5 text-[10px] text-slate-300">
                  {SPEC_ITEMS.map((spec) => (
                    <p key={spec.key} className="flex justify-between">
                      <span className="text-slate-400">{spec.label}</span>
                      <span>{bike[spec.key] ?? "-"}{spec.unit}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Bike Details */}
        {selectedBikeId && (
          <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
            {(() => {
              const bike = hand.find((b) => b.id === selectedBikeId);
              return (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400">バイク名</p>
                    <p className="text-lg font-bold text-white">{bike.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">メーカー</p>
                      <p className="text-white font-semibold">{bike.maker}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">カテゴリ</p>
                      <p className="text-white font-semibold">{bike.category}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {SPEC_ITEMS.map((spec) => (
                      <div key={spec.key}>
                        <p className="text-xs text-slate-400">{spec.label}</p>
                        <p className="text-white font-semibold">{bike[spec.key] ?? "-"}{spec.unit}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">気筒数</p>
                      <p className="text-white font-semibold">{bike.cylinders}気筒</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">トランスミッション</p>
                      <p className="text-white font-semibold">{bike.transmission}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Confirm Button */}
      <Button
        onClick={handleConfirm}
        disabled={isConfirming}
        className="w-full max-w-sm h-12 text-base font-bold bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
      >
        {isConfirming ? "処理中..." : "確認完了"}
      </Button>
    </div>
  );
}
