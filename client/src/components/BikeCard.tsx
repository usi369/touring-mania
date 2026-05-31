import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { X, Sparkles } from "lucide-react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

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
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Rarity Logic (Logical Design based on Specs)
  const getRarity = () => {
    if (bike.horsepower > 150 || bike.price > 200) return "legendary";
    if (bike.horsepower > 70 || bike.price > 100) return "rare";
    return "common";
  };

  const rarity = getRarity();
  const rarityColors = {
    legendary: "from-amber-400 via-yellow-500 to-orange-600",
    rare: "from-cyan-400 via-blue-500 to-purple-600",
    common: "from-slate-400 via-slate-500 to-slate-600",
  };

  const glowStyles = {
    legendary: "shadow-[0_0_30px_rgba(245,158,11,0.4)] border-amber-400/50",
    rare: "shadow-[0_0_20px_rgba(34,211,238,0.3)] border-cyan-400/40",
    common: "shadow-lg border-white/10",
  };

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
      <motion.div
        ref={cardRef}
        style={{
          rotateX: isSelected ? 0 : rotateX,
          rotateY: isSelected ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="perspective-1000"
      >
        <Card
          onClick={handleCardClick}
          className={`
            ${isPokerRatio ? "w-full aspect-[63/88]" : sizeClasses[size]}
            bg-slate-900 border-2 rounded-2xl flex flex-col items-center
            cursor-pointer transition-all duration-300 relative overflow-hidden
            ${isPokerRatio ? "p-3 sm:p-5" : ""}
            ${isSelected 
              ? "border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.6)] scale-105 z-10" 
              : glowStyles[rarity]
            }
          `}
        >
          {/* Rarity Aura (Moving Gradient Background) */}
          <div className={`absolute inset-0 bg-gradient-to-br ${rarityColors[rarity]} opacity-[0.08] z-0`} />
          
          {/* Holographic Flash Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-20 pointer-events-none z-10" />

          {/* Top Bar (ID & Badges) */}
          {size !== "small" && (
            <>
              <div className="absolute top-0 left-0 bg-slate-950/80 backdrop-blur-md pl-3 pr-2.5 pt-1.5 pb-1 rounded-br-xl border-b border-r border-white/5 z-20">
                <p className="text-[9px] font-mono text-cyan-400/80 leading-none">
                  #{bike.id.toString().padStart(3, '0')}
                </p>
              </div>
              <div className="absolute top-0 right-0 flex z-20">
                {rarity === "legendary" && (
                  <div className="px-2 pt-1.5 pb-1 bg-amber-500/90 text-white rounded-bl-xl flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-2.5 h-2.5 fill-white" />
                    <span className="text-[8px] font-black uppercase">LEGEND</span>
                  </div>
                )}
                {rarity === "rare" && (
                  <div className="px-2 pt-1.5 pb-1 bg-cyan-600/90 text-white rounded-bl-xl flex items-center gap-1 shadow-lg">
                    <span className="text-[8px] font-black uppercase">RARE</span>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="w-full flex flex-col h-full text-center relative z-20">
            {/* Header Info */}
            <div className={`${isPokerRatio ? "mb-1" : "mb-2"} mt-2`}>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-0.5">
                {bike.maker}
              </p>
              <div className={`
                flex flex-col justify-center
                ${isPokerRatio ? 'h-[44px]' : (size === 'large' ? 'h-[72px]' : 'h-[60px]')}
              `}>
                <h3 className={`font-black text-white leading-tight ${isPokerRatio ? 'text-lg sm:text-xl' : (size === 'large' ? 'text-lg' : 'text-base')} drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] uppercase italic`}>
                  {bike.name}
                </h3>
              </div>
            </div>

            {size !== "small" && (
              <>
                {/* Bike Image */}
                <div className={`w-full ${isPokerRatio ? "flex-1 min-h-0" : "aspect-square"} overflow-hidden ${isEncyclopedia ? "mb-1" : "mb-3"} group relative flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-slate-950/40 rounded-xl border border-white/5" />
                  {bike.photoUrl ? (
                    <img 
                      src={bike.photoUrl} 
                      alt={bike.name} 
                      className="max-w-[90%] max-h-[90%] w-auto h-auto object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-2xl z-10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/1e293b/64748b?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-800 bg-slate-950/20 rounded-xl">
                      <span className="text-[10px] font-black tracking-widest uppercase opacity-40">Syncing...</span>
                    </div>
                  )}
                </div>

                {/* Specs Highlight Area */}
                <div className={`space-y-0.5 mt-auto border-t border-white/5 ${isPokerRatio ? "pt-2 sm:pt-3" : "pt-3"}`}>
                  {SPEC_ITEMS.map((spec) => {
                    const isActive = spec.key === activeSpec;
                    return (
                      <div 
                        key={spec.key} 
                        className={`flex justify-between items-center text-[11px] px-2 py-0.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-cyan-500/20 border border-cyan-400/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'opacity-80'}`}
                      >
                        <span className={`${isActive ? 'text-cyan-400' : 'text-slate-500'} font-bold uppercase text-[8px] tracking-wider`}>{spec.label}</span>
                        <div className="flex items-baseline">
                          <span className={`${isActive ? 'text-white' : 'text-slate-200'} font-black italic`}>
                            {(bike as any)[spec.key] ?? "-"}
                          </span>
                          <span className="text-[8px] ml-0.5 text-slate-600 font-bold uppercase">{spec.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <Card className="bg-slate-900 border-2 border-white/10 w-full max-w-sm p-6 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${rarityColors[rarity]} opacity-[0.05]`} />
            
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10">
              <div className="mb-4">
                <p className={`text-[10px] font-black uppercase tracking-widest ${rarity === 'legendary' ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {bike.category} — {rarity.toUpperCase()}
                </p>
                <h2 className="text-2xl font-black text-white mb-1 italic uppercase italic leading-none">
                  {bike.name}
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{bike.maker}</p>
              </div>

              <div className="w-44 h-44 mx-auto overflow-hidden mb-6 rounded-2xl border border-white/5 bg-slate-950/50 flex items-center justify-center shadow-inner">
                {bike.photoUrl ? (
                  <img src={bike.photoUrl} alt={bike.name} className="max-w-[85%] max-h-[85%] w-auto h-auto object-contain drop-shadow-2xl" />
                ) : (
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">No Image</span>
                )}
              </div>

              {isEncyclopedia && (
                <div className="flex bg-slate-950/50 p-1 rounded-xl mb-4 border border-white/5">
                  <button onClick={() => setShowBack(false)} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${!showBack ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>SPECS</button>
                  <button onClick={() => setShowBack(true)} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${showBack ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>OWNER</button>
                </div>
              )}

              {!showBack ? (
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {MODAL_SPEC_ITEMS.map((spec) => (
                    <div key={spec.key} className="bg-slate-950/40 border border-white/5 rounded-xl p-2 flex flex-col justify-between min-h-[50px]">
                      <p className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">{spec.label}</p>
                      <p className="text-xs font-black text-slate-200">
                        {(bike as any)[spec.key] ?? "-"}
                        <span className="text-[8px] ml-0.5 text-slate-600">{spec.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-white/5 rounded-2xl p-5 mb-6 min-h-[160px] flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] font-mono tracking-widest text-slate-600 uppercase block mb-2">Registration Record</span>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[8px] text-slate-600 font-black uppercase">Owner Name</p>
                        <p className="text-xl font-black text-white italic tracking-wide">{bike.ownerName || "ANONYMOUS"}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-600 font-black uppercase">Region</p>
                        <p className="text-base font-black text-cyan-400/80 italic">{bike.ownerState || "UNKNOWN"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={() => setShowModal(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black text-[10px] tracking-widest py-6 rounded-xl uppercase border border-white/5 shadow-lg">CLOSE MODULE</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
