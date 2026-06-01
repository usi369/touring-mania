import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

interface CardDealingPhaseProps {
  playerCount: number;
  onDealingComplete: () => void;
  isOpen: boolean;
}

interface PlayerDealing {
  playerId: number;
  playerName: string;
  cardsDealt: number;
}

/**
 * CardDealingPhase - Kinetic animation for dealing cards.
 * Logical design: Use spatial rhythm to build anticipation.
 */
export default function CardDealingPhase({
  playerCount,
  onDealingComplete,
  isOpen,
}: CardDealingPhaseProps) {
  const [players, setPlayers] = useState<PlayerDealing[]>([]);
  const [isDealing, setIsDealing] = useState(false);
  const [dealingComplete, setDealingComplete] = useState(false);

  useEffect(() => {
    if (isOpen && !isDealing) {
      startDealing();
    }
  }, [isOpen]);

  const startDealing = () => {
    setIsDealing(true);
    setDealingComplete(false);

    const initialPlayers: PlayerDealing[] = [];
    for (let i = 1; i <= playerCount; i++) {
      initialPlayers.push({
        playerId: i,
        playerName: i === 1 ? "YOU" : `PLAYER ${i}`,
        cardsDealt: 0,
      });
    }
    setPlayers(initialPlayers);

    // Sequence of cards flying out
    let cardCount = 0;
    const totalCards = playerCount * 13; // Usually 13 in this game
    
    // Quick deal for visualization, but with enough time to see the kinetic movement
    const dealInterval = setInterval(() => {
      setPlayers(prev => {
        const next = [...prev];
        const playerIdx = cardCount % playerCount;
        next[playerIdx].cardsDealt += 1;
        return next;
      });

      cardCount++;
      if (cardCount >= totalCards) {
        clearInterval(dealInterval);
        setTimeout(() => {
          setIsDealing(false);
          setDealingComplete(true);
          setTimeout(onDealingComplete, 1200);
        }, 500);
      }
    }, 60); // Rapid deal (60ms) for excitement
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden font-sans">
      
      {/* 1. Header (Anticipation) */}
      <div className="text-center mb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-black tracking-[0.3em] uppercase mb-4"
        >
          Initializing Match
        </motion.div>
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase italic leading-none mb-2">
          Syncing <span className="text-cyan-400">Data</span>
        </h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">
          Distributing specs across grid...
        </p>
      </div>

      {/* 2. Dealing Arena */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-4 relative">
        {/* Central Deck (The Source) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="relative w-16 h-24">
            {[0, 1, 2].map(i => (
              <div 
                key={i}
                className="absolute inset-0 bg-slate-900 border-2 border-cyan-500/30 rounded-xl shadow-2xl"
                style={{ transform: `translate(${i * 2}px, ${i * -2}px)` }}
              />
            ))}
            <div className="absolute inset-0 bg-cyan-600 rounded-xl flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin opacity-40" />
            </div>
          </div>
        </div>

        {players.map((player) => (
          <div
            key={player.playerId}
            className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden"
          >
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{player.playerName}</p>
            
            {/* Target Area for flying cards */}
            <div className="relative w-20 h-28 flex items-center justify-center bg-slate-950/60 rounded-xl border-2 border-dashed border-white/5">
              <AnimatePresence>
                {/* Visualizing the stack growing */}
                <motion.div 
                  key={player.cardsDealt}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <span className="text-2xl font-black text-white italic">{player.cardsDealt}</span>
                  <span className="text-[8px] font-bold text-cyan-500/60 uppercase">Records</span>
                </motion.div>
              </AnimatePresence>
              
              {/* Flying Card Effect */}
              {isDealing && (
                <motion.div
                  key={`flying-${player.cardsDealt}`}
                  initial={{ 
                    x: player.playerId % 2 === 0 ? -100 : 100, 
                    y: player.playerId <= 2 ? 100 : -100, 
                    rotate: 45, 
                    scale: 0.5 
                  }}
                  animate={{ x: 0, y: 0, rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute inset-0 bg-cyan-400/20 border-2 border-cyan-400 rounded-xl z-30"
                />
              )}
            </div>

            {player.playerId === 1 && (
              <div className="absolute top-0 right-0 p-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_cyan]" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Completion Feedback */}
      <AnimatePresence>
        {dealingComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute bottom-16 left-6 right-6 p-5 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-2xl border-2 border-cyan-400 shadow-[0_0_30px_rgba(8,145,178,0.4)] flex items-center justify-center gap-3 z-50"
          >
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
            <span className="text-sm font-black text-white italic tracking-widest uppercase">Sync Sequence Complete</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Visual Juice */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />
      </div>
    </div>
  );
}
