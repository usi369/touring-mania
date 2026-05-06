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
          ${sizeClasses[size]}
          bg-gradient-to-br from-cyan-500/20 to-pink-500/20 
          border-2 rounded-lg flex flex-col items-center justify-center 
          cursor-pointer transition-all duration-200
          ${isSelected 
            ? "border-cyan-400 shadow-lg shadow-cyan-400/50 scale-105" 
            : "border-cyan-500/50 hover:border-cyan-400"
          }
          ${showDetails ? "hover:shadow-lg" : ""}
        `}
      >
        <div className="w-full flex flex-col h-full text-center">
          {/* Header Info */}
          <div className="mb-3">
            <p className="text-[12px] font-bold text-cyan-400 uppercase tracking-widest mb-0.5">
              {bike.maker}
            </p>
            <h3 className={`font-black text-white leading-tight ${size === 'large' ? 'text-lg' : 'text-base'} line-clamp-2`}>
              {bike.name}
            </h3>
            <p className="text-[12px] text-slate-500 font-mono mt-0.5">
              ID: {bike.id.toString().padStart(3, '0')}
            </p>
          </div>

          {size !== "small" && (
            <>
              {/* Badges */}
              <div className="flex justify-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  {bike.transmission}
                </span>
                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {bike.cylinders}気筒
                </span>
              </div>

              {/* Bike Image */}
              <div className="w-full aspect-[4/3] bg-slate-800/50 rounded-md overflow-hidden mb-3 border border-white/5">
                {bike.photoUrl ? (
                  <img 
                    src={bike.photoUrl} 
                    alt={bike.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/1e293b/64748b?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <span className="text-[10px]">NO IMAGE</span>
                  </div>
                )}
              </div>

              {/* Quick Specs List */}
              <div className="space-y-1 mt-auto border-t border-white/10 pt-3">
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
