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
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">プレイヤー選択</h1>
        <p className="text-slate-400">何人でプレイしますか？</p>
      </div>

      {/* Player Count Options */}
      <div className="w-full max-w-sm space-y-4 mb-8">
        {/* 2 Players */}
        <button
          onClick={() => handleStartGame(2)}
          disabled={selectedPlayers === 2 || createGameMutation.isPending}
          className="w-full p-6 bg-slate-800/50 border-2 border-cyan-500/30 hover:border-cyan-500 rounded-lg transition-all duration-300 hover:bg-slate-800 disabled:opacity-75"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xl font-bold text-white">2人</p>
              <p className="text-sm text-slate-400">あなた vs CPU</p>
            </div>
            <div className="text-3xl">👤👤</div>
          </div>
        </button>

        {/* 3 Players */}
        <button
          onClick={() => handleStartGame(3)}
          disabled={selectedPlayers === 3 || createGameMutation.isPending}
          className="w-full p-6 bg-slate-800/50 border-2 border-pink-500/30 hover:border-pink-500 rounded-lg transition-all duration-300 hover:bg-slate-800 disabled:opacity-75"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xl font-bold text-white">3人</p>
              <p className="text-sm text-slate-400">あなた + CPU 2人</p>
            </div>
            <div className="text-3xl">👤👤👤</div>
          </div>
        </button>

        {/* 4 Players */}
        <button
          onClick={() => handleStartGame(4)}
          disabled={selectedPlayers === 4 || createGameMutation.isPending}
          className="w-full p-6 bg-slate-800/50 border-2 border-purple-500/30 hover:border-purple-500 rounded-lg transition-all duration-300 hover:bg-slate-800 disabled:opacity-75"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xl font-bold text-white">4人</p>
              <p className="text-sm text-slate-400">あなた + CPU 3人</p>
            </div>
            <div className="text-3xl">👤👤👤👤</div>
          </div>
        </button>
      </div>

      {/* Back Button */}
      <Button
        onClick={() => setLocation("/")}
        variant="outline"
        className="w-full max-w-sm border-slate-600 text-slate-300 hover:bg-slate-800"
      >
        戻る
      </Button>

      {/* Game Rules Info */}
      <div className="mt-12 w-full max-w-sm bg-slate-800/30 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-bold text-cyan-400 mb-2">ゲームルール</h3>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• 各プレイヤーに13枚のカードが配られます</li>
          <li>• 前のラウンドの勝者がスペックを宣言します</li>
          <li>• 最後まで生き残ったプレイヤーが勝者です</li>
        </ul>
      </div>
    </div>
  );
}
