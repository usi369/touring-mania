import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Game Setup Screen - Player Count Selection
 */
export default function GameSetup() {
  const [, setLocation] = useLocation();
  const [selectedPlayers, setSelectedPlayers] = useState<number | null>(null);
  const createGameMutation = trpc.game.create.useMutation();

  const handleStartGame = async (playerCount: number) => {
    setSelectedPlayers(playerCount);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const edition = (searchParams.get('edition') || 'r7_starter') as "r7_starter" | "tokyo_remake" | "r6_complete" | "r7_mega";
      const result = await createGameMutation.mutateAsync({ playerCount, edition });
      // Navigate to game board with game ID and new flag
      setLocation(`/game/play?gameId=${result.gameId}&new=true`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast.error("ゲーム作成に失敗しました");
    }
  };

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col items-center px-6 py-10 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-1">PLAYER SELECT</h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.3em] uppercase">How many players?</p>
        </div>

        {/* Player Count Options */}
        <div className="w-full space-y-4">
          {/* 2 Players */}
          <button
            onClick={() => handleStartGame(2)}
            disabled={selectedPlayers === 2 || createGameMutation.isPending}
            className="w-full p-5 bg-slate-900/60 border-2 border-cyan-500/30 hover:border-cyan-500 rounded-2xl transition-all duration-300 group hover:bg-slate-800 disabled:opacity-75 flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-lg font-black text-white italic uppercase leading-none mb-1">2 Players</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">You vs CPU</p>
            </div>
            <div className="text-2xl group-hover:scale-110 transition-transform">👤👤</div>
          </button>

          {/* 3 Players */}
          <button
            onClick={() => handleStartGame(3)}
            disabled={selectedPlayers === 3 || createGameMutation.isPending}
            className="w-full p-5 bg-slate-900/60 border-2 border-pink-500/30 hover:border-pink-500 rounded-2xl transition-all duration-300 group hover:bg-slate-800 disabled:opacity-75 flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-lg font-black text-white italic uppercase leading-none mb-1">3 Players</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">You + CPU 2</p>
            </div>
            <div className="text-2xl group-hover:scale-110 transition-transform">👤👤👤</div>
          </button>

          {/* 4 Players */}
          <button
            onClick={() => handleStartGame(4)}
            disabled={selectedPlayers === 4 || createGameMutation.isPending}
            className="w-full p-5 bg-slate-900/60 border-2 border-purple-500/30 hover:border-purple-500 rounded-2xl transition-all duration-300 group hover:bg-slate-800 disabled:opacity-75 flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-lg font-black text-white italic uppercase leading-none mb-1">4 Players</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">You + CPU 3</p>
            </div>
            <div className="text-2xl group-hover:scale-110 transition-transform">👤👤👤👤</div>
          </button>
        </div>

        {/* Footer Info & Back */}
        <div className="w-full space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
            <h3 className="text-[10px] font-black text-cyan-400 mb-2 uppercase tracking-widest">Game Rules</h3>
            <ul className="text-[9px] text-slate-500 space-y-1.5 font-bold uppercase leading-relaxed">
              <li>• 13 Cards per player</li>
              <li>• Prev winner declares spec</li>
              <li>• Last survivor wins</li>
            </ul>
          </div>

          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="w-full text-slate-600 hover:text-white text-[10px] font-black tracking-[0.4em] uppercase"
          >
            BACK TO MENU
          </Button>
        </div>
      </div>
    </div>
  );
}
