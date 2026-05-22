import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import RulesScreen from "@/components/RulesScreen";
import { HelpCircle, BookOpen, User, PlayCircle, LogIn, LogOut } from "lucide-react";

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
  const { isLoaded: isAuthLoaded, user, isAuthenticated, login, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showRules, setShowRules] = useState(false);
  const [showTitleSelect, setShowTitleSelect] = useState(false);
  const createGuestSessionMutation = trpc.guest.createSession.useMutation();
  const bikesQuery = trpc.bike.list.useQuery();
  const bikeCount = bikesQuery.data?.length || 0;

  // OTP Authentication States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [authStep, setAuthStep] = useState<"email" | "waiting_email">("email");
  const [email, setEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const sendOtpMutation = trpc.auth.sendOtp.useMutation();

  // Polling for email verification status
  const { data: pollData } = trpc.auth.pollAuthStatus.useQuery(
    { email, code: generatedCode },
    {
      enabled: authStep === "waiting_email" && !!generatedCode,
      refetchInterval: 3000,
    }
  );

  useEffect(() => {
    if (pollData?.verified && pollData.token && pollData.user) {
      login(pollData.token, pollData.user).then(() => {
        setShowEmailModal(false);
        setShowTitleSelect(true);
        setAuthStep("email");
        setGeneratedCode("");
      });
    } else if (pollData && !pollData.verified && (pollData.status === "expired" || pollData.status === "not_found")) {
      if (pollData.status === "expired") {
        setErrorMessage("有効期限が切れました。最初からやり直してください。");
        setAuthStep("email");
        setGeneratedCode("");
      }
    }
  }, [pollData]);

  const handleStartGame = () => {
    if (isAuthenticated) {
      setShowTitleSelect(true);
    } else {
      setShowEmailModal(true);
      setAuthStep("email");
      setEmail("");
      setErrorMessage("");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setErrorMessage("");
    setGeneratedCode("");

    try {
      const res = await sendOtpMutation.mutateAsync({ email });
      if (res.success && res.code) {
        setGeneratedCode(res.code);
        setAuthStep("waiting_email");
      }
    } catch (err: any) {
      console.error("Send OTP error:", err);
      setErrorMessage(err.message || "認証の開始に失敗しました");
    } finally {
      setIsSending(false);
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

        {isAuthenticated && (
          <Button
            onClick={logout}
            variant="outline"
            className="w-full h-12 text-base font-semibold border-pink-500/30 text-pink-400 hover:bg-pink-950/20 hover:text-pink-300 transition-all duration-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            ログアウト
          </Button>
        )}

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

      {/* Custom Email OTP Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              {authStep === "email" ? "メールアドレスで開始" : "ログインコード入力"}
            </h2>
            
            {authStep === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-slate-400 text-xs text-center leading-relaxed">
                  メールアドレスを入力すると、4桁のログインコードが送信されます。
                </p>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  disabled={isSending}
                />
                {errorMessage && (
                  <p className="text-pink-500 text-xs text-center">{errorMessage}</p>
                )}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    variant="ghost"
                    className="flex-1 text-slate-400 hover:text-white"
                    disabled={isSending}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-bold"
                    disabled={isSending}
                  >
                    {isSending ? "送信中..." : "コードを送信"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400 text-xs text-center leading-relaxed">
                  お使いのメールアプリから下記の内容でメールを送信してください。
                </p>

                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">送信元のメールアドレス:</span>
                    <span className="font-mono text-cyan-400 select-all">{email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">宛先:</span>
                    <span className="font-mono select-all">login@nirin-hub.me</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">件名:</span>
                    <span className="font-mono select-all">認証コード: {generatedCode}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={`mailto:login@nirin-hub.me?subject=認証コード: ${generatedCode}&body=そのまま送信してください。%0D%0A認証コード: ${generatedCode}`}
                    className="w-full h-12 flex items-center justify-center bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white font-bold rounded-lg transition-colors text-center"
                  >
                    メールアプリを起動する
                  </a>
                  <p className="text-[10px] text-center text-slate-500">
                    ※送信後、この画面は自動的に切り替わります（数秒〜十数秒かかります）
                  </p>
                </div>

                {errorMessage && (
                  <p className="text-pink-500 text-xs text-center">{errorMessage}</p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setAuthStep("email");
                      setGeneratedCode("");
                    }}
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-white"
                  >
                    戻る
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
