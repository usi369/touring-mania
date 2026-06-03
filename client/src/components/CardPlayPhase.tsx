import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import GameButton from "./ui/GameButton";
import BikeCard from "./BikeCard";
import { X, Info, ChevronRight, ChevronLeft } from "lucide-react";

interface CardPlayPhaseProps {
  currentPlayer: number;
  currentPlayerName: string;
  playerHand: any[];
  declaredSpec: string;
  declaredDirection: string;
  currentBind?: string;
  bindValue?: string;
  isYourTurn: boolean;
  fieldCards?: any[];
  isDeckEmpty?: boolean;
  onCardPlay: (bikeIds: number[], bindDeclare?: any) => Promise<void>;
  onPass: () => Promise<void>;
  onDraw: () => Promise<void>;
  onLog?: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void;
  isLoading?: boolean;
}

const specLabels: Record<string, string> = {
  horsepower: "馬力",
  fuelEfficiency: "燃費",
  seatHeight: "シート高",
  totalLength: "全長",
  weight: "重量",
  price: "価格",
  year: "発売年",
  cylinders: "気筒数",
  transmission: "変速機",
};

const getSpecLabel = (spec: string) => specLabels[spec] || spec;

export default function CardPlayPhase({
  currentPlayer,
  currentPlayerName,
  playerHand,
  declaredSpec,
  declaredDirection,
  currentBind,
  bindValue,
  isYourTurn,
  fieldCards = [],
  isDeckEmpty = false,
  onCardPlay,
  onPass,
  onDraw,
  onLog,
  isLoading = false,
}: CardPlayPhaseProps) {
  const { addToast } = useToast();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [showBindDialog, setShowBindDialog] = useState(false);
  const [selectedBindType, setSelectedBindType] = useState<string | null>(null);
  const [selectedBindValue, setSelectedBindValue] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // 自分のターンが開始または終了した際にカードを引いたフラグをリセット
  useEffect(() => {
    if (!isYourTurn) {
      setHasDrawn(false);
    }
  }, [isYourTurn]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    setScrollProgress((el.scrollLeft / maxScroll) * 100);
  };

  const handleCardSelect = (bikeId: number) => {
    if (isYourTurn) {
      setSelectedCards((prev) => {
        if (prev.includes(bikeId)) return prev.filter(id => id !== bikeId);
        return [...prev, bikeId];
      });
    }
  };

  const validateSelection = (): { valid: boolean; reason?: string } => {
    if (selectedCards.length === 0) return { valid: false };
    
    const firstBike = playerHand.find(b => b.id === selectedCards[0]);
    if (!firstBike) return { valid: false };
    
    const targetValue = firstBike[declaredSpec];

    // 複数枚選択の場合、すべて同じスペック値かチェック
    if (selectedCards.length > 1) {
      for (let i = 1; i < selectedCards.length; i++) {
        const bike = playerHand.find(b => b.id === selectedCards[i]);
        if (bike && bike[declaredSpec] !== targetValue) {
          return { valid: false, reason: "複数枚出す場合は、スペック数値が同じカードを選んでください" };
        }
      }
    }

    // 場にカードがある場合、以上・以下のチェック
    const activeFieldCards = fieldCards.filter((fc: any) => fc.playerId >= 0);
    
    if (activeFieldCards.length > 0) {
      const lastPlayedRecord = activeFieldCards[0];
      const lastBike = lastPlayedRecord.bikes?.[lastPlayedRecord.bikes.length - 1];
      if (lastBike) {
        const previousValue = lastBike[declaredSpec];
        if (declaredDirection === 'up' && targetValue < previousValue) {
          return { valid: false, reason: "場に出ているカード以上の数値を持つカードを出してください" };
        } else if (declaredDirection === 'down' && targetValue > previousValue) {
          return { valid: false, reason: "場に出ているカード以下の数値を持つカードを出してください" };
        }
      }
    }

    // 縛り（bind）のチェック
    if (currentBind && bindValue) {
      let matchesBind = false;
      if (currentBind === 'maker') matchesBind = firstBike.maker === bindValue;
      else if (currentBind === 'cylinders') matchesBind = String(firstBike.cylinders) === bindValue;
      else if (currentBind === 'transmission') matchesBind = firstBike.transmission === bindValue;
      
      if (!matchesBind) {
        return { valid: false, reason: `縛り（${currentBind}: ${bindValue}）を満たすカードを出してください` };
      }
    }

    return { valid: true };
  };

  const handlePlayCard = async () => {
    if (selectedCards.length === 0) return;
    
    const validation = validateSelection();
    if (!validation.valid) {
      addToast('error', 'Invalid Choice', validation.reason || "Selection error");
      return;
    }

    try {
      const bindDeclare = selectedBindType && selectedBindValue ? {
        type: selectedBindType,
        value: selectedBindValue,
      } : undefined;

      await onCardPlay(selectedCards, bindDeclare);
      setSelectedCards([]);
      setShowBindDialog(false);
      setSelectedBindType(null);
      setSelectedBindValue(null);
    } catch (error) {
      console.error("Error playing card:", error);
    }
  };

  const handleConfirmBind = () => {
    if (selectedBindType && selectedBindValue) {
      handlePlayCard();
    }
  };

  const getAvailableBindTypes = (): { type: string; label: string; value: string; available: boolean }[] => {
    if (selectedCards.length === 0) return [];

    const firstSelectedBike = playerHand.find(b => b.id === selectedCards[0]);
    if (!firstSelectedBike) return [];

    const activeFieldCards = fieldCards.filter((fc: any) => fc.playerId >= 0);
    const latestRecord = activeFieldCards.length > 0 ? activeFieldCards[0] : null;
    const latestBike = latestRecord?.bikes?.[latestRecord.bikes.length - 1];

    if (!latestBike) return [];

    return [
      {
        type: 'maker',
        label: 'メーカー',
        value: firstSelectedBike.maker,
        available: firstSelectedBike.maker === latestBike.maker,
      },
      {
        type: 'cylinders',
        label: '気筒数',
        value: String(firstSelectedBike.cylinders),
        available: firstSelectedBike.cylinders === latestBike.cylinders,
      },
      {
        type: 'transmission',
        label: 'AT/MT',
        value: firstSelectedBike.transmission,
        available: firstSelectedBike.transmission === latestBike.transmission,
      },
    ];
  };

  const availableBindTypes = getAvailableBindTypes();
  const hasAnyAvailableBind = availableBindTypes.some(bt => bt.available);

  return (
    <div className="w-full h-full flex flex-col gap-4 relative overflow-hidden">
      
      {/* 1. Battle Field (Top Half) */}
      <div className="flex-1 min-h-0 relative flex flex-col pt-4">
        <div className="flex justify-between items-center px-4 mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Active Field</span>
          </div>
          {!fieldCards.some((fc: any) => fc.playerId >= 0) && (
            <motion.span 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-[8px] font-black text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-500/20 uppercase"
            >
              Field Cleared
            </motion.span>
          )}
        </div>

        {/* Dynamic Field Display */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center justify-center gap-6 px-12 snap-x snap-mandatory">
          <AnimatePresence mode="popLayout">
            {fieldCards.length > 0 ? (
              fieldCards.map((fc: any, recordIdx: number) => {
                const isLatest = recordIdx === 0;
                const bikes = fc.bikes || [];
                return bikes.slice().reverse().map((bike: any, bikeIdx: number) => {
                  const isLatestCard = isLatest && bikeIdx === 0;
                  return (
                    <motion.div
                      key={`${fc.id}-${bike.id}`}
                      layout
                      initial={{ scale: 0.5, opacity: 0, y: 100, rotate: 10 }}
                      animate={{ 
                        scale: isLatestCard ? 1 : 0.8, 
                        opacity: isLatestCard ? 1 : 0.4, 
                        y: 0, 
                        rotate: 0,
                        filter: isLatestCard ? "none" : "grayscale(0.5)"
                      }}
                      className={`flex-shrink-0 snap-center relative ${isLatestCard ? "z-20" : "z-10"}`}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30">
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black tracking-widest border ${
                          fc.playerId === 1 ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-800 border-white/10'
                        } text-white uppercase`}>
                          {fc.playerId === 1 ? 'You' : fc.playerId === 0 ? 'Deck' : `P${Math.abs(fc.playerId)}`}
                        </span>
                      </div>
                      <BikeCard bike={bike} size="medium" activeSpec={declaredSpec} />
                    </motion.div>
                  );
                });
              })
            ) : (
              <div className="text-center opacity-30 flex flex-col items-center gap-4">
                <div className="w-40 h-56 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest">No Cards</span>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Player Control Area (Bottom Half) */}
      <div className="bg-slate-900/60 backdrop-blur-md border-t border-white/5 p-4 space-y-4 shrink-0">
        
        {/* Hand Section */}
        <div className="relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Your Hand</span>
            {isYourTurn && (
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="text-[8px] font-black text-cyan-400 uppercase">Action Required</motion.span>
            )}
          </div>
          
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-2.5 overflow-x-auto pb-4 pt-6 no-scrollbar snap-x snap-mandatory"
          >
            {playerHand.map((bike: any) => {
              const selectionIndex = selectedCards.indexOf(bike.id);
              const isSelected = selectionIndex !== -1;
              return (
                <motion.div 
                  key={bike.id} 
                  animate={{ y: isSelected ? -20 : 0 }}
                  className="snap-start flex-shrink-0 relative"
                >
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-4 -right-2 w-7 h-7 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg z-30 border-2 border-white/20"
                    >
                      {selectionIndex + 1}
                    </motion.div>
                  )}
                  <BikeCard
                    bike={bike}
                    isSelected={isSelected}
                    onClick={() => handleCardSelect(bike.id)}
                    size="medium"
                    activeSpec={declaredSpec}
                    showDetails={!isYourTurn}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Scroll Indicator */}
          <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div className="h-full bg-cyan-500" style={{ width: `${scrollProgress}%` }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isYourTurn ? (
            <>
              <GameButton
                variant="primary"
                className="flex-[2] h-14"
                disabled={selectedCards.length === 0 || isLoading}
                onClick={() => {
                  const validation = validateSelection();
                  if (validation.valid) {
                    if (currentBind || !hasAnyAvailableBind) handlePlayCard();
                    else setShowBindDialog(true);
                  } else {
                    addToast('error', 'Strategy Error', validation.reason || 'Invalid Play');
                  }
                }}
              >
                {isLoading ? "SYNCING..." : `PLAY DATA (${selectedCards.length})`}
              </GameButton>
              
              <div className="flex flex-1 gap-2">
                <GameButton variant="secondary" className="flex-1 h-14 p-0" disabled={isLoading} onClick={onPass}>
                  SKIP
                </GameButton>
                {!hasDrawn && !isDeckEmpty && (
                  <GameButton variant="secondary" className="flex-1 h-14 p-0" disabled={isLoading} onClick={async () => { await onDraw(); setHasDrawn(true); }}>
                    DRAW
                  </GameButton>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-14 flex items-center justify-center bg-slate-950/40 rounded-xl border border-white/5">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] animate-pulse">Wait for {currentPlayerName}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bind Dialog (Stage-relative) */}
      <AnimatePresence>
        {showBindDialog && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border-2 border-cyan-500/30 p-6 rounded-3xl shadow-2xl"
            >
              <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-6 text-center">Declare Constraint?</h3>
              
              <div className="space-y-6">
                <div className="grid gap-3">
                  {availableBindTypes.map((bt) => (
                    <button
                      key={bt.type}
                      disabled={!bt.available}
                      onClick={() => { setSelectedBindType(bt.type); setSelectedBindValue(bt.value); }}
                      className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all ${
                        selectedBindType === bt.type 
                          ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-lg' 
                          : bt.available ? 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700' : 'opacity-20 border-transparent grayscale'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{bt.label}</span>
                      <span className="font-mono text-xs font-bold">{bt.available ? bt.value : '---'}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <GameButton className="flex-1" onClick={handleConfirmBind} disabled={!selectedBindType}>
                    APPLY BIND
                  </GameButton>
                  <GameButton variant="secondary" className="flex-1" onClick={() => { setShowBindDialog(false); handlePlayCard(); }}>
                    NO BIND
                  </GameButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

