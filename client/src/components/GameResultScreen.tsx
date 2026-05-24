import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, RotateCcw, Home } from "lucide-react";
import { useEffect, useState } from "react";

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

const WheelieBikeSVG = () => (
  <svg viewBox="0 0 100 60" className="w-24 h-16 fill-none stroke-cyan-400 stroke-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
    {/* 前輪（浮いている） */}
    <circle cx="75" cy="22" r="10" />
    <circle cx="75" cy="22" r="4" />
    
    {/* 後輪（接地している） */}
    <circle cx="25" cy="48" r="10" />
    <circle cx="25" cy="48" r="4" />
    
    {/* スイングアーム・フレーム・フロントフォーク */}
    <path d="M 25 48 L 40 38 L 60 30 L 75 22" />
    <path d="M 40 38 L 45 22 L 60 22 L 60 30" />
    <path d="M 60 22 L 68 12 C 70 8, 72 8, 74 12 L 75 22" />
    <path d="M 68 12 L 64 15" />
    
    {/* ライダーの簡易シルエット */}
    <circle cx="48" cy="12" r="5" className="fill-cyan-400" />
    <path d="M 48 17 C 46 22, 44 26, 44 32 L 56 30 L 52 17 Z" className="fill-cyan-400" />
    <path d="M 48 17 L 62 16" />
    <path d="M 44 32 L 35 44" />
    
    {/* マフラーからのアフターファイア */}
    <path d="M 12 44 L 2 46 L 8 49 L 0 52 L 10 52 Z" className="fill-pink-500 stroke-none animate-pulse" />
  </svg>
);

export default function GameResultScreen({
  rankings,
  playerCount,
  onReplay,
  onHome,
}: GameResultScreenProps) {
  const winner = rankings.find(r => r.rank === 1);
  const isYouWinner = winner ? winner.playerId === 1 || winner.name === "You" : false;

  const [speed, setSpeed] = useState(0);
  const [rpm, setRpm] = useState(0);

  useEffect(() => {
    if (!isYouWinner) return;

    let speedStart = 0;
    const speedTarget = 300;
    const speedDuration = 1800; // 1.8秒かけて上昇
    const speedStepTime = 20;
    const speedIncrement = speedTarget / (speedDuration / speedStepTime);

    let rpmStart = 0;
    const rpmTarget = 12500;
    const rpmDuration = 1800;
    const rpmStepTime = 20;
    const rpmIncrement = rpmTarget / (rpmDuration / rpmStepTime);

    const timer = setInterval(() => {
      speedStart = Math.min(speedTarget, speedStart + speedIncrement);
      rpmStart = Math.min(rpmTarget, rpmStart + rpmIncrement);
      
      let currentRpm = rpmStart;
      if (rpmStart >= rpmTarget - 100) {
        // レブリミット付近で激しく針が振れる演出
        currentRpm = rpmTarget - 100 - Math.random() * 300;
      }

      setSpeed(Math.floor(speedStart));
      setRpm(Math.floor(currentRpm));
    }, speedStepTime);

    return () => clearInterval(timer);
  }, [isYouWinner]);

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
      {/* 巨大チェッカーフラッグはためき背景 */}
      {isYouWinner && (
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay scale-125"
          style={{
            backgroundImage: `linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff), 
                              linear-gradient(45deg, #fff 25%, #000 25%, #000 75%, #fff 75%, #fff)`,
            backgroundSize: "60px 60px",
            backgroundPosition: "0 0, 30px 30px",
            animation: "flag-wave 8s linear infinite"
          }}
        />
      )}

      {/* 背景のライトストリーク（流星ネオンロード） */}
      {isYouWinner && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
          {[...Array(12)].map((_, i) => {
            const left = 5 + (i * 8.5);
            const delay = Math.random() * 3;
            const duration = 0.8 + Math.random() * 1.2;
            const colors = ["bg-cyan-500", "bg-pink-500", "bg-yellow-400", "bg-indigo-500"];
            const color = colors[i % colors.length];
            const width = Math.random() * 1.5 + 1;
            return (
              <div
                key={i}
                className={`absolute ${color} blur-[1px] rounded-full`}
                style={{
                  left: `${left}%`,
                  width: `${width}px`,
                  height: "200px",
                  top: "-200px",
                  transformOrigin: "top center",
                  animation: `light-streak ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
          {/* 道路のセンターライン風パース */}
          <div className="absolute left-1/2 bottom-0 w-[600px] h-[500px] -translate-x-1/2 origin-bottom scale-y-[0.25] pointer-events-none opacity-[0.07] z-0">
            <div 
              className="w-full h-full"
              style={{
                background: "repeating-linear-gradient(to top, transparent, transparent 50px, #fff 50px, #fff 100px)",
                clipPath: "polygon(48% 0, 52% 0, 100% 100%, 0 100%)"
              }}
            />
          </div>
        </div>
      )}

      {/* アフターファイア・スパーク（排気火花） */}
      {isYouWinner && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* 左側のマフラー位置想定 */}
          {[...Array(15)].map((_, i) => {
            const size = Math.random() * 2.5 + 1.5;
            const delay = Math.random() * 1.5;
            const duration = 0.6 + Math.random() * 0.6;
            const colors = ["bg-cyan-400", "bg-yellow-300", "bg-orange-500", "bg-pink-500"];
            const color = colors[Math.floor(Math.random() * colors.length)];
            return (
              <div
                key={`spark-l-${i}`}
                className={`absolute rounded-full ${color} shadow-[0_0_6px_currentColor]`}
                style={{
                  left: "32%",
                  top: "22%",
                  width: `${size}px`,
                  height: `${size}px`,
                  opacity: 0,
                  animation: `exhaust-spark-left ${duration}s ease-out infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
          {/* 右側のマフラー位置想定 */}
          {[...Array(15)].map((_, i) => {
            const size = Math.random() * 2.5 + 1.5;
            const delay = Math.random() * 1.5;
            const duration = 0.6 + Math.random() * 0.6;
            const colors = ["bg-cyan-400", "bg-yellow-300", "bg-orange-500", "bg-pink-500"];
            const color = colors[Math.floor(Math.random() * colors.length)];
            return (
              <div
                key={`spark-r-${i}`}
                className={`absolute rounded-full ${color} shadow-[0_0_6px_currentColor]`}
                style={{
                  left: "68%",
                  top: "22%",
                  width: `${size}px`,
                  height: `${size}px`,
                  opacity: 0,
                  animation: `exhaust-spark-right ${duration}s ease-out infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* ウィリー走行するバイクの疾走演出 */}
      {isYouWinner && (
        <div className="absolute bottom-16 left-0 w-full overflow-hidden pointer-events-none z-10 h-20">
          <div className="absolute animate-[bike-wheelie-pass_6s_linear_infinite]">
            <WheelieBikeSVG />
          </div>
        </div>
      )}

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
        {/* デジタルダッシュボード（スピードメーター＆タコメーター） */}
        {isYouWinner && (
          <div className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden backdrop-blur-xs z-20 mb-6 select-none animate-[zoom-glow_0.8s_cubic-bezier(0.34,1.56,0.64,1)_both]">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-pink-500 to-yellow-500"></div>
            <div className="flex justify-between items-end gap-2">
              {/* スピードメーター */}
              <div className="text-left">
                <p className="text-[9px] font-bold text-cyan-400 tracking-wider">SPEED</p>
                <div className="flex items-baseline gap-0.5 mt-0.5">
                  <span className="text-4xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                    {speed}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono font-black">km/h</span>
                </div>
              </div>
              
              {/* シフトインジケーター */}
              <div className="flex flex-col items-center mb-1">
                <div className={`w-2.5 h-2.5 rounded-full mb-0.5 transition-colors duration-100 ${speed >= 300 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-slate-800'}`}></div>
                <span className={`text-[8px] font-bold px-1 py-0.2 rounded scale-90 ${speed >= 300 ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                  {speed >= 300 ? 'REV LIMIT' : 'FULL ACCEL'}
                </span>
              </div>

              {/* タコメーター */}
              <div className="text-right">
                <p className="text-[9px] font-bold text-pink-400 tracking-wider">ENGINE</p>
                <div className="flex items-baseline gap-0.5 mt-0.5 justify-end">
                  <span className="text-2xl font-black text-white font-mono tracking-tight">
                    {rpm.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 font-mono font-black">rpm</span>
                </div>
              </div>
            </div>
            
            {/* タコメーターのLEDバーグラフ */}
            <div className="w-full bg-slate-900 h-2 rounded-full mt-2 overflow-hidden p-[1px] border border-slate-850 flex gap-[2px]">
              {[...Array(16)].map((_, idx) => {
                const percent = (idx + 1) / 16;
                const currentPercent = rpm / 13000;
                const isActive = percent <= currentPercent;
                let color = "bg-slate-800";
                if (isActive) {
                  if (percent < 0.6) color = "bg-cyan-500 shadow-[0_0_4px_rgba(6,182,212,0.5)]";
                  else if (percent < 0.85) color = "bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.5)]";
                  else color = "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]";
                }
                return (
                  <div 
                    key={idx} 
                    className={`flex-1 h-full rounded-xs transition-all duration-75 ${color}`}
                  />
                );
              })}
            </div>
          </div>
        )}

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
        @keyframes light-streak {
          0% {
            transform: translateY(-200px) scaleY(0.5);
            opacity: 0;
          }
          20% {
            opacity: 0.6;
          }
          80% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(120vh) scaleY(2);
            opacity: 0;
          }
        }
        @keyframes exhaust-spark-left {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-180px, -80px) scale(0.1);
            opacity: 0;
          }
        }
        @keyframes exhaust-spark-right {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(180px, -80px) scale(0.1);
            opacity: 0;
          }
        }
        @keyframes bike-wheelie-pass {
          0% {
            transform: translateX(-150px) scale(0.85);
            opacity: 0;
          }
          5% {
            opacity: 0.85;
          }
          95% {
            opacity: 0.85;
          }
          100% {
            transform: translateX(110vw) scale(0.85);
            opacity: 0;
          }
        }
        @keyframes flag-wave {
          0% {
            transform: translate(0, 0) skewX(-12deg) rotate(-6deg);
            background-position: 0 0, 30px 30px;
          }
          50% {
            transform: translate(-30px, 15px) skewX(-14deg) rotate(-5deg);
            background-position: 150px 75px, 180px 105px;
          }
          100% {
            transform: translate(0, 0) skewX(-12deg) rotate(-6deg);
            background-position: 300px 150px, 330px 180px;
          }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
