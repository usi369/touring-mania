import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import GameButton from "./ui/GameButton";

interface DiceRollDialogProps {
  playerCount: number;
  onRollComplete: (diceRolls: Record<number, number>, turnOrder: number[], declarationPlayer: number) => void;
  isOpen: boolean;
}

interface PlayerDice {
  playerId: number;
  playerName: string;
  diceValue: number;
  isRolling: boolean;
  isTied: boolean;
  isEliminated: boolean;
}

/**
 * DiceRollDialog - Impact-driven turn determination.
 * Logical design: Use physical shock and anticipation to frame "Luck".
 */
export default function DiceRollDialog({
  playerCount,
  onRollComplete,
  isOpen,
}: DiceRollDialogProps) {
  const [playerDices, setPlayerDices] = useState<PlayerDice[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [rerollMessage, setRerollMessage] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  
  const controls = useAnimation();

  useEffect(() => {
    if (isOpen) {
      const players: PlayerDice[] = [];
      for (let i = 1; i <= playerCount; i++) {
        players.push({
          playerId: i,
          playerName: i === 1 ? "YOU" : `P${i}`,
          diceValue: 0,
          isRolling: false,
          isTied: false,
          isEliminated: false,
        });
      }
      setPlayerDices(players);
      setShowResults(false);
      setRerollMessage(null);
      setResolved(false);
    }
  }, [isOpen, playerCount]);

  const triggerShake = async () => {
    await controls.start({
      x: [-2, 2, -2, 2, 0],
      transition: { duration: 0.2 }
    });
  };

  const rollForPlayers = useCallback((playersToRoll: PlayerDice[], allPlayers: PlayerDice[]) => {
    setIsRolling(true);
    setShowResults(false);
    setRerollMessage(null);

    setPlayerDices(
      allPlayers.map((p) => ({
        ...p,
        isRolling: playersToRoll.some((r) => r.playerId === p.playerId),
        isTied: false,
      }))
    );

    // Fast rolling visual
    const rollInterval = setInterval(() => {
      setPlayerDices((prev) =>
        prev.map((p) => {
          if (!p.isRolling) return p;
          return { ...p, diceValue: Math.floor(Math.random() * 6) + 1 };
        })
      );
    }, 80);

    setTimeout(() => {
      clearInterval(rollInterval);
      triggerShake(); // Impact!

      const finalValues: Record<number, number> = {};
      playersToRoll.forEach((p) => {
        finalValues[p.playerId] = Math.floor(Math.random() * 6) + 1;
      });

      setPlayerDices((prev) => {
        const updated = prev.map((p) => ({
          ...p,
          isRolling: false,
          diceValue: finalValues[p.playerId] !== undefined ? finalValues[p.playerId] : p.diceValue,
        }));

        const activePlayers = updated.filter((p) => !p.isEliminated);
        const maxValue = Math.max(...activePlayers.map((p) => p.diceValue));
        const tiedPlayers = activePlayers.filter((p) => p.diceValue === maxValue);

        if (tiedPlayers.length > 1) {
          const withTies = updated.map((p) => ({
            ...p,
            isTied: tiedPlayers.some((t) => t.playerId === p.playerId),
          }));

          setPlayerDices(withTies);
          setShowResults(true);
          setIsRolling(false);
          setRerollMessage("TIE DETECTED - REROLLING SECONDS...");

          setTimeout(() => {
            const nextAll = withTies.map((p) => ({
              ...p,
              isEliminated: p.isEliminated || (!tiedPlayers.some((t) => t.playerId === p.playerId) && !p.isEliminated && activePlayers.some((a) => a.playerId === p.playerId)),
              isTied: false,
            }));
            const nextRollers = nextAll.filter(p => tiedPlayers.some(t => t.playerId === p.playerId));
            rollForPlayers(nextRollers, nextAll);
          }, 2000);
        } else {
          setShowResults(true);
          setIsRolling(false);
          setResolved(true);
        }
        return updated;
      });
    }, 1200);
  }, [controls]);

  const handleRollDice = () => {
    if (resolved) {
      const activePlayers = playerDices.filter((p) => !p.isEliminated);
      const maxValue = Math.max(...activePlayers.map((p) => p.diceValue));
      const diceRolls: Record<number, number> = {};
      playerDices.forEach((p) => { diceRolls[p.playerId] = p.diceValue; });
      const winner = activePlayers.find((p) => p.diceValue === maxValue)!;
      const others = playerDices.filter((p) => p.playerId !== winner.playerId).sort((a, b) => b.diceValue - a.diceValue);
      const turnOrder = [winner.playerId, ...others.map((p) => p.playerId)];
      onRollComplete(diceRolls, turnOrder, turnOrder[0]);
      return;
    }
    rollForPlayers(playerDices, playerDices);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl overflow-hidden font-sans">
      
      {/* 1. Arena Header */}
      <div className="text-center mb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-500 text-[9px] font-black tracking-[0.4em] uppercase mb-4"
        >
          Priority Conflict
        </motion.div>
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
          Determine <span className="text-cyan-400">Order</span>
        </h2>
      </div>

      {/* 2. Dice Pit */}
      <motion.div 
        animate={controls}
        className="w-full max-w-sm grid grid-cols-2 gap-4 mb-8"
      >
        <AnimatePresence mode="popLayout">
          {playerDices.filter(p => !p.isEliminated).map((player) => (
            <motion.div
              key={player.playerId}
              layout
              initial={{ scale: 0, y: -100, rotate: -45 }}
              animate={{ 
                scale: 1, y: 0, rotate: 0,
                borderColor: player.isTied ? "rgba(234,179,8,0.5)" : "rgba(34,211,238,0.2)"
              }}
              className={`relative bg-slate-900/60 border-2 rounded-3xl p-5 flex flex-col items-center justify-center aspect-square shadow-2xl overflow-hidden ${player.isTied ? 'bg-yellow-500/5' : ''}`}
            >
              {/* Background Rank Number */}
              <span className="absolute -bottom-4 -right-2 text-6xl font-black text-white/5 italic select-none">#{player.playerId}</span>
              
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 z-10">{player.playerName}</p>
              
              <div className="relative h-20 w-20 flex items-center justify-center z-10">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={player.diceValue}
                    initial={{ y: player.isRolling ? 0 : 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`text-6xl font-black italic tracking-tighter ${player.isRolling ? 'text-cyan-500 animate-pulse' : player.isTied ? 'text-yellow-400' : 'text-white'}`}
                    style={{ textShadow: player.isRolling ? '0 0 20px rgba(34,211,238,0.4)' : 'none' }}
                  >
                    {player.diceValue || "?"}
                  </motion.span>
                </AnimatePresence>
              </div>

              {player.isTied && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-yellow-500/10 pointer-events-none"
                >
                   <div className="px-2 py-0.5 bg-yellow-500 text-slate-950 text-[8px] font-black uppercase rounded transform -rotate-12">Conflict</div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* 3. Feedback and Action */}
      <div className="w-full max-w-sm space-y-6">
        <AnimatePresence mode="wait">
          {rerollMessage ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
              <p className="text-[10px] font-bold text-yellow-200 uppercase tracking-tight leading-tight">{rerollMessage}</p>
            </motion.div>
          ) : resolved ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl flex items-center justify-center gap-3"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <p className="text-[10px] font-black text-cyan-100 uppercase tracking-widest">Sequence Confirmed</p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <GameButton
          onClick={handleRollDice}
          disabled={isRolling}
          variant={resolved ? "primary" : "secondary"}
          className="w-full py-4 text-sm"
        >
          {isRolling ? "CALCULATING..." : resolved ? "INITIALIZE MATCH" : "INITIATE ROLL"}
        </GameButton>
      </div>

      {/* Static Juice Decorations */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
    </div>
  );
}
