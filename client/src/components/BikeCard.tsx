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
}

interface BikeCardProps {
  bike: BikeInfo;
  isSelected?: boolean;
  onClick?: () => void;
  showDetails?: boolean;
  size?: "small" | "medium" | "large";
  activeSpec?: string;
  isPokerRatio?: boolean;
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

export default function BikeCard({
  bike,
  isSelected = false,
  onClick,
  showDetails = false,
  size = "medium",
  activeSpec,
  isPokerRatio = false,
}: BikeCardProps) {
  const [showModal, setShowModal] = useState(false);

  const sizeClasses = {
    small: "w-16 h-24",
    medium: "w-44 h-auto min-h-[250px] p-4",
    large: "w-52 h-auto min-h-[300px] p-5",
  };

  const handleCardClick = () => {
    if (showDetails) {
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
        <div className="w-full flex flex-col h-full text-center relative z-10">
          {/* Top Bar (ID & Badges) */}
          {size !== "small" && (
            <div className="flex justify-between items-start w-full mb-1">
              <div className="bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-br-lg border-b border-r border-white/10 -ml-3 -mt-3 sm:-ml-5 sm:-mt-5 z-20">
                <p className="text-[10px] font-mono text-cyan-400">
                  #{bike.id.toString().padStart(3, '0')}
                </p>
              </div>
              <div className="flex gap-1 -mr-3 -mt-3 sm:-mr-5 sm:-mt-5 z-20">
                <span className="px-1.5 py-0.5 bg-pink-500/80 backdrop-blur-sm text-[9px] font-bold text-white rounded-bl-lg border-b border-l border-white/10">
                  {bike.transmission}
                </span>
                <span className="px-1.5 py-0.5 bg-cyan-500/80 backdrop-blur-sm text-[9px] font-bold text-white border-b border-l border-white/10">
                  {bike.cylinders}気筒
                </span>
              </div>
            </div>
          )}

          {/* Header Info */}
          <div className={`${isPokerRatio ? "mb-2" : "mb-3"} mt-1`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">
              {bike.maker}
            </p>
            <h3 className={`font-black text-white leading-tight ${isPokerRatio ? 'text-xl sm:text-2xl' : (size === 'large' ? 'text-lg' : 'text-base')} drop-shadow-md`}>
              {bike.name}
            </h3>
          </div>

          {size !== "small" && (
            <>
              {/* Bike Image - Expanded */}
              <div className={`w-full ${isPokerRatio ? "flex-1 min-h-0" : "aspect-[4/3]"} bg-slate-950/40 rounded-lg overflow-hidden mb-3 border border-white/10 shadow-inner group relative`}>
                {bike.photoUrl ? (
                  <img 
                    src={bike.photoUrl} 
                    alt={bike.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/1e293b/64748b?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900/50">
                    <span className="text-[10px] font-bold tracking-tighter uppercase">No Image</span>
                  </div>
                )}
                {/* Visual Polish: Gradient overlay on image */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
              </div>

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

            {/* Specs Grid - 7 main specs */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {SPEC_ITEMS.map((spec) => (
                <div key={spec.key} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">{spec.label}</p>
                  <p className="text-lg font-bold text-white">
                    {(bike as any)[spec.key] ?? "-"}{spec.unit}
                  </p>
                </div>
              ))}
            </div>

            {/* Additional info */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">気筒数</p>
                <p className="text-lg font-bold text-cyan-400">
                  {bike.cylinders}
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">変速機</p>
                <p className="text-lg font-bold text-pink-400">
                  {bike.transmission}
                </p>
              </div>
            </div>

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
