import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, X } from "lucide-react";

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

  const getSpecValue = (bike: any, spec: SpecType): string | number => {
    return bike[spec] ?? "-";
  };

  return (
    <>
      {/* ===== メインオーバーレイ ===== */}
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 p-3 sm:p-5" style={{ background: "rgba(2,6,23,0.25)" }}>
        <Card
          className="w-full max-w-xl flex flex-col gap-4 bg-slate-900/95 border-cyan-500/30 p-5 sm:p-6 shadow-2xl backdrop-blur-xl rounded-2xl overflow-y-auto"
          style={{ maxHeight: "92dvh" }}
        >
          {/* ヘッダー */}
          <div className="text-center flex-shrink-0 border-b border-white/10 pb-3">
            <h2
              className="text-xl sm:text-2xl font-black text-white tracking-wider"
              style={{ textShadow: "0 0 20px rgba(34,211,238,0.4)" }}
            >
              宣言フェーズ
            </h2>
            <p className="text-[10px] sm:text-xs font-bold text-cyan-400 mt-0.5">{playerName}の宣言</p>
          </div>

          {/* 手札アイコン列 */}
          {hand.length > 0 && (
            <div className="flex-shrink-0 bg-slate-950/40 p-3 rounded-xl border border-white/5">
              <p className="text-[9px] font-bold text-white/40 text-center mb-2 tracking-widest uppercase">
                あなたの手札（{hand.length}枚）— タップで詳細確認
              </p>
              <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
                {hand.map((bike: any) => (
                  <button
                    key={bike.id}
                    onClick={() => setExpandedBike(bike)}
                    className="group relative flex flex-col items-center gap-1 focus:outline-none"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {/* アイコン画像 */}
                    <div
                      className="relative overflow-hidden rounded-xl border border-white/10 group-hover:border-cyan-400/70 transition-all duration-300"
                      style={{
                        width: "80px",
                        height: "80px",
                        background: "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(236,72,153,0.08))",
                        boxShadow: "0 0 0 0 rgba(34,211,238,0)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "0 0 12px rgba(34,211,238,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "0 0 0 0 rgba(34,211,238,0)";
                      }}
                    >
                      {bike.photoUrl ? (
                        <img
                          src={bike.photoUrl}
                          alt={bike.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/80x80/1e293b/64748b?text=?";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">
                          NO IMG
                        </div>
                      )}
                      {/* グロー演出 */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                        style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.12), transparent)" }}
                      />
                    </div>
                    {/* バイク名 */}
                    <span
                      className="text-[9px] font-bold text-white/60 group-hover:text-cyan-300 transition-colors duration-200 text-center leading-tight truncate"
                      style={{ maxWidth: "80px" }}
                    >
                      {bike.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 宣言フォーム */}
          <div className="flex-shrink-0 space-y-4">
            {hasBan && (
              <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-xs font-bold text-amber-400 leading-relaxed">
                  ⚠️ 前回「
                  {SPEC_OPTIONS.find((s) => s.value === prevDeclaredSpec)?.label ?? prevDeclaredSpec}
                  {prevDeclaredDirection === "up" ? " ↑大きい" : " ↓小さい"}」は選択不可
                </p>
              </div>
            )}

            {/* スペック選択 */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">
                スペックを選択
              </label>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white flex justify-between items-center hover:border-cyan-500/60 transition-all"
              >
                <span className="font-bold text-sm sm:text-base">{selectedSpecLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 text-cyan-400 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                />
              </button>
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-20 shadow-2xl">
                  {SPEC_OPTIONS.map((spec) => (
                    <button
                      key={spec.value}
                      onClick={() => {
                        setSelectedSpec(spec.value);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-white font-bold border-b border-slate-700/50 hover:bg-cyan-900/30 hover:text-cyan-300 transition-colors last:border-0 text-xs sm:text-sm flex items-center justify-between gap-3"
                    >
                      <span className="shrink-0">{spec.label}</span>
                      <span className="text-xs text-cyan-300 text-right tabular-nums">
                        {hand.length > 0
                          ? hand.map((bike) => getSpecValue(bike, spec.value)).join(" / ")
                          : "-"}
                        <span className="ml-1 text-slate-400">{spec.unit}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 方向選択 */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">
                方向を選択
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedDirection("up")}
                  className={`py-2.5 px-4 rounded-xl font-black text-sm sm:text-base transition-all ${
                    selectedDirection === "up"
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(34,211,238,0.35)] scale-[1.01]"
                      : "bg-slate-800/80 text-slate-400 border border-slate-700 hover:border-cyan-500/40"
                  }`}
                >
                  ↑ 大きい
                </button>
                <button
                  onClick={() => setSelectedDirection("down")}
                  className={`py-2.5 px-4 rounded-xl font-black text-sm sm:text-base transition-all ${
                    selectedDirection === "down"
                      ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.35)] scale-[1.01]"
                      : "bg-slate-800/80 text-slate-400 border border-slate-700 hover:border-pink-500/40"
                  }`}
                >
                  ↓ 小さい
                </button>
              </div>
            </div>

            {/* プレビュー */}
            <div
              className={`px-4 py-2.5 rounded-xl border transition-colors ${
                isBanned
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-slate-950/50 border-cyan-500/20"
              }`}
            >
              <p className="text-[9px] font-bold text-slate-500 mb-0.5 uppercase tracking-widest">宣言内容</p>
              <p className={`text-sm sm:text-base font-black ${isBanned ? "text-red-400" : "text-white"}`}>
                {selectedSpecLabel} が
                <span
                  className={`mx-1 ${
                    selectedDirection === "up" ? "text-cyan-400" : "text-pink-400"
                  }`}
                >
                  {selectedDirection === "up" ? "大きい" : "小さい"}
                </span>
                ほうが勝ち
                {isBanned && (
                  <span className="block text-[10px] mt-0.5 text-red-500/80 font-bold">
                    （この組み合わせは選択不可です）
                  </span>
                )}
              </p>
            </div>

            {/* 宣言ボタン */}
            <Button
              onClick={handleDeclare}
              disabled={isLoading || isBanned}
              className={`w-full font-black text-sm sm:text-base py-4 rounded-xl shadow-lg transition-all ${
                isBanned
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  : "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] border-none"
              }`}
            >
              {isLoading ? "宣言中..." : isBanned ? "宣言不可" : "この内容で宣言する"}
            </Button>
          </div>
        </Card>
      </div>

      {/* ===== バイク詳細オーバーレイ（タップで展開） ===== */}
      {expandedBike && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(2,6,23,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setExpandedBike(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-cyan-500/40 overflow-hidden shadow-[0_0_60px_rgba(34,211,238,0.2)]"
            style={{
              background: "linear-gradient(160deg, #0f172a 0%, #0f2340 50%, #0f172a 100%)",
              animation: "expandIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 閉じるボタン */}
            <button
              onClick={() => setExpandedBike(null)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-slate-800/80 border border-white/10 text-slate-400 hover:text-white hover:border-cyan-400 transition-all z-10"
              style={{ position: "absolute" }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* 写真エリア */}
            <div className="relative h-44 overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(236,72,153,0.08))",
                }}
              />
              {expandedBike.photoUrl ? (
                <img
                  src={expandedBike.photoUrl}
                  alt={expandedBike.name}
                  className="w-full h-full object-contain"
                  style={{ animation: "fadeIn 0.3s ease both" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
                  No Image
                </div>
              )}
              {/* 下グラデーション */}
              <div
                className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                style={{
                  background: "linear-gradient(to top, #0f172a, transparent)",
                }}
              />
              {/* バイク名オーバーレイ */}
              <div className="absolute bottom-2 left-4 right-4">
                <p className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-widest">
                  {expandedBike.maker}
                </p>
                <h3
                  className="text-xl font-black text-white leading-tight"
                  style={{ textShadow: "0 0 20px rgba(34,211,238,0.5)" }}
                >
                  {expandedBike.name}
                </h3>
              </div>
            </div>

            {/* スペックグリッド */}
            <div className="px-4 pb-4 pt-3">
              <div className="grid grid-cols-2 gap-2">
                {SPEC_ITEMS.map((spec) => (
                  <div
                    key={spec.key}
                    className="rounded-xl px-3 py-2 border"
                    style={{
                      background: "rgba(15,23,42,0.8)",
                      borderColor: "rgba(255,255,255,0.07)",
                    }}
                  >
                    <p className="text-[10px] font-bold text-slate-500 mb-0.5">{spec.label}</p>
                    <p className="text-sm font-black text-white leading-none">
                      {(expandedBike as any)[spec.key] ?? "—"}
                      <span className="text-[10px] ml-0.5 text-slate-500 font-normal">
                        {spec.unit}
                      </span>
                    </p>
                  </div>
                ))}
                <div
                  className="rounded-xl px-3 py-2 border"
                  style={{
                    background: "rgba(15,23,42,0.8)",
                    borderColor: "rgba(255,255,255,0.07)",
                  }}
                >
                  <p className="text-[10px] font-bold text-slate-500 mb-0.5">気筒数</p>
                  <p className="text-sm font-black text-cyan-400">{expandedBike.cylinders}</p>
                </div>
                <div
                  className="rounded-xl px-3 py-2 border"
                  style={{
                    background: "rgba(15,23,42,0.8)",
                    borderColor: "rgba(255,255,255,0.07)",
                  }}
                >
                  <p className="text-[10px] font-bold text-slate-500 mb-0.5">変速機</p>
                  <p className="text-sm font-black text-pink-400">{expandedBike.transmission}</p>
                </div>
              </div>

              <button
                onClick={() => setExpandedBike(null)}
                className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold text-white/70 hover:text-white border border-white/10 hover:border-cyan-500/50 transition-all"
                style={{ background: "rgba(15,23,42,0.6)" }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes expandIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
