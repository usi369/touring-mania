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
    <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center px-6 py-10 overflow-hidden relative font-sans">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="w-full max-w-sm z-10 flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-black mb-4 animate-bounce uppercase tracking-widest">
            COMING SOON
          </div>
          <h1 className="text-2xl font-black text-white mb-3 leading-tight italic uppercase tracking-tighter">
            System Expansion <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
              Under Development
            </span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            New features are being synced.<br />
            Support development with a Like!
          </p>
        </div>

        {/* Feature List */}
        <div className="w-full space-y-3 mb-8 overflow-y-auto no-scrollbar max-h-[300px] px-1">
          {features.map((f, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center gap-4 group">
              <div className="p-2.5 rounded-lg bg-slate-800 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-black text-[11px] italic uppercase leading-none">{f.title}</h3>
                <p className="text-slate-500 text-[9px] font-bold mt-1 uppercase leading-tight line-clamp-2">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Interaction Section */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleLike}
            disabled={isThanking}
            className={`flex flex-col items-center gap-2 transition-all duration-300 ${isThanking ? 'opacity-80' : 'hover:scale-105 active:scale-95'}`}
          >
            <div className={`p-4 rounded-full border-2 transition-all duration-500 ${isThanking ? 'bg-pink-500 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-110' : 'bg-slate-800 border-slate-700 hover:border-pink-500/50'}`}>
              <Heart className={`w-8 h-8 ${isThanking ? 'text-white fill-white' : 'text-pink-500'}`} />
            </div>
            <span className="text-slate-300 font-black text-sm italic">
              {likeCount} <span className="text-[10px] font-bold text-slate-500 uppercase not-italic">Likes</span>
            </span>
          </button>

          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-slate-600 hover:text-white flex items-center gap-2 mt-2 text-[10px] font-black tracking-widest uppercase"
          >
            <ArrowLeft className="w-3 h-3" />
            BACK TO TOP
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
