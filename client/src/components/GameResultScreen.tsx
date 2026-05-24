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
  const isYouWinner = winner ? winner.playerId === 1 || winner.name === "You" : false;

  // 1位（You）の時だけ豪華な紙吹雪パーティクルを生成
  const confettiParticles = isYouWinner
    ? [...Array(100)].map((_, i) => {
        const size = Math.random() * 8 + 4; // 4px to 12px
        const colors = [
          "from-cyan-400 to-cyan-500",
          "from-pink-500 to-pink-600",
          "from-yellow-400 to-amber-500",
          "from-purple-500 to-purple-600",
          "from-slate-100 to-slate-200", // 白
          "from-slate-900 to-black",     // 黒
        ];
        const colorClass = colors[Math.floor(Math.random() * colors.length)];
        return {
          id: i,
          size,
          colorClass,
          left: Math.random() * 100, // %
          delay: Math.random() * 6, // seconds
          duration: 2.5 + Math.random() * 3.5, // seconds
          rotation: Math.random() * 360,
        };
      })
    : [];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* 画面全体の紙吹雪演出 */}
      {isYouWinner && (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
          {confettiParticles.map((p) => (
            <div
              key={p.id}
              className={`absolute rounded-xs bg-gradient-to-br ${p.colorClass} shadow-md`}
              style={{
                width: `${p.size}px`,
                height: `${p.size * 1.6}px`,
                left: `${p.left}%`,
                top: `-20px`,
                opacity: 0,
                transform: `rotate(${p.rotation}deg)`,
                animation: `confetti-fall ${p.duration}s linear infinite`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-md z-10 relative">
        {/* Victory/Champion Banner */}
        {isYouWinner && (
          <div className="text-center mb-6 select-none animate-[zoom-glow_0.8s_cubic-bezier(0.34,1.56,0.64,1)_both]">
            <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(234,179,8,0.7)] italic tracking-widest uppercase">
              Victory!
            </h1>
            <p className="text-xs font-bold text-yellow-400/80 tracking-[0.35em] uppercase mt-1">
              🏆 GRAND CHAMPION 🏆
            </p>
          </div>
        )}

        {/* Trophy Animation */}
        <div className="text-center mb-8 relative">
          {isYouWinner && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none opacity-25 mix-blend-screen z-0 animate-[spin_40s_linear_infinite]"
              style={{
                background: "conic-gradient(from 0deg, transparent 0deg 10deg, #eab308 10deg 20deg, transparent 20deg 30deg, #eab308 30deg 40deg, transparent 40deg 50deg, #eab308 50deg 60deg, transparent 60deg 70deg, #eab308 70deg 80deg, transparent 80deg 90deg, #eab308 90deg 100deg, transparent 100deg 110deg, #eab308 110deg 120deg, transparent 120deg 130deg, #eab308 130deg 140deg, transparent 140deg 150deg, #eab308 150deg 160deg, transparent 160deg 170deg, #eab308 170deg 180deg, transparent 180deg 190deg, #eab308 190deg 200deg, transparent 200deg 210deg, #eab308 210deg 220deg, transparent 220deg 230deg, #eab308 230deg 240deg, transparent 240deg 250deg, #eab308 250deg 260deg, transparent 260deg 270deg, #eab308 270deg 280deg, transparent 280deg 290deg, #eab308 290deg 300deg, transparent 300deg 310deg, #eab308 310deg 320deg, transparent 320deg 330deg, #eab308 330deg 340deg, transparent 340deg 350deg, #eab308 350deg 360deg)"
              }}
            />
          )}
          <div className={`inline-block text-6xl mb-2 relative z-10 ${isYouWinner ? 'animate-[bounce_1.4s_infinite] drop-shadow-[0_0_30px_rgba(234,179,8,0.9)] scale-110' : 'animate-bounce'}`}>
            <Trophy className={`w-24 h-24 ${isYouWinner ? 'text-yellow-400 stroke-[2.5px]' : 'text-yellow-500'}`} />
          </div>
        </div>

        {/* Result Card */}
        <Card className={`bg-slate-900/90 border-slate-800 mb-6 relative overflow-hidden shadow-2xl ${
          isYouWinner ? 'border-yellow-500/30 shadow-[0_0_40px_rgba(234,179,8,0.18)]' : ''
        }`}>
          {/* レーシングチェッカーフラッグボーダー */}
          {isYouWinner && (
            <div 
              className="h-2.5 w-full shrink-0" 
              style={{ 
                backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), 
                                  linear-gradient(45deg, #000 25%, #fff 25%, #fff 75%, #000 75%, #000)`,
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 8px 8px",
                backgroundColor: "#000"
              }}
            />
          )}
          <CardHeader className="text-center pt-5 pb-3">
            <CardTitle className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent italic tracking-wider">
              ゲーム終了！
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6 pb-6">
            <div className="space-y-3">
              {rankings.map((player) => {
                const isFirst = player.rank === 1;
                return (
                  <div 
                    key={player.playerId}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-all duration-300 ${
                      isFirst 
                        ? 'bg-gradient-to-r from-yellow-500/30 via-amber-500/20 to-yellow-500/10 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.35)] scale-[1.02] z-10'
                        : 'bg-slate-950/60 border-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg sm:text-xl font-black w-8 italic ${
                        player.rank === 1 ? 'text-yellow-400' :
                        player.rank === 2 ? 'text-slate-300' :
                        player.rank === 3 ? 'text-amber-600' : 'text-slate-600'
                      }`}>
                        {player.rank}位
                      </span>
                      <span className={`font-bold ${player.rank === 1 ? 'text-white text-base' : 'text-slate-300 text-sm'}`}>
                        {player.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs sm:text-sm ${player.remainingCards === 0 ? 'text-yellow-400 font-black animate-pulse' : 'text-slate-500 font-semibold'}`}>
                        {player.remainingCards === 0 ? 'あがり！' : `残り ${player.remainingCards} 枚`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-pink-500 hover:from-cyan-400 hover:via-blue-500 hover:to-pink-400 text-white font-black py-6 text-lg rounded-xl shadow-lg hover:shadow-[0_0_25px_rgba(34,211,238,0.45)] hover:scale-[1.01] transition-all border-none"
            onClick={onReplay}
          >
            <RotateCcw className="w-5 h-5 mr-2 animate-spin-slow" />
            もう一度プレイ
          </Button>
          <Button
            variant="outline"
            className="w-full border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white py-6 text-lg rounded-xl transition-all"
            onClick={onHome}
          >
            <Home className="w-5 h-5 mr-2" />
            ホームへ戻る
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-8 bg-slate-900/40 border border-slate-950 rounded-lg p-4">
          <p className="text-xs text-slate-600 text-center font-bold tracking-wider">
            TOURING MANIA - バイクスペック比較ゲーム
          </p>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg) skewX(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(105dvh) rotate(720deg) skewX(15deg);
            opacity: 0;
          }
        }
        @keyframes zoom-glow {
          0% {
            transform: scale(0.3) rotate(-5deg);
            filter: drop-shadow(0 0 0 rgba(234, 179, 8, 0));
            opacity: 0;
          }
          70% {
            transform: scale(1.1) rotate(2deg);
            filter: drop-shadow(0 0 30px rgba(234, 179, 8, 0.8));
          }
          100% {
            transform: scale(1) rotate(0deg);
            filter: drop-shadow(0 0 15px rgba(234, 179, 8, 0.5));
            opacity: 1;
          }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
