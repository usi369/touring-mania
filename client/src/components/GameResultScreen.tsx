import { RotateCcw, Home, Trophy, Sparkles, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GameButton from "./ui/GameButton";

export interface PlayerRanking {
  playerId: number;
  name: string;
  remainingCards: number;
  rank: number;
}

interface GameResultScreenProps {
  rankings: PlayerRanking[];
  playerCount: number;
  onReplay: () => void;
  onHome: () => void;
}

/**
 * GameResultScreen - Climactic finish of the game loop.
 * Logical design: Peak-End Rule. Maximize the memory of victory or the weight of defeat.
 */
export default function GameResultScreen({
  rankings,
  playerCount,
  onReplay,
  onHome,
}: GameResultScreenProps) {
  const winner = rankings.find(r => r.rank === 1);
  const isYouWinner = winner ? winner.playerId === 1 || winner.name === "You" : false;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl overflow-hidden font-sans">
      
      {/* 1. Victory / Defeat Atmosphere */}
      <AnimatePresence>
        {isYouWinner ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none z-0"
          >
            {/* Burst of particles (Simplified for stage) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-bounce" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="absolute inset-0 pointer-events-none z-0 bg-red-950/20 mix-blend-multiply"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        
        {/* 2. Headline Animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="mb-8"
        >
          {isYouWinner ? (
            <div className="flex flex-col items-center">
              <Trophy className="w-24 h-24 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] mb-4" />
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 italic tracking-tighter uppercase leading-none">
                VICTORY!
              </h1>
              <p className="text-[10px] font-black text-amber-500/80 tracking-[0.4em] uppercase mt-2">Champion Synchronized</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <AlertTriangle className="w-20 h-20 text-slate-700 mb-4" />
              <h1 className="text-6xl font-black text-slate-600 italic tracking-tighter uppercase leading-none grayscale">
                DEFEATED
              </h1>
              <p className="text-[10px] font-black text-slate-500/80 tracking-[0.4em] uppercase mt-2">Data Desynchronized</p>
            </div>
          )}
        </motion.div>

        {/* 3. Ranking Board */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full bg-slate-900/60 border-2 border-white/5 rounded-3xl p-5 mb-8 shadow-2xl backdrop-blur-md"
        >
          <div className="space-y-3">
            {rankings.map((player, idx) => (
              <motion.div
                key={player.playerId}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  player.rank === 1 
                    ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                    : 'bg-slate-950/40 border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-xl font-black italic ${player.rank === 1 ? 'text-cyan-400' : 'text-slate-600'}`}>
                    #{player.rank}
                  </span>
                  <span className={`text-xs font-black uppercase ${player.rank === 1 ? 'text-white' : 'text-slate-400'}`}>
                    {player.name}
                  </span>
                </div>
                {player.rank === 1 && <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 4. Actions */}
        <div className="w-full space-y-3">
          <GameButton onClick={onReplay} variant="primary" className="w-full py-5 text-sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            RE-INITIALIZE
          </GameButton>
          <GameButton onClick={onHome} variant="secondary" className="w-full py-4 text-xs">
            <Home className="w-4 h-4 mr-2" />
            BACK TO HUB
          </GameButton>
        </div>

      </div>

      {/* Glitch lines for defeat */}
      {!isYouWinner && (
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/3 left-0 w-full h-[1px] bg-red-500/50 animate-glitch" />
          <div className="absolute top-2/3 left-0 w-full h-[1px] bg-red-500/30 animate-glitch-delayed" />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes glitch {
          0% { transform: translateY(0); }
          10% { transform: translateY(10px); }
          20% { transform: translateY(-5px); }
          100% { transform: translateY(0); }
        }
        .animate-glitch { animation: glitch 4s infinite linear; }
        .animate-glitch-delayed { animation: glitch 5s infinite linear reverse; }
      `}} />
    </div>
  );
}
