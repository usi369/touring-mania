import { motion, AnimatePresence } from "framer-motion";
import { Activity, User, Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreBoardProps {
  scores: Record<number, number>; // playerId -> score (remaining cards usually)
  playerCount: number;
  currentRound: number;
  activePlayerId?: number;
}

/**
 * ScoreBoard - Live Ranking Feed.
 * Logical design: Real-time telemetry. Turn abstract scores into stakes.
 */
export default function ScoreBoard({
  scores,
  playerCount,
  currentRound,
  activePlayerId,
}: ScoreBoardProps) {
  const getPlayerName = (playerId: number) => {
    return playerId === 1 ? "YOU" : `P${playerId}`;
  };

  const players = Array.from({ length: playerCount }, (_, i) => {
    const id = i + 1;
    return {
      id,
      name: getPlayerName(id),
      score: scores[id] || 0,
      isActive: id === activePlayerId,
    };
  }).sort((a, b) => a.score - b.score); // Assuming lower (remaining cards) is better

  return (
    <div className="flex flex-col gap-2 w-full font-mono">
      {/* Header Info */}
      <div className="flex justify-between items-center px-1 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[9px] font-black text-white italic tracking-widest uppercase">Live_Ranking</span>
        </div>
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Round // {currentRound.toString().padStart(2, '0')}</span>
      </div>

      {/* Player Slots */}
      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "relative flex items-center justify-between p-2 rounded-lg border transition-all duration-300",
                player.isActive 
                  ? "bg-cyan-600/20 border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.1)]" 
                  : "bg-slate-900/60 border-white/5 opacity-80"
              )}
            >
              {/* Rank Badge */}
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-[10px] font-black italic w-4",
                  index === 0 ? "text-amber-400" : "text-slate-600"
                )}>
                  #{index + 1}
                </span>
                
                <div className="flex flex-col">
                  <span className={cn(
                    "text-[10px] font-black leading-none",
                    player.isActive ? "text-white" : "text-slate-400"
                  )}>
                    {player.name}
                  </span>
                  {player.isActive && (
                    <span className="text-[6px] font-bold text-cyan-400 uppercase tracking-tighter mt-0.5">Active_Sync</span>
                  )}
                </div>
              </div>

              {/* Score / Remaining Cards */}
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black italic text-white leading-none">{player.score}</span>
                  <span className="text-[7px] font-bold text-slate-600 uppercase tracking-tighter">Cards</span>
                </div>
                {/* Progress Bar (Visualized remaining) */}
                <div className="w-12 h-0.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: `${(player.score / 13) * 100}%` }}
                    className={cn(
                      "h-full transition-all",
                      player.score <= 3 ? "bg-pink-500 shadow-[0_0_5px_rgba(236,72,153,0.5)]" : "bg-cyan-500"
                    )}
                  />
                </div>
              </div>

              {player.isActive && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400 shadow-[0_0_8px_cyan]" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
