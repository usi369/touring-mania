import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, RotateCcw, Home } from "lucide-react";

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

export default function GameResultScreen({
  rankings,
  playerCount,
  onReplay,
  onHome,
}: GameResultScreenProps) {
  const winner = rankings.find(r => r.rank === 1);
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Trophy Animation */}
        <div className="text-center mb-8">
          <div className="inline-block text-6xl mb-4 animate-bounce">
            <Trophy className="w-24 h-24 text-yellow-400" />
          </div>
        </div>

        {/* Result Card */}
        <Card className="bg-slate-800/80 border-slate-700 mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
              ゲーム終了！
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-3 mt-4">
              {rankings.map((player) => (
                <div 
                  key={player.playerId}
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border ${
                    player.rank === 1 
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-yellow-500/50'
                      : 'bg-slate-800/60 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg sm:text-xl font-bold w-8 ${
                      player.rank === 1 ? 'text-yellow-400' :
                      player.rank === 2 ? 'text-slate-300' :
                      player.rank === 3 ? 'text-amber-600' : 'text-slate-500'
                    }`}>
                      {player.rank}位
                    </span>
                    <span className={`font-semibold ${player.rank === 1 ? 'text-white' : 'text-slate-300'}`}>
                      {player.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm ${player.remainingCards === 0 ? 'text-yellow-400 font-bold' : 'text-slate-400'}`}>
                      {player.remainingCards === 0 ? 'あがり！' : `残り ${player.remainingCards} 枚`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Confetti Effect (CSS-based) */}
            <div className="relative h-10 overflow-hidden rounded">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
            <>
              <Button
                className="w-full bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-700 hover:to-pink-700 text-white font-bold py-6 text-lg"
                onClick={onReplay}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                もう一度プレイ
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 py-6 text-lg"
                onClick={onHome}
              >
                <Home className="w-5 h-5 mr-2" />
                ホームへ戻る
              </Button>
            </>
        </div>

        {/* Stats */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 text-center">
            Touring Mania - バイクスペック比較ゲーム
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 1;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
