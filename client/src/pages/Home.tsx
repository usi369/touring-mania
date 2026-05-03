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
export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showRules, setShowRules] = useState(false);
  const createGuestSessionMutation = trpc.guest.createSession.useMutation();

  const handleStartGame = () => {
    if (isAuthenticated) {
      setLocation("/game/setup");
    } else {
      // Redirect to coming soon page as login is not implemented yet
      setLocation("/coming-soon");
    }
  };

  const handleGuestMode = async () => {
    try {
      // Create guest session on server
      await createGuestSessionMutation.mutateAsync();
      // Server sets the cookie automatically
      setLocation("/game/setup");
    } catch (error) {
      console.error("Error creating guest session:", error);
    }
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
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
              78
            </div>
            <div>
              <p className="text-sm text-slate-400">バイクカード</p>
              <p className="text-white font-semibold">78種類のバイク</p>
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
    </div>
  );
}
