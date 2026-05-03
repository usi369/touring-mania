import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Heart, ArrowLeft, Bike, Trophy, BookOpen, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ComingSoon() {
  const [, setLocation] = useLocation();
  const [isThanking, setIsThanking] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const likesQuery = trpc.social.getLikes.useQuery();
  const likeMutation = trpc.social.incrementLike.useMutation({
    onSuccess: (newCount) => {
      setLikeCount(newCount);
    }
  });

  useEffect(() => {
    if (likesQuery.data !== undefined) {
      setLikeCount(likesQuery.data);
    }
  }, [likesQuery.data]);

  const handleLike = () => {
    if (isThanking) return;
    
    setIsThanking(true);
    likeMutation.mutate();
    
    toast.success("いいね！ありがとうございます！開発の励みになります。");
    
    // Lock for 3 seconds to match toast visibility
    setTimeout(() => {
      setIsThanking(false);
    }, 3000);
  };

  const features = [
    {
      title: "マイバイクの登録",
      description: "自分のお気に入りの一台を愛車として登録できます。",
      icon: <Bike className="w-6 h-6 text-cyan-400" />,
    },
    {
      title: "ランキングの登録",
      description: "全国のプレイヤーと勝利数を競い合いましょう。",
      icon: <Trophy className="w-6 h-6 text-yellow-400" />,
    },
    {
      title: "勝利したバイクの図鑑確認",
      description: "バトルで勝利したバイクをコレクションとして収集できます。",
      icon: <BookOpen className="w-6 h-6 text-pink-400" />,
    },
    {
      title: "プレイヤー同士の勝負",
      description: "CPUではなく、リアルタイムで友達や他プレイヤーと対戦！",
      icon: <Users className="w-6 h-6 text-purple-400" />,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4 py-12 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="w-full max-w-lg z-10">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-4 animate-bounce">
            COMING SOON
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            ログイン機能・新機能 <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
              絶賛開発中です！
            </span>
          </h1>
          <p className="text-slate-400 text-base">
            ログインすると以下のことができるようになります。<br />
            いいねボタンを押して待っててね。
          </p>
        </div>

        {/* Feature List */}
        <div className="grid gap-4 mb-10">
          {features.map((f, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-slate-700/50 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm sm:text-base">{f.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm">{f.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Interaction Section */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleLike}
            disabled={isThanking}
            className={`flex flex-col items-center gap-2 transition-all duration-300 ${isThanking ? 'opacity-80' : 'hover:scale-105 active:scale-95'}`}
          >
            <div className={`p-6 rounded-full border-2 transition-all duration-500 ${isThanking ? 'bg-pink-500 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-110' : 'bg-slate-800 border-slate-700 hover:border-pink-500/50'}`}>
              <Heart className={`w-10 h-10 ${isThanking ? 'text-white fill-white' : 'text-pink-500'}`} />
            </div>
            <span className="text-slate-300 font-bold text-lg">
              {likeCount} <span className="text-sm font-normal text-slate-500">Likes</span>
            </span>
            {isThanking && (
              <span className="text-[10px] text-pink-400 font-bold animate-pulse">Thank you!</span>
            )}
          </button>

          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-slate-400 hover:text-white flex items-center gap-2 mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            トップ画面へ戻る
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
