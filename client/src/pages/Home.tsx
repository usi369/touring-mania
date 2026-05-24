import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import RulesScreen from "@/components/RulesScreen";
import { HelpCircle, BookOpen, User, PlayCircle, LogIn, LogOut, Warehouse, Copy, Check } from "lucide-react";
import GarageMarquee from "@/components/GarageMarquee";
import { motion } from "framer-motion";

const STAR_COLORS = ["#22d3ee", "#f43f5e", "#ffffff", "#a855f7"];

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
  const [showResumeModal, setShowResumeModal] = useState(false);
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
  const [ignitionState, setIgnitionState] = useState<"off" | "key_inserting" | "key_on" | "cranking" | "igniting" | "engine_on">("off");
  const [hasClickedSent, setHasClickedSent] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isWarping, setIsWarping] = useState(false);

  const copyToClipboard = async (text: string, type: 'code' | 'email') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const sendOtpMutation = trpc.auth.sendOtp.useMutation();

  const activeGameQuery = trpc.game.getActiveGame.useQuery(undefined, {
    enabled: isAuthenticated,
  });

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
      setIgnitionState("igniting");
      const timer = setTimeout(() => {
        setIgnitionState("engine_on");
        // 宇宙ワープ演出を開始
        setIsWarping(true);
        
        // 1.5秒間の宇宙ワープ演出（全画面急拡大＆星屑飛び出し）が終わるまで待つ
        const warpTimer = setTimeout(() => {
          login(pollData.token, pollData.user).then(async () => {
            setIsWarping(false);
            setShowEmailModal(false);
            setAuthStep("email");
            setGeneratedCode("");
            setIgnitionState("off");
            setHasClickedSent(false);
          });
        }, 1500);
        
        return () => clearTimeout(warpTimer);
      }, 500); // 儀式を0.5秒に短縮してスムーズに開始
      return () => clearTimeout(timer);
    } else if (pollData && !pollData.verified && (pollData.status === "expired" || pollData.status === "not_found")) {
      if (pollData.status === "expired") {
        setErrorMessage("有効期限が切れました。最初からやり直してください。");
        setAuthStep("email");
        setGeneratedCode("");
        setIgnitionState("off");
        setHasClickedSent(false);
      }
    }
  }, [pollData]);

  const handleStartGame = async () => {
    if (isAuthenticated) {
      try {
        // ボタンが押されたタイミングで最新の進行中のゲーム情報をAPIから取得してチェックする
        const res = await activeGameQuery.refetch();
        if (res.data?.activeGameId) {
          setShowResumeModal(true);
        } else {
          setShowTitleSelect(true);
        }
      } catch (err) {
        console.error("Failed to check active game:", err);
        // エラー時のフォールバックとしてタイトル選択へ
        setShowTitleSelect(true);
      }
    } else {
      setShowEmailModal(true);
      setAuthStep("email");
      setEmail("");
      setErrorMessage("");
      setHasClickedSent(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setErrorMessage("");
    setGeneratedCode("");
    setIgnitionState("key_inserting");
    setHasClickedSent(false);

    try {
      const res = await sendOtpMutation.mutateAsync({ email });
      if (res.success && res.code) {
        setTimeout(() => {
          setGeneratedCode(res.code);
          setAuthStep("waiting_email");
          setIgnitionState("key_on");
        }, 1000);
      } else {
        setIgnitionState("off");
      }
    } catch (err: any) {
      console.error("Send OTP error:", err);
      setErrorMessage(err.message || "認証の開始に失敗しました");
      setIgnitionState("off");
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

        {/* My Garage Button */}
        <Button
          onClick={() => setLocation("/my-garage")}
          variant="outline"
          className="w-full h-12 text-base font-semibold border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/20 hover:text-cyan-300 transition-all duration-300"
        >
          <Warehouse className="w-4 h-4 mr-2" />
          マイガレージ
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

      {/* Resume Game Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">進行中のゲーム</h2>
            <p className="text-slate-300 text-sm text-center mb-6 leading-relaxed">
              中断されたゲームデータが存在します。<br />
              続きから再開しますか？それとも新しく始めますか？
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  setShowResumeModal(false);
                  if (activeGameQuery.data?.activeGameId) {
                    setLocation(`/game/play?gameId=${activeGameQuery.data.activeGameId}`);
                  }
                }}
                className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold tracking-wider rounded-lg shadow-lg"
              >
                続きから再開
              </Button>
              <Button
                onClick={() => {
                  setShowResumeModal(false);
                  setShowTitleSelect(true);
                }}
                variant="outline"
                className="w-full h-12 text-base font-semibold border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300"
              >
                新しく始める
              </Button>
            </div>
            <Button
              onClick={() => setShowResumeModal(false)}
              variant="ghost"
              className="w-full mt-4 text-slate-400 hover:text-white"
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {/* Custom Email OTP Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-4 text-center tracking-wider">
              {authStep === "email" ? "ログイン認証" : "メール確認"}
            </h2>
            
            {authStep === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <p className="text-slate-400 text-xs text-center leading-relaxed">
                  メールアドレスを入力し、認証用のキーコードを発行してください。
                </p>

                {/* Keyhole SVG representation (Keep simple for context) */}
                <div className="py-2">
                  <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto drop-shadow-[0_0_10px_rgba(34,211,238,0.15)]">
                    <circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                    <path d="M50,20 L50,45" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="8" fill="none" stroke="#22d3ee" strokeWidth="2" />
                  </svg>
                </div>

                <div className="space-y-4">
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono text-sm transition-colors"
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
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold tracking-wider"
                      disabled={isSending}
                    >
                      {isSending ? "処理中..." : "キーコードを発行"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                {/* ログイン認証ヘッダーと説明 */}
                <div className="text-center space-y-3">
                  <div className="text-xs text-slate-400">
                    宛先や本文は変更せず、そのままメールを送信してください。
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg text-center font-mono relative flex flex-col items-center justify-center min-h-[64px]">
                      <span className="text-slate-500 text-[9px] block mb-0.5">認証コード</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-black text-cyan-300 tracking-widest">{generatedCode}</span>
                        <button
                          onClick={() => copyToClipboard(generatedCode, 'code')}
                          className="text-slate-500 hover:text-cyan-400 p-1 transition-colors"
                          title="コードをコピー"
                          type="button"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg text-center font-mono relative flex flex-col items-center justify-center min-h-[64px]">
                      <span className="text-slate-500 text-[9px] block mb-0.5">送信先メールアドレス (宛先)</span>
                      <div className="flex items-center gap-1.5 max-w-full">
                        <span className="text-[10px] font-bold text-slate-300 truncate max-w-[110px]">login@nirin-hub.me</span>
                        <button
                          onClick={() => copyToClipboard("login@nirin-hub.me", 'email')}
                          className="text-slate-500 hover:text-cyan-400 p-1 flex-shrink-0 transition-colors"
                          title="宛先をコピー"
                          type="button"
                        >
                          {copiedEmail ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 手順の案内と「この画面に戻る」旨の強調表示 */}
                <div className="bg-slate-900 border border-cyan-500/20 p-3.5 rounded-lg text-xs space-y-2.5 leading-relaxed">
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold flex-shrink-0">1</span>
                    <p className="text-slate-300">
                      「メールを起動して送信」ボタンからメールを送信します。（起動しない場合は上記の宛先とコードをコピーして手動送信してください）
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold flex-shrink-0">2</span>
                    <p className="text-slate-300">
                      送信完了後、<span className="text-cyan-300 font-bold">必ずこのブラウザ画面に戻ってきて</span>ください。
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold flex-shrink-0">3</span>
                    <p className="text-slate-300">
                      この画面に戻ったら、下部の「メール送信済」ボタンを押してください。
                    </p>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="space-y-3">
                  <a
                    href={`mailto:login@nirin-hub.me?subject=認証コード: ${generatedCode}&body=そのまま送信してください。%0D%0A認証コード: ${generatedCode}`}
                    onClick={() => {
                      setIgnitionState("cranking");
                    }}
                    className="w-full h-12 flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 border border-cyan-700 text-white font-bold rounded-lg transition-all text-center tracking-wider text-sm shadow-[0_2px_8px_rgba(34,211,238,0.2)]"
                  >
                    メールを起動して送信
                  </a>

                  {!hasClickedSent ? (
                    <Button
                      onClick={() => setHasClickedSent(true)}
                      className="w-full h-12 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg tracking-wider text-sm transition-all"
                    >
                      メール送信済
                    </Button>
                  ) : (
                    <>
                      <div className="w-full h-12 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-xs font-medium gap-2">
                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        メールの受信を確認しています...
                      </div>
                      <GarageMarquee bikes={bikesQuery.data || []} />
                    </>
                  )}
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
                      setIgnitionState("off");
                      setHasClickedSent(false);
                    }}
                    variant="ghost"
                    className="w-full text-slate-500 hover:text-white"
                  >
                    戻る
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Ignition Animation Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake-rumble {
          0% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-2px, -2px) rotate(-0.5deg); }
          20% { transform: translate(3px, 0px) rotate(1deg); }
          30% { transform: translate(0px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(0.5deg); }
          50% { transform: translate(-2px, 2px) rotate(-1deg); }
          60% { transform: translate(2px, 1px) rotate(0deg); }
          70% { transform: translate(-1px, -2px) rotate(0.5deg); }
          80% { transform: translate(3px, 2px) rotate(0deg); }
          90% { transform: translate(-1px, -1px) rotate(-0.5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .animate-rumble {
          animation: shake-rumble 0.1s linear infinite;
        }
        @keyframes blink-led {
          0%, 100% { opacity: 0.2; filter: drop-shadow(0 0 0 transparent); }
          50% { opacity: 1; filter: drop-shadow(0 0 4px currentColor); }
        }
        .animate-blink-orange {
          animation: blink-led 0.6s infinite;
          color: #f97316 !important;
        }
        .animate-blink-red {
          animation: blink-led 0.4s infinite;
          color: #ef4444 !important;
        }
        @keyframes tacho-sweep {
          0% { transform: rotate(-85deg); }
          40% { transform: rotate(110deg); }
          60% { transform: rotate(105deg); }
          100% { transform: rotate(-85deg); }
        }
        .animate-tacho-opening {
          animation: tacho-sweep 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes cranking-vibe {
          0%, 100% { transform: rotate(-85deg); }
          50% { transform: rotate(-82deg); }
        }
        .animate-cranking-needle {
          animation: cranking-vibe 0.08s linear infinite;
        }
        @keyframes lcd-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-lcd-scan {
          animation: lcd-scanline 6s linear infinite;
        }
      `}} />

      {/* ログイン成功時の宇宙ワープ演出 */}
      {isWarping && (
        <motion.div
          initial={{
            position: "fixed",
            top: "50%",
            left: "50%",
            x: "-50%",
            y: "-50%",
            width: "320px",
            height: "96px",
            borderRadius: "12px",
            scale: 0.8,
            opacity: 0,
            zIndex: 9999,
          }}
          animate={{
            width: "100vw",
            height: "100vh",
            borderRadius: "0px",
            scale: [1, 1.2, 8],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 1.5,
            times: [0, 0.2, 1],
            ease: "easeIn",
          }}
          style={{
            backgroundImage: "url('/pixel_art_space.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            imageRendering: "pixelated",
          }}
          className="flex items-center justify-center overflow-hidden pointer-events-none"
        >
          {/* 走査線（スキャンライン）エフェクト */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.6)_50%)] bg-[size:100%_4px] pointer-events-none" />

          {/* サイバー風グリッドオーバーレイ */}
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,rgba(34,211,238,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* 放射状に流れる星屑 */}
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 40 }).map((_, i) => {
              const angle = (i / 40) * Math.PI * 2 + Math.random() * 0.2;
              const speed = 150 + Math.random() * 350;
              const delay = Math.random() * 0.4;
              const duration = 0.5 + Math.random() * 0.6;
              const size = 2 + Math.random() * 4;
              const color = STAR_COLORS[i % STAR_COLORS.length];

              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 0.1, opacity: 0 }}
                  animate={{
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed,
                    scale: [0.1, 2.5, 4, 0.1],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: duration,
                    delay: delay,
                    repeat: Infinity,
                    ease: "easeIn",
                  }}
                  className="absolute rounded-full"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}`,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              );
            })}
          </div>

          {/* ワープ時の光のフラッシュ効果 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0.8, 0] }}
            transition={{ duration: 1.5, times: [0, 0.7, 0.9, 1] }}
            className="absolute inset-0 bg-cyan-400 mix-blend-screen pointer-events-none"
          />
        </motion.div>
      )}
    </div>
  );
}
