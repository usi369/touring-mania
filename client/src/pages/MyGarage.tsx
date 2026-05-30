import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, LogOut, Key, Loader2, Sparkles, ChevronLeft, ChevronRight, HelpCircle, Copy, Check } from "lucide-react";
import BikeCard from "@/components/BikeCard";
import GarageMarquee from "@/components/GarageMarquee";

export default function MyGarage() {
  const { isLoaded: isAuthLoaded, user, isAuthenticated, login, logout } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Garage States
  const [garageBike, setGarageBike] = useState<any>(null);
  const [isOpening, setIsOpening] = useState(false); // Trigger shutter animation
  const [shutterState, setShutterState] = useState<"closed" | "opening" | "open">("closed");
  const [showBikeSelectModal, setShowBikeSelectModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "large" | "medium" | "small">("all");

  // Query to get user garage bike
  const garageQuery = trpc.garage.getGarage.useQuery(undefined, {
    enabled: isAuthenticated && shutterState === "open",
  });

  // タイトルごとの成績を取得
  const statsQuery = trpc.game.getMyStats.useQuery(undefined, {
    enabled: isAuthenticated && shutterState === "open",
  });

  // Query to get all bikes for selection
  const bikesQuery = trpc.bike.list.useQuery();
  const setGarageBikeMutation = trpc.garage.setGarageBike.useMutation();

  // Authentication States (Same as Home.tsx)
  const [email, setEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [ignitionState, setIgnitionState] = useState<"off" | "key_inserting" | "key_on" | "cranking" | "igniting" | "engine_on">("off");
  const [hasClickedSent, setHasClickedSent] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

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

  // Polling for authentication status
  const { data: pollData } = trpc.auth.pollAuthStatus.useQuery(
    { email, code: generatedCode },
    {
      enabled: !!generatedCode && ignitionState !== "engine_on",
      refetchInterval: 3000,
    }
  );

  // Sync garage bike query data
  useEffect(() => {
    if (garageQuery.data?.bike) {
      setGarageBike(garageQuery.data.bike);
    }
  }, [garageQuery.data]);

  // Sync authentication state and shutter state on load
  useEffect(() => {
    if (isAuthLoaded) {
      if (isAuthenticated) {
        setShutterState("open");
      } else {
        setShutterState("closed");
      }
    }
  }, [isAuthLoaded, isAuthenticated]);

  // Handle Poll verification success
  useEffect(() => {
    if (pollData?.verified && pollData.token && pollData.user) {
      setIgnitionState("igniting");
      
      const timer = setTimeout(() => {
        setIgnitionState("engine_on");
        login(pollData.token, pollData.user).then(() => {
          // Trigger Shutter Opening Ceremony!
          setIsOpening(true);
          setShutterState("opening");
          setHasClickedSent(false);
          
          setTimeout(() => {
            setShutterState("open");
            setIsOpening(false);
            setIgnitionState("off");
            setGeneratedCode("");
            setEmail("");
            // Refetch garage bike
            garageQuery.refetch();
          }, 3500); // Shutter animation time (3.5 seconds)
        });
      }, 500); // 儀式を0.5秒に短縮してスムーズに開始

      return () => clearTimeout(timer);
    } else if (pollData && !pollData.verified && (pollData.status === "expired" || pollData.status === "not_found")) {
      if (pollData.status === "expired") {
        setErrorMessage("キーコードの有効期限が切れました。再試行してください。");
        setIgnitionState("off");
        setGeneratedCode("");
        setHasClickedSent(false);
      }
    }
  }, [pollData]);

  // Request OTP
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
          setIgnitionState("key_on");
        }, 1000);
      } else {
        setIgnitionState("off");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "認証システムの起動に失敗しました。");
      setIgnitionState("off");
    } finally {
      setIsSending(false);
    }
  };

  // Lock Garage (Logout)
  const handleLockGarage = () => {
    setShutterState("closed");
    setGarageBike(null);
    logout();
  };

  // Set favorite bike
  const handleSelectBike = async (bikeId: number) => {
    try {
      const res = await setGarageBikeMutation.mutateAsync({ bikeId });
      if (res.success && res.bike) {
        setGarageBike(res.bike);
        setShowBikeSelectModal(false);
      }
    } catch (error) {
      console.error("Failed to set garage bike:", error);
    }
  };

  const filteredBikes = bikesQuery.data?.filter((b: any) => {
    if (selectedCategory === "all") return true;
    return b.category === selectedCategory;
  }) || [];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 relative overflow-hidden flex flex-col font-sans">
      {/* Background Grid Patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      
      {/* Cyberpunk Scanline */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none z-40" />

      {/* Top Header Bar */}
      <div className="z-30 bg-slate-900/90 backdrop-blur-md border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white"
          >
            <Home className="w-5 h-5" />
          </Button>
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-black text-white italic tracking-wider uppercase">MY GARAGE</h1>
            <div className="h-3 w-px bg-slate-800 mx-1" />
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
              {shutterState === "open" ? "ガレージ開放中" : "セキュリティロック中"}
            </p>
          </div>
        </div>

        {isAuthenticated && shutterState === "open" && (
          <Button
            onClick={handleLockGarage}
            variant="outline"
            className="h-9 text-xs border-pink-500/30 text-pink-400 hover:bg-pink-950/20 hover:text-pink-300 transition-all duration-300"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            ガレージを施錠
          </Button>
        )}
      </div>

      <div className="flex-1 flex flex-col relative justify-center items-center">
        
        {/* ======================================================== */}
        {/* 1. CLOSED GARAGE (Login Panel & Shutter Closed) */}
        {/* ======================================================== */}
        {shutterState === "closed" && (
          <div className="w-full max-w-md mx-auto px-4 z-20 flex flex-col justify-center items-center flex-1 py-8">
            {/* Shutter Visual Background (Closed) */}
            <div className="absolute inset-0 bg-slate-950 flex items-center justify-center pointer-events-none">
              {/* Metallic Grate Texture */}
              <div className="w-full h-full opacity-40 bg-[linear-gradient(to_bottom,transparent_50%,#000_50%)] bg-[size:100%_12px] border-b-8 border-slate-900" />
              {/* Heavy Shadow Overlap */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_10%,rgba(2,6,23,0.95)_90%)]" />
            </div>

            {/* Garage Door Lock Interface */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(34,211,238,0.05)] backdrop-blur-md relative z-20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full border border-cyan-500/30 bg-slate-950/80 flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                  <Key className="w-7 h-7 text-cyan-400 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wider">ガレージオーナー認証</h3>
                <p className="text-xs text-slate-400 mt-2">
                  {ignitionState === "off" || ignitionState === "key_inserting"
                    ? "ガレージのセキュリティロックを解除するため、メールアドレスを入力してください。"
                    : "宛先や本文は変更せず、そのままメールを送信してください。"}
                </p>
              </div>

              {ignitionState === "off" || ignitionState === "key_inserting" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Owner Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="owner@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono text-sm transition-colors text-center"
                      disabled={isSending}
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-pink-500 text-xs text-center leading-relaxed">{errorMessage}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    disabled={isSending}
                  >
                    {isSending ? "キー接続中..." : "オーナー認証キーを発行"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-5">
                  {/* 認証コードと宛先 */}
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
                      onClick={() => setIgnitionState("cranking")}
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
                          オーナーの確認を行っています...
                        </div>
                        <GarageMarquee bikes={bikesQuery.data || []} />
                      </>
                    )}
                  </div>

                  {errorMessage && (
                    <p className="text-pink-500 text-xs text-center">{errorMessage}</p>
                  )}

                  <Button
                    type="button"
                    onClick={() => {
                      setIgnitionState("off");
                      setGeneratedCode("");
                      setHasClickedSent(false);
                    }}
                    variant="ghost"
                    className="w-full h-10 text-slate-500 hover:text-white"
                  >
                    別のメールアドレスで試す
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. OPENING CEREMONY (Shutter Animating & Sounds) */}
        {/* ======================================================== */}
        {shutterState === "opening" && (
          <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col justify-between items-center overflow-hidden">
            {/* Rumble effect and heavy vibration */}
            <div className="absolute inset-0 bg-slate-900 pointer-events-none opacity-20 bg-[linear-gradient(transparent_50%,#000_50%)] bg-[size:100%_16px]" />

            {/* Shutter Top Half Sliding Up */}
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: "-100%" }}
              transition={{ duration: 3.2, ease: [0.77, 0, 0.175, 1], delay: 0.5 }}
              className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 border-b-4 border-cyan-500/80 shadow-[0_10px_20px_rgba(34,211,238,0.3)] z-40 flex flex-col justify-end items-center"
            >
              {/* Heavy shutter panels */}
              <div className="w-full h-full opacity-40 bg-[linear-gradient(to_bottom,transparent_50%,#000_50%)] bg-[size:100%_12px]" />
            </motion.div>

            {/* Shutter Bottom Half Sliding Down */}
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: "100%" }}
              transition={{ duration: 3.2, ease: [0.77, 0, 0.175, 1], delay: 0.5 }}
              className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800 border-t-4 border-cyan-500/80 shadow-[0_-10px_20px_rgba(34,211,238,0.3)] z-40"
            >
              {/* Heavy shutter panels */}
              <div className="w-full h-full opacity-40 bg-[linear-gradient(to_bottom,transparent_50%,#000_50%)] bg-[size:100%_12px]" />
            </motion.div>

            {/* Audio/Text FX overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="flex flex-col items-center gap-3">
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1] }}
                  className="text-yellow-500 font-black italic tracking-widest text-4xl sm:text-6xl drop-shadow-[0_0_20px_rgba(234,179,8,0.6)] uppercase animate-rumble"
                >
                  ゴゴゴゴゴゴ…
                </motion.p>
                <motion.p
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.8, 1.4, 1.2], opacity: [0, 0, 1, 1, 0] }}
                  transition={{ duration: 3.2, times: [0, 0.5, 0.7, 0.9, 1] }}
                  className="text-cyan-400 font-black text-2xl uppercase tracking-[0.3em] drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                >
                  ACCESS GRANTED
                </motion.p>
              </div>
            </div>

            {/* Sparkle/Steam effects in background */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.8, 0] }}
              transition={{ duration: 3 }}
              className="absolute inset-0 z-30 bg-radial-gradient from-cyan-500/20 via-transparent to-transparent pointer-events-none flex items-center justify-center"
            >
              <div className="w-72 h-72 rounded-full blur-[80px] bg-cyan-400/30 animate-pulse" />
            </motion.div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. OPEN GARAGE (Main Dashboard with Lightup Bike) */}
        {/* ======================================================== */}
        {shutterState === "open" && (
          <div className="flex-1 w-full flex flex-col sm:flex-row z-20 min-h-0 gap-0">
            {/* Spotlit background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_35%,rgba(34,211,238,0.15)_0%,transparent_60%)] pointer-events-none z-10" />

            {/* ---- 左カラム：デジタルサイネージ ---- */}
            <div className="w-full sm:w-72 flex-shrink-0 z-20 flex flex-col gap-4 p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-cyan-500/10">

              {/* プロフィールサイネージパネル */}
              <div className="relative bg-slate-900/80 border border-cyan-500/20 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.06)]">
                {/* スキャンライン演出 */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] pointer-events-none opacity-30 z-10" />
                {/* グリッドオーバーレイ */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.04)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-10" />

                {/* ヘッダーバー */}
                <div className="relative z-20 px-4 py-2 border-b border-cyan-500/15 bg-cyan-500/5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                  <span className="text-[9px] font-black text-cyan-400 tracking-[0.3em] uppercase">Owner Profile</span>
                  <div className="ml-auto flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
                  </div>
                </div>

                {/* ボディ */}
                <div className="relative z-20 p-4 space-y-4">
                  {/* アバタープレースホルダー */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-lg bg-slate-950 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                        <span className="text-2xl">🏍</span>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-900 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] text-slate-500 font-bold tracking-widest uppercase mb-0.5">Display Name</p>
                      <p className="text-sm font-black text-white truncate leading-tight">
                        {user?.name || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

                  {/* メールアドレス */}
                  <div className="space-y-2">
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                      <p className="text-[8px] text-slate-500 font-bold tracking-widest uppercase mb-1">Email Address</p>
                      <p className="text-[11px] font-mono text-cyan-300 truncate leading-tight">
                        {user?.email || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

                  {/* ステータス表示エリア（今後の拡張用） */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 text-center">
                      <p className="text-[8px] text-slate-500 font-bold tracking-widest uppercase mb-1">Role</p>
                      <p className="text-[10px] font-black text-purple-400 uppercase">
                        {user?.role === "admin" ? "Admin" : "Rider"}
                      </p>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 text-center">
                      <p className="text-[8px] text-slate-500 font-bold tracking-widest uppercase mb-1">Status</p>
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <p className="text-[10px] font-black text-green-400 uppercase">Online</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* フッターライン */}
                <div className="relative z-20 px-4 py-2 border-t border-cyan-500/10 bg-slate-950/30">
                  <p className="text-[8px] text-slate-600 font-mono tracking-widest text-center">
                    TOURING MANIA // GARAGE SYSTEM v2.0
                  </p>
                </div>
              </div>

              {/* 成績サイネージパネル */}
              <div className="relative bg-slate-900/80 border border-purple-500/20 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.05)]">
                {/* スキャンライン */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] pointer-events-none opacity-30 z-10" />
                {/* グリッドオーバーレイ */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-10" />

                {/* ヘッダーバー */}
                <div className="relative z-20 px-4 py-2 border-b border-purple-500/15 bg-purple-500/5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                  <span className="text-[9px] font-black text-purple-400 tracking-[0.3em] uppercase">Win Records</span>
                  <div className="ml-auto flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  </div>
                </div>

                {/* 成績ボディ */}
                <div className="relative z-20 p-4 space-y-3">
                  {statsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-4 gap-2">
                      <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[9px] text-slate-500 font-mono tracking-widest">LOADING...</span>
                    </div>
                  ) : (() => {
                    const EDITION_LABELS: Record<string, { label: string; short: string; color: string; glow: string }> = {
                      r7_starter:   { label: "R7 スターター",      short: "R7-S", color: "text-cyan-400",   glow: "bg-cyan-400" },
                      tokyo_remake: { label: "東京リメイク",        short: "TKY",  color: "text-pink-400",   glow: "bg-pink-400" },
                      r6_complete:  { label: "R6 コンプリート",     short: "R6-C", color: "text-purple-400", glow: "bg-purple-400" },
                      r7_mega:      { label: "R7 メガ",            short: "R7-M", color: "text-amber-400",  glow: "bg-amber-400" },
                    };
                    const stats = statsQuery.data?.stats || [];
                    const totalWins = stats.reduce((s, r) => s + r.wins, 0);
                    const totalPlayed = stats.reduce((s, r) => s + r.played, 0);

                    return (
                      <>
                        {/* トータルサマリー */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-slate-950/60 border border-yellow-500/20 rounded-lg p-2 text-center">
                            <p className="text-[8px] text-slate-500 font-bold tracking-widest uppercase mb-1">Total Wins</p>
                            <p className="text-xl font-black text-yellow-400 leading-none">{totalWins}<span className="text-[9px] text-slate-500 ml-1">回</span></p>
                          </div>
                          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 text-center">
                            <p className="text-[8px] text-slate-500 font-bold tracking-widest uppercase mb-1">Total Games</p>
                            <p className="text-xl font-black text-white leading-none">{totalPlayed}<span className="text-[9px] text-slate-500 ml-1">戦</span></p>
                          </div>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

                        {/* タイトルごと */}
                        <div className="space-y-2.5">
                          {stats.map((row) => {
                            const meta = EDITION_LABELS[row.edition];
                            if (!meta) return null;
                            return (
                              <div key={row.edition}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${meta.color} border-current/30 bg-current/5 tracking-wider`}>{meta.short}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">{meta.label}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-xs font-black ${meta.color}`}>{row.wins}</span>
                                    <span className="text-[9px] text-slate-600">/ {row.played}戦</span>
                                  </div>
                                </div>
                                {/* 勝率バー */}
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${meta.glow} opacity-80`}
                                    style={{ width: `${row.winRate}%` }}
                                  />
                                </div>
                                <p className="text-[8px] text-slate-600 font-mono text-right mt-0.5">{row.winRate}%</p>
                              </div>
                            );
                          })}
                          {totalPlayed === 0 && (
                            <p className="text-[9px] text-slate-600 font-mono text-center py-2">-- NO RECORDS --</p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* ---- 右カラム：バイク展示エリア ---- */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 z-20 min-h-0">
              {garageQuery.isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  <p className="text-cyan-400 font-bold tracking-widest text-xs animate-pulse uppercase">GARAGE LOADING...</p>
                </div>
              ) : garageBike ? (
                <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 gap-5">
                  <div className="text-center">
                    <p className="text-[10px] text-cyan-400 font-black tracking-[0.4em] uppercase mb-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">MY FAVORITE MACHINE</p>
                    <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-wider">{garageBike.name}</h2>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="relative max-w-xs w-full flex-1 flex items-center justify-center min-h-0"
                  >
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-6 bg-cyan-400/20 blur-[15px] rounded-full z-0" />
                    <div className="z-10 w-full h-full max-h-[420px] flex items-center justify-center">
                      <BikeCard bike={garageBike} size="large" showDetails={true} />
                    </div>
                  </motion.div>

                  <Button
                    onClick={() => setShowBikeSelectModal(true)}
                    className="h-12 px-8 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 hover:text-white font-bold rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all"
                  >
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                    愛車を変更する
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 px-6 max-w-sm bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center mx-auto mb-4 border border-slate-800">
                    <Sparkles className="w-6 h-6 text-slate-500" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">ガレージが空です</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">あなたの愛車となる最初の1台を設定してください。ガレージに美しく展示されます。</p>
                  <Button
                    onClick={() => setShowBikeSelectModal(true)}
                    className="h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold tracking-wider rounded-xl px-8 shadow-lg"
                  >
                    最初の愛車を選択
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. MODALS & POPUPS */}
      {/* ======================================================== */}
      
      {/* Bike Selection Modal */}
      {showBikeSelectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="text-base font-black text-white uppercase italic tracking-wider">愛車（マイバイク）の選択</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">SELECT YOUR MACHINE</p>
              </div>
              <button 
                onClick={() => setShowBikeSelectModal(false)}
                className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-950/40 flex gap-1.5 overflow-x-auto no-scrollbar">
              {(["all", "large", "medium", "small"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all uppercase whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat === "all" ? "すべて" : cat === "large" ? "大型" : cat === "medium" ? "中型" : "小型"}
                </button>
              ))}
            </div>

            {/* Bike List Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-slate-950/20">
              {bikesQuery.isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-xs text-slate-500 font-bold tracking-widest animate-pulse">BIKES LIST LOADING...</p>
                </div>
              ) : filteredBikes.length > 0 ? (
                filteredBikes.map((bike: any) => (
                  <div 
                    key={bike.id}
                    onClick={() => handleSelectBike(bike.id)}
                    className={`flex items-center gap-4 p-3 rounded-xl border bg-slate-900/60 hover:bg-slate-800/80 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                      garageBike?.id === bike.id ? "border-cyan-500/60 bg-cyan-500/5 shadow-[0_0_15px_rgba(34,211,238,0.05)]" : "border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    {/* Bike Small Image Indicator */}
                    <div className="w-14 h-14 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {bike.photoUrl ? (
                        <img src={bike.photoUrl} alt={bike.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🏍</span>
                      )}
                    </div>
                    
                    {/* Bike Names / Specs info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[8px] font-black px-1 py-0.5 rounded leading-none ${
                          bike.category === 'large' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                          bike.category === 'medium' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' :
                          'bg-pink-500/20 text-pink-400 border border-pink-500/20'
                        }`}>{bike.category === 'large' ? '大型' : bike.category === 'medium' ? '中型' : '小型'}</span>
                        <span className="text-[8px] font-bold text-slate-500">{bike.maker}</span>
                      </div>
                      <p className="text-xs font-bold text-white truncate leading-tight">{bike.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{bike.horsepower}PS │ {bike.weight}kg │ {bike.price}万円</p>
                    </div>

                    {/* Radio Button */}
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${
                      garageBike?.id === bike.id ? "border-cyan-500 bg-cyan-500" : "border-slate-700"
                    }`}>
                      {garageBike?.id === bike.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs font-medium">
                  バイクが見つかりませんでした。
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <Button
                onClick={() => setShowBikeSelectModal(false)}
                className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Styled custom components */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
        .animate-scan { animation: scan 3s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
