import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/Toast";

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
  onCardPlay: (bikeIds: number[], bindDeclare?: any) => Promise<void>;
  onPass: () => Promise<void>;
  onDraw: () => Promise<void>;
  onLog?: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void;
  isLoading?: boolean;
}

import BikeCard from "./BikeCard";

const SPEC_ITEMS = [
  { key: "horsepower", label: "馬力", unit: "PS" },
  { key: "fuelEfficiency", label: "燃費", unit: "km/L" },
  { key: "seatHeight", label: "シート高", unit: "mm" },
  { key: "totalLength", label: "全長", unit: "mm" },
  { key: "weight", label: "重量", unit: "kg" },
  { key: "price", label: "価格", unit: "万円" },
  { key: "year", label: "発売年月日", unit: "年" },
];

const specLabels: Record<string, string> = {
  horsepower: "馬力",
  fuelEfficiency: "燃費",
  seatHeight: "シート高",
  totalLength: "全長",
  weight: "重量",
  price: "価格",
  year: "発売年月日",
  cylinders: "気筒数",
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

  const handleCardSelect = (bikeId: number) => {
    if (isYourTurn) {
      setSelectedCards((prev) => {
        if (prev.includes(bikeId)) {
          return prev.filter(id => id !== bikeId);
        }
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
          return { valid: false, reason: "複数枚出す場合は、宣言されたスペック（数値）が同じカードを選んでください" };
        }
      }
    }

    // 場にカードがある場合、以上・以下のチェック
    if (fieldCards.length > 0) {
      const lastPlayedRecord = fieldCards[0];
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

    // 縛り（Bind）のチェック
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
      alert(validation.reason || "無効な選択です");
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

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Field Cards - Cards on the table */}
      <div className="bg-slate-800/30 border-2 border-dashed border-amber-500/40 rounded-lg p-3 sm:p-4 mb-2">
        <p className="text-xs text-amber-400 mb-2">場の履歴（左が最新）</p>
        
        {fieldCards.length > 0 ? (
          <div className="flex gap-2 sm:gap-4 overflow-x-auto pt-6 pb-4 snap-x snap-mandatory -mx-1 px-4 items-center" style={{ WebkitOverflowScrolling: 'touch' }}>
            {fieldCards.map((fc: any, recordIdx: number) => {
              const bikes = fc.bikes || [];
              if (bikes.length === 0) return null;
              
              const isLatestRecord = recordIdx === 0;
              const playerLabel = fc.playerId === 0 ? '山札' : fc.playerId === 1 ? 'You' : `P${fc.playerId}`;
              
              // 複数枚出された場合も最新（最後に選択されたもの）を左にするためreverse
              return bikes.slice().reverse().map((bike: any, bikeIdx: number) => {
                const isLatestCard = isLatestRecord && bikeIdx === 0;
                
                return (
                  <div
                    key={`${fc.id}-${bike.id}-${bikeIdx}`}
                    className={`flex-shrink-0 transition-all duration-300 snap-center relative ${
                      isLatestCard ? 'scale-105 z-10' : 'opacity-60 scale-95 hover:opacity-100'
                    }`}
                  >
                    {isLatestCard && (
                      <div className="absolute -top-4 -left-2 bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-1 rounded-full shadow-lg z-20 leading-tight whitespace-nowrap">
                        現在の基準
                      </div>
                    )}
                    <div className="absolute top-2 right-2 z-20">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        fc.playerId === 0 ? 'bg-amber-500/80 text-white' : 
                        fc.playerId === 1 ? 'bg-green-500/80 text-white' : 'bg-slate-600/80 text-white'
                      }`}>{playerLabel}</span>
                    </div>
                    <BikeCard 
                      bike={bike} 
                      size="medium" 
                      activeSpec={declaredSpec}
                    />
                  </div>
                );
              });
            })}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-600 rounded bg-slate-800/50">
            <p className="font-bold text-amber-400 mb-1">場が流れています</p>
            <p className="text-xs">好きなカードを出してください（複数枚可）</p>
          </div>
        )}
      </div>

      {/* Card Selection Area */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 sm:p-4">
        <p className="text-xs text-slate-400 mb-3">
          {isYourTurn ? "カードを選択してください（← 横スクロールできます →）" : "あなたの手札（他のプレイヤーのターン中）"}
        </p>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pt-4 pb-2 snap-x snap-mandatory -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          {playerHand.map((bike: any) => {
            const selectionIndex = selectedCards.indexOf(bike.id);
            const isSelected = selectionIndex !== -1;
            return (
              <div key={bike.id} className="snap-start flex-shrink-0 relative">
                {isSelected && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md z-20">
                    {selectionIndex + 1}
                  </div>
                )}
                <BikeCard
                  bike={bike}
                  isSelected={isSelected}
                  onClick={() => handleCardSelect(bike.id)}
                  size="medium"
                  activeSpec={declaredSpec}
                  showDetails={!isYourTurn}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isYourTurn && (
          <>
            <Button
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs sm:text-sm py-2 sm:py-2.5"
              disabled={selectedCards.length === 0 || isLoading}
              onClick={() => {
                const validation = validateSelection();
                if (validation.valid) {
                  setShowBindDialog(true);
                } else {
                  if (onLog) {
                    onLog(validation.reason || '無効なカードです', 'error');
                  } else {
                    addToast('error', 'エラー', validation.reason || '無効なカードです');
                  }
                }
              }}
            >
              {isLoading ? "処理中..." : `カードを出す (${selectedCards.length}枚)`}
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 text-xs sm:text-sm py-2 sm:py-2.5"
              disabled={isLoading}
              onClick={onPass}
            >
              スキップ
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 text-xs sm:text-sm py-2 sm:py-2.5"
              disabled={isLoading}
              onClick={onDraw}
            >
              山札から引く
            </Button>
          </>
        )}
      </div>

      {/* Bind Declaration Dialog */}
      <Dialog open={showBindDialog} onOpenChange={setShowBindDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-cyan-400">縛りを宣言しますか？</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-2">縛りの種類</p>
              <div className="flex gap-2 flex-wrap">
                {['maker', 'cylinders', 'transmission'].map((type) => (
                  <Button
                    key={type}
                    variant={selectedBindType === type ? 'default' : 'outline'}
                    className={`text-xs sm:text-sm ${selectedBindType === type ? 'bg-cyan-600' : ''}`}
                    onClick={() => {
                      setSelectedBindType(type);
                      if (selectedCards.length > 0) {
                        const firstBike = playerHand.find(b => b.id === selectedCards[0]);
                        if (firstBike) {
                          let value = "";
                          if (type === 'maker') value = firstBike.maker;
                          else if (type === 'cylinders') value = String(firstBike.cylinders);
                          else if (type === 'transmission') value = firstBike.transmission;
                          setSelectedBindValue(value);
                        }
                      }
                    }}
                  >
                    {type === 'maker' ? 'メーカー' : type === 'cylinders' ? '気筒数' : 'AT/MT'}
                  </Button>
                ))}
              </div>
            </div>

            {selectedBindType && (
              <div>
                <p className="text-sm text-slate-400 mb-2">値を入力</p>
                <input
                  type="text"
                  placeholder="例: Honda, 4, AT"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  value={selectedBindValue || ''}
                  onChange={(e) => setSelectedBindValue(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-xs sm:text-sm"
                onClick={handleConfirmBind}
                disabled={!selectedBindType || !selectedBindValue}
              >
                縛りを宣言して出す
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-xs sm:text-sm"
                onClick={() => {
                  setShowBindDialog(false);
                  handlePlayCard();
                }}
              >
                縛りなしで出す
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
