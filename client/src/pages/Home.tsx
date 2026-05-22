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
  const [ignitionState, setIgnitionState] = useState<"off" | "key_inserting" | "key_on" | "cranking" | "igniting" | "engine_on">("off");

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
      setIgnitionState("igniting");
      const timer = setTimeout(() => {
        setIgnitionState("engine_on");
        login(pollData.token, pollData.user).then(() => {
          setShowEmailModal(false);
          setShowTitleSelect(true);
          setAuthStep("email");
          setGeneratedCode("");
          setIgnitionState("off");
        });
      }, 2200); // 2.2s ceremony
      return () => clearTimeout(timer);
    } else if (pollData && !pollData.verified && (pollData.status === "expired" || pollData.status === "not_found")) {
      if (pollData.status === "expired") {
        setErrorMessage("有効期限が切れました。最初からやり直してください。");
        setAuthStep("email");
        setGeneratedCode("");
        setIgnitionState("off");
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
    setIgnitionState("key_inserting");

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

      {/* Custom Email OTP Modal (Ignition Theme) */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-300 ${
            ignitionState === "igniting" ? "animate-rumble border-green-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]" : ""
          }`}>
            <h2 className="text-2xl font-black text-white mb-4 text-center uppercase tracking-widest italic">
              {authStep === "email" ? "IGNITION SYSTEM" : "INSTRUMENT PANEL"}
            </h2>
            
            {authStep === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <p className="text-slate-400 text-xs text-center leading-relaxed">
                  メールアドレスを入力し、キー（鍵）を差し込んでシステムを起動します。
                </p>

                {/* Keyhole SVG representation */}
                <div className="py-4">
                  <svg viewBox="0 0 100 100" className="w-28 h-28 mx-auto drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                    <circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#334155" strokeWidth="3" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.3" strokeDasharray="4 4" />
                    <text x="50" y="24" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="black" className="tracking-wider">OFF</text>
                    <text x="78" y="52" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="black" className="tracking-wider">ON</text>
                    <text x="22" y="52" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="black" className="tracking-wider">LOCK</text>
                    
                    <circle cx={ignitionState === "off" || ignitionState === "key_inserting" ? "50" : "71"} cy={ignitionState === "off" || ignitionState === "key_inserting" ? "30" : "50"} r="2" fill="#22d3ee" className="transition-all duration-500" />
                    
                    <g transform={`rotate(${ignitionState === "off" || ignitionState === "key_inserting" ? 0 : 90} 50 50)`} className="transition-transform duration-500 ease-in-out">
                      <circle cx="50" cy="50" r="22" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                      <rect x="47" y="42" width="6" height="16" rx="1" fill="#334155" />
                      <circle cx="50" cy="42" r="4" fill="#334155" />
                      
                      {(ignitionState !== "off") && (
                        <g className={`transition-all duration-500 ${ignitionState === "key_inserting" ? "translate-y-[-12px] opacity-30" : "translate-y-0 opacity-100"}`}>
                          <path d="M44,22 C44,14 56,14 56,22 L53,38 L47,38 Z" fill="url(#key-grad)" stroke="#22d3ee" strokeWidth="1" />
                          <circle cx="50" cy="18" r="2.5" fill="#0f172a" />
                        </g>
                      )}
                    </g>
                    <defs>
                      <linearGradient id="key-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#1e293b" />
                      </linearGradient>
                    </defs>
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
                      {isSending ? "起動中..." : "キーをONにする"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                {/* Tachometer Display */}
                <div className="relative bg-slate-950/60 p-2 rounded-xl border border-slate-800 shadow-inner">
                  <svg viewBox="0 0 200 110" className="w-full max-w-[240px] mx-auto">
                    <path d="M30,95 A70,70 0 0,1 170,95" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                    <path d="M30,95 A70,70 0 0,1 170,95" fill="none" stroke="url(#tacho-grad)" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
                    <path d="M136,44 A70,70 0 0,1 170,95" fill="none" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round" opacity="0.5" />
                    
                    {Array.from({ length: 9 }).map((_, idx) => {
                      const angle = -120 + idx * 30;
                      const isRedline = idx >= 6;
                      return (
                        <line
                          key={idx}
                          x1="100"
                          y1="95"
                          x2="100"
                          y2="20"
                          stroke={isRedline ? "#f43f5e" : "#22d3ee"}
                          strokeWidth="1.5"
                          strokeDasharray="6 70"
                          transform={`rotate(${angle} 100 95)`}
                          opacity="0.4"
                        />
                      );
                    })}
                    
                    <circle cx="100" cy="95" r="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                    
                    <g transform={`rotate(${
                      ignitionState === "key_on" ? -85 :
                      ignitionState === "cranking" ? -82 :
                      ignitionState === "igniting" ? 110 :
                      ignitionState === "engine_on" ? -85 : -120
                    } 100 95)`}
                       className={`origin-[100px_95px] transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
                         ignitionState === "cranking" ? "animate-cranking-needle" :
                         ignitionState === "igniting" ? "animate-tacho-opening" : ""
                       }`}
                    >
                      <line x1="100" y1="95" x2="100" y2="25" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                    
                    <text x="100" y="80" textAnchor="middle" fill="#22d3ee" fontSize="10" fontWeight="black" fontFamily="monospace" opacity="0.8">
                      {ignitionState === "key_on" ? "0" :
                       ignitionState === "cranking" ? "1200" :
                       ignitionState === "igniting" ? "10500" :
                       ignitionState === "engine_on" ? "1450" : "0"} RPM
                    </text>
                    
                    <defs>
                      <linearGradient id="tacho-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="70%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Dashboard Indicators */}
                <div className="flex justify-center gap-6 my-2 bg-slate-950/40 py-2 rounded-xl border border-slate-900">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center text-[8px] font-black transition-all ${
                      ignitionState === "key_on" ? "text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                      ignitionState === "cranking" ? "animate-blink-red" : "text-slate-800"
                    }`}>OIL</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center text-[8px] font-black transition-all ${
                      ignitionState === "key_on" ? "text-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" :
                      ignitionState === "cranking" ? "animate-blink-orange" : 
                      ignitionState === "igniting" || ignitionState === "engine_on" ? "text-green-500 shadow-[0_0_10px_#10b981]" : "text-slate-800"
                    }`}>FI</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center text-[8px] font-black transition-all ${
                      ignitionState !== "off" && ignitionState !== "key_inserting" ? "text-green-500 shadow-[0_0_10px_#10b981]" : "text-slate-800"
                    }`}>N</div>
                  </div>
                </div>

                {/* LCD Display Console */}
                <div className="relative bg-slate-950 border border-slate-900 p-4 rounded-xl font-mono text-[10px] sm:text-xs overflow-hidden shadow-inner text-cyan-400">
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent h-1/2 w-full animate-lcd-scan pointer-events-none" />
                  
                  <div className="space-y-1.5 z-10 relative">
                    <div className="flex justify-between border-b border-cyan-950 pb-1 text-[9px] text-cyan-600 font-bold">
                      <span>SYSTEM MONITOR v1.0.4</span>
                      <span className={ignitionState === "cranking" ? "text-orange-500 font-black animate-pulse" : ""}>
                        {ignitionState === "key_on" ? "● SYSTEM READY" :
                         ignitionState === "cranking" ? "⚡ CRANKING..." :
                         ignitionState === "igniting" ? "🔥 IGNITING..." :
                         ignitionState === "engine_on" ? "✔ READY TO RIDE" : "● SYSTEM OFF"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">RIDER:</span>
                      <span className="text-slate-300 font-bold select-all truncate max-w-[200px]">{email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">GATEWAY:</span>
                      <span className="text-slate-300 font-bold select-all">login@nirin-hub.me</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">IGNITION KEY:</span>
                      <span className="text-cyan-300 font-black select-all tracking-wider">認証コード: {generatedCode}</span>
                    </div>
                  </div>
                </div>

                {/* Starter Button */}
                <div className="flex flex-col gap-2">
                  <a
                    href={`mailto:login@nirin-hub.me?subject=認証コード: ${generatedCode}&body=そのまま送信してください。%0D%0A認証コード: ${generatedCode}`}
                    onClick={() => setIgnitionState("cranking")}
                    className="w-full h-14 flex items-center justify-center bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 border border-red-800 text-white font-black rounded-xl transition-all shadow-[0_4px_10px_rgba(239,68,68,0.3)] text-center tracking-widest text-base hover:scale-[1.02] active:scale-[0.98]"
                  >
                    🚀 ENGINE START
                  </a>
                  <p className="text-[10px] text-center text-slate-500 font-bold">
                    ※送信後、システムが信号を検知して自動点火します
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
                      setIgnitionState("off");
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
    </div>
  );
}
