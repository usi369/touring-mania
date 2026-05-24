import { useState } from "react";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

interface BikeInfo {
  id: number;
  name: string;
  maker: string;
  cylinders: number;
  transmission: string;
  horsepower: number;
  fuelEfficiency: number;
  seatHeight: number;
  totalLength: number;
  weight: number;
  price: number;
  year: number;
  category: string;
  photoUrl: string | null;
  ownerName?: string | null;
  ownerState?: string | null;
  displacement?: string | null;
  displacementUnit?: string | null;
  engineType?: string | null;
}

interface BikeCardProps {
  bike: BikeInfo;
  isSelected?: boolean;
  onClick?: () => void;
  showDetails?: boolean;
  size?: "small" | "medium" | "large";
  activeSpec?: string;
  isPokerRatio?: boolean;
  isEncyclopedia?: boolean;
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

const MODAL_SPEC_ITEMS = [
  { key: "horsepower", label: "馬力", unit: "PS" },
  { key: "fuelEfficiency", label: "燃費", unit: "km/L" },
  { key: "seatHeight", label: "シート高", unit: "mm" },
  { key: "totalLength", label: "全長", unit: "mm" },
  { key: "weight", label: "重量", unit: "kg" },
  { key: "price", label: "価格", unit: "万円" },
  { key: "year", label: "発売年", unit: "年" },
  { key: "cylinders", label: "気筒数", unit: "" },
  { key: "transmission", label: "変速機", unit: "" },
];

export default function BikeCard({
  bike,
  isSelected = false,
  onClick,
  showDetails = false,
  size = "medium",
  activeSpec,
  isPokerRatio = false,
  isEncyclopedia = false,
}: BikeCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [showBack, setShowBack] = useState(false);

  const sizeClasses = {
    small: "w-16 h-24",
    medium: "w-44 h-[420px] p-4",
    large: "w-52 h-[490px] p-5",
  };

  const handleCardClick = () => {
    if (showDetails) {
      setShowBack(false);
      setShowModal(true);
    }
    onClick?.();
  };

  return (
    <>
      <Card
        onClick={handleCardClick}
        className={`
          ${isPokerRatio ? "w-full aspect-[63/88]" : sizeClasses[size]}
          bg-gradient-to-br from-cyan-500/20 to-pink-500/20 
          border-2 rounded-xl flex flex-col items-center
          cursor-pointer transition-all duration-300 relative overflow-hidden
          ${isPokerRatio ? "p-3 sm:p-5" : ""}
          ${isSelected 
            ? "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-105 z-10" 
            : "border-white/10 hover:border-white/30"
          }
          ${showDetails ? "hover:shadow-2xl" : ""}
        `}
      >
        {/* Top Bar (ID & Badges) - Positioned absolutely to touch edges and fit rounded corners */}
        {size !== "small" && (
          <>
            <div className="absolute top-0 left-0 bg-slate-900/80 backdrop-blur-sm pl-3 pr-2.5 pt-1.5 pb-1 rounded-br-lg border-b border-r border-white/10 z-20">
              <p className="text-[10px] font-mono text-cyan-400 leading-none">
                #{bike.id.toString().padStart(3, '0')}
              </p>
            </div>
            <div className="absolute top-0 right-0 flex z-20">
              <span className="px-2 pt-1.5 pb-1 bg-pink-500/80 backdrop-blur-sm text-[9px] font-bold text-white rounded-bl-lg border-b border-l border-white/10 leading-none">
                {bike.transmission}
              </span>
              <span className="pl-2 pr-3 pt-1.5 pb-1 bg-cyan-500/80 backdrop-blur-sm text-[9px] font-bold text-white rounded-bl-lg border-b border-l border-white/10 leading-none">
                {bike.cylinders}気筒
              </span>
            </div>
          </>
        )}

        <div className="w-full flex flex-col h-full text-center relative z-10">
          {/* Spacer to prevent header from overlapping absolute badges */}
          {size !== "small" && <div className="h-4" />}

          {/* Header Info - Center Top */}
          <div className={`${isPokerRatio ? "mb-1" : "mb-2"} mt-1`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0">
              {bike.maker}
            </p>
            <div className={`
              flex flex-col justify-center
              ${isPokerRatio ? 'h-[44px]' : (size === 'large' ? 'h-[72px]' : 'h-[60px]')}
            `}>
              <h3 className={`font-black text-white leading-tight ${isPokerRatio ? 'text-xl sm:text-2xl' : (size === 'large' ? 'text-lg' : 'text-base')} drop-shadow-md`}>
                {bike.name}
              </h3>
            </div>
          </div>

          {size !== "small" && (
            <>
              {/* Bike Image - Border fitting the actual image size */}
              <div className={`w-full ${isPokerRatio ? "flex-1 min-h-0" : "aspect-square"} overflow-hidden ${isEncyclopedia ? "mb-1" : "mb-3"} group relative flex items-center justify-center`}>
                {bike.photoUrl ? (
                  <img 
                    src={bike.photoUrl} 
                    alt={bike.name} 
                    className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-105 rounded-lg border border-white/20 shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/1e293b/64748b?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900/50 rounded-lg">
                    <span className="text-[10px] font-bold tracking-tighter uppercase">No Image</span>
                  </div>
                )}
              </div>

              {/* Specs below image - minimized vertical padding */}
              {isEncyclopedia && (bike.displacement || bike.engineType) && (
                <div className="text-[11px] font-mono font-bold text-slate-400 -mt-0.5 mb-1.5 leading-none">
                  {bike.displacement && `${bike.displacement}${bike.displacementUnit || ''}`}
                  {bike.displacement && bike.engineType && ' '}
                  {bike.engineType}
                </div>
              )}

              {/* Quick Specs List */}
              <div className={`space-y-0.5 sm:space-y-1 mt-auto border-t border-white/10 ${isPokerRatio ? "pt-2 sm:pt-3" : "pt-3"}`}>
                {SPEC_ITEMS.map((spec) => {
                  const isActive = spec.key === activeSpec;
                  return (
                    <div 
                      key={spec.key} 
                      className={`flex justify-between items-center text-[13px] px-1 py-0.5 rounded ${isActive ? 'bg-amber-500/20 text-amber-300 font-bold' : ''}`}
                    >
                      <span className={`${isActive ? 'text-amber-400/80' : 'text-slate-400'} font-medium`}>{spec.label}</span>
                      <span className={`${isActive ? 'text-amber-200' : 'text-slate-100'} font-bold leading-none`}>
                        {(bike as any)[spec.key] ?? "-"}<span className="text-[10px] ml-0.5 text-slate-500 font-normal">{spec.unit}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-900 border-cyan-500/50 w-full max-w-sm p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-4">
              <p className="text-xs text-cyan-400 font-semibold">
                {bike.category}
              </p>
              <h2 className="text-xl font-bold text-white mb-1">
                {bike.name}
              </h2>
              <p className="text-sm text-slate-400">{bike.maker}</p>
            </div>

            {/* Modal Image - Always Aspect Square (Optimized size) */}
            <div className="w-40 h-40 mx-auto overflow-hidden mb-4 rounded-xl border border-white/10 bg-slate-950/50 flex items-center justify-center relative">
              {bike.photoUrl ? (
                <img 
                  src={bike.photoUrl} 
                  alt={bike.name} 
                  className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-300 rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/1e293b/64748b?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900/50 rounded-lg">
                  <span className="text-xs font-bold tracking-tighter uppercase">No Image</span>
                </div>
              )}
            </div>

            {/* Tab Control (Only for Encyclopedia) */}
            {isEncyclopedia && (
              <div className="flex bg-slate-800/50 p-1 rounded-lg mb-4 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowBack(false)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    !showBack
                      ? "bg-slate-700 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  スペック（表）
                </button>
                <button
                  type="button"
                  onClick={() => setShowBack(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    showBack
                      ? "bg-slate-700 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  持ち主情報（裏）
                </button>
              </div>
            )}

            {!showBack ? (
              <div 
                onClick={() => isEncyclopedia && setShowBack(true)}
                className={isEncyclopedia ? "cursor-pointer" : ""}
              >
                {/* Specs Grid - 3 Columns (Optimized layout) */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {MODAL_SPEC_ITEMS.map((spec) => {
                    let val = (bike as any)[spec.key] ?? "-";
                    let colorClass = "text-white";
                    
                    if (spec.key === "cylinders") {
                      colorClass = "text-cyan-400";
                      if (val !== "-") val = `${val}気筒`;
                    } else if (spec.key === "transmission") {
                      colorClass = "text-pink-400";
                    }
                    
                    return (
                      <div key={spec.key} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 min-h-[58px] flex flex-col justify-between">
                        <p className="text-[9px] text-slate-400 font-bold leading-none mb-1">{spec.label}</p>
                        <p className={`text-base font-black ${colorClass} leading-tight`}>
                          {val}
                          {spec.unit && spec.key !== "cylinders" && (
                            <span className="text-[9px] ml-0.5 text-slate-500 font-normal">{spec.unit}</span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Owner Info (Back side - Compact version) */
              <div 
                onClick={() => setShowBack(false)}
                className="space-y-4 mb-6 cursor-pointer"
              >
                <div className="bg-gradient-to-br from-pink-500/10 to-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden min-h-[200px] flex flex-col justify-between">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
                  
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1">
                      BIKE OWNER CARD
                    </span>
                    <h3 className="text-lg font-black text-cyan-400 mb-3 tracking-wider">
                      持ち主の記録
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold mb-0.5">なまえ</p>
                        <p className="text-lg font-bold text-white tracking-wide">
                          {bike.ownerName || "未登録"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold mb-0.5">都道府県</p>
                        <p className="text-base font-bold text-slate-200">
                          {bike.ownerState || "未登録"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                    <span>TOURING MANIA OFFICIAL</span>
                    <span className="text-cyan-400 animate-pulse">TAP TO FLIP</span>
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-2 rounded-lg transition-colors"
            >
              閉じる
            </button>
          </Card>
        </div>
      )}
    </>
  );
}
