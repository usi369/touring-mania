import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import RulesScreen from "@/components/RulesScreen";
import { HelpCircle, BookOpen, User, PlayCircle, LogIn } from "lucide-react";

/**
 * Touring Mania - Title Screen
 * Vertical mobile-first layout with dark theme
 */
const MotorcycleIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    {/* Glow effect for the body */}
    <path 
      d="M2,14 Q2,8 12,8 Q22,8 22,14 L22,16 L2,16 Z" 
      fill="rgba(34, 211, 238, 0.2)" 
    />
    {/* Body shell */}
    <path 
      d="M3,15 Q3,9 12,9 Q21,9 21,15 L21,16 L3,16 Z" 
      fill="currentColor" 
    />
    {/* Front Hubless Wheel (Neon) */}
    <circle cx="18" cy="15" r="4" stroke="#22d3ee" strokeWidth="1.5" />
    <circle cx="18" cy="15" r="2.5" stroke="#22d3ee" strokeWidth="0.5" opacity="0.5" />
    {/* Rear Hubless Wheel (Neon) */}
    <circle cx="6" cy="15" r="4" stroke="#22d3ee" strokeWidth="1.5" />
    <circle cx="6" cy="15" r="2.5" stroke="#22d3ee" strokeWidth="0.5" opacity="0.5" />
    {/* Neon accent line on body */}
    <path 
      d="M7,11 Q12,10 17,11" 
      stroke="#22d3ee" 
      strokeWidth="0.5" 
      strokeLinecap="round" 
    />
  </svg>
);

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showRules, setShowRules] = useState(false);
  const [showTitleSelect, setShowTitleSelect] = useState(false);
  const createGuestSessionMutation = trpc.guest.createSession.useMutation();
  const bikesQuery = trpc.bike.list.useQuery();
  const bikeCount = bikesQuery.data?.length || 0;

  const handleStartGame = () => {
    if (isAuthenticated) {
      setShowTitleSelect(true);
    } else {
      // Redirect to coming soon page as login is not implemented yet
      setLocation("/coming-soon");
    }
  };

  const handleGuestMode = async () => {
    try {
      // Create guest session on server
      await createGuestSessionMutation.mutateAsync();
      // Show title selection
      setShowTitleSelect(true);
    } catch (error) {
      console.error("Error creating guest session:", error);
    }
  };

  const handleTitleSelect = (edition: string) => {
    setShowTitleSelect(false);
    setLocation(`/game/setup?edition=${edition}`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4 py-8">
      {/* Title Section */}
      <div className="flex flex-col items-center justify-center gap-6 mb-12">
        {/* Logo/Title */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 tracking-tight">
            ツーリングマニア
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 text-center font-medium">
          バイクスペックで競う縦型カードゲーム
        </p>
      </div>

      {/* Game Info Section */}
      <div className="w-full max-w-sm bg-slate-800/50 border border-cyan-500/30 rounded-lg p-6 mb-8">
        <div className="text-center mb-6">
          <p className="text-cyan-400 font-bold text-sm tracking-widest uppercase">全4タイトル収録！</p>
          <p className="text-white text-xs opacity-70">東京リメイクから最新R7まで</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <MotorcycleIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">バイクカード</p>
              <p className="text-white font-semibold">{bikeCount || '...'}種類のバイク</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold">
              2-4
            </div>
            <div>
              <p className="text-sm text-slate-400">プレイヤー数</p>
              <p className="text-white font-semibold">2〜4人でプレイ</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
              🤖
            </div>
            <div>
              <p className="text-sm text-slate-400">CPU対戦</p>
              <p className="text-white font-semibold">AIと対戦可能</p>
            </div>
          </div>
        </div>
      </div>

      {/* Start Game Buttons */}
      <div className="w-full max-w-sm space-y-3">
        <Button
          onClick={handleStartGame}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isAuthenticated ? (
            <>
              <PlayCircle className="w-6 h-6 mr-2" />
              ゲーム開始
            </>
          ) : (
            <>
              <LogIn className="w-6 h-6 mr-2" />
              ログインして開始
            </>
          )}
        </Button>

        {/* Guest Mode Button */}
        <Button
          onClick={handleGuestMode}
          disabled={createGuestSessionMutation.isPending}
          variant="outline"
          className="w-full h-12 text-base font-semibold border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300 disabled:opacity-50"
        >
          <User className="w-4 h-4 mr-2" />
          {createGuestSessionMutation.isPending ? "準備中..." : "ゲストでプレイ"}
        </Button>

        {/* Encyclopedia Button */}
        <Button
          onClick={() => setLocation("/encyclopedia")}
          variant="outline"
          className="w-full h-12 text-base font-semibold border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          バイク図鑑
        </Button>

        {/* Rules Button */}
        <Button
          onClick={() => setShowRules(true)}
          variant="outline"
          className="w-full h-12 text-base font-semibold border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          ルール説明
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-slate-400 text-sm">
        <p>バイクのスペックを比較して</p>
        <p>最後まで生き残ろう！</p>
      </div>

      {/* Rules Screen Modal */}
      {showRules && <RulesScreen onClose={() => setShowRules(false)} />}

      {/* Title Selection Modal */}
      {showTitleSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">ゲームタイトル選択</h2>
            <div className="space-y-3">
              <Button
                onClick={() => handleTitleSelect('tokyo_remake')}
                className="w-full h-14 bg-slate-800 hover:bg-slate-700 border-2 border-pink-500/50 text-white font-bold"
              >
                ツーリングマニア東京リメイク
              </Button>
              <Button
                onClick={() => handleTitleSelect('r6_complete')}
                className="w-full h-14 bg-slate-800 hover:bg-slate-700 border-2 border-purple-500/50 text-white font-bold"
              >
                ツーリングマニア バイカーズ R6 コンプリートBOX
              </Button>
              <Button
                onClick={() => handleTitleSelect('r7_mega')}
                className="w-full h-14 bg-slate-800 hover:bg-slate-700 border-2 border-cyan-500/50 text-white font-bold"
              >
                ツーリングマニア バイカーズ R7 メガBOX
              </Button>
              <Button
                onClick={() => handleTitleSelect('r7_starter')}
                className="w-full h-14 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 border-none text-white font-bold shadow-lg"
              >
                ツーリングマニア バイカーズ R7 スターターBOX (最新版)
              </Button>
            </div>
            <Button
              onClick={() => setShowTitleSelect(false)}
              variant="ghost"
              className="w-full mt-6 text-slate-400 hover:text-white"
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
