import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, LogOut, Key, Loader2, Sparkles, ChevronLeft, ChevronRight, Copy, Check, Terminal, Activity, Zap } from "lucide-react";
import BikeCard from "@/components/BikeCard";
import GameButton from "@/components/ui/GameButton";

export default function MyGarage() {
  const { isLoaded: isAuthLoaded, user, isAuthenticated, login, logout } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // States
  const [garageBike, setGarageBike] = useState<any>(null);
  const [shutterState, setShutterState] = useState<"closed" | "opening" | "open">("closed");
  const [showBikeSelectModal, setShowBikeSelectModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "large" | "medium" | "small">("all");

  const garageQuery = trpc.garage.getGarage.useQuery(undefined, {
    enabled: isAuthenticated && shutterState === "open",
  });
  const statsQuery = trpc.game.getMyStats.useQuery(undefined, {
    enabled: isAuthenticated && shutterState === "open",
  });
  const bikesQuery = trpc.bike.list.useQuery();
  const setGarageBikeMutation = trpc.garage.setGarageBike.useMutation();

  const [email, setEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [ignitionState, setIgnitionState] = useState<"off" | "key_inserting" | "key_on" | "engine_on">("off");
  const [hasClickedSent, setHasClickedSent] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const sendOtpMutation = trpc.auth.sendOtp.useMutation();
  const { data: pollData } = trpc.auth.pollAuthStatus.useQuery(
    { email, code: generatedCode },
    { enabled: !!generatedCode && ignitionState !== "engine_on", refetchInterval: 3000 }
  );

  useEffect(() => {
    if (garageQuery.data?.bike) setGarageBike(garageQuery.data.bike);
  }, [garageQuery.data]);

  useEffect(() => {
    if (isAuthLoaded) setShutterState(isAuthenticated ? "open" : "closed");
  }, [isAuthLoaded, isAuthenticated]);

  useEffect(() => {
    if (pollData?.verified && pollData.token && pollData.user) {
      setIgnitionState("engine_on");
      login(pollData.token, pollData.user).then(() => {
        setShutterState("opening");
        setTimeout(() => {
          setShutterState("open");
          setIgnitionState("off");
          setGeneratedCode("");
          setEmail("");
          garageQuery.refetch();
        }, 3800); // Cinematic opening time
      });
    }
  }, [pollData]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setErrorMessage("");
    setIgnitionState("key_inserting");
    try {
      const res = await sendOtpMutation.mutateAsync({ email });
      if (res.success && res.code) {
        setTimeout(() => { setGeneratedCode(res.code); setIgnitionState("key_on"); }, 1000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Auth Error");
      setIgnitionState("off");
    } finally { setIsSending(false); }
  };

  const handleSelectBike = async (bikeId: number) => {
    try {
      const res = await setGarageBikeMutation.mutateAsync({ bikeId });
      if (res.success && res.bike) {
        setGarageBike(res.bike);
        setShowBikeSelectModal(false);
      }
    } catch (error) { console.error(error); }
  };

  const filteredBikes = bikesQuery.data?.filter((b: any) => selectedCategory === "all" || b.category === selectedCategory) || [];

  return (
    <div className="h-full w-full bg-[#020617] text-slate-100 relative overflow-hidden flex flex-col font-sans select-none">
      
      {/* 1. Header (HUD Style) */}
      <div className="z-40 shrink-0 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setLocation("/")} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all">
            <Home className="w-4 h-4 text-cyan-400" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[10px] font-black text-white italic tracking-[0.2em] uppercase leading-none mb-1">Sector // Garage</h1>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none">
              {shutterState === "open" ? "System: Active" : "System: Locked"}
            </p>
          </div>
        </div>
        {isAuthenticated && (
          <button onClick={() => { setShutterState("closed"); logout(); }} className="text-[8px] font-black border border-pink-500/30 text-pink-500 px-3 py-1.5 rounded-full hover:bg-pink-500/10 transition-all uppercase tracking-widest">Terminate Session</button>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        
        {/* --- Closed State (Login) --- */}
        {shutterState === "closed" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-950">
            {/* Shutter Texture Background */}
            <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_bottom,transparent_50%,#000_50%)] bg-[size:100%_10px] pointer-events-none" />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-slate-900/90 border-2 border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-3xl bg-slate-950 border-2 border-cyan-500/30 flex items-center justify-center mx-auto mb-4 shadow-cyan-900/20 shadow-xl">
                  <Key className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Owner Authentication</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-2 tracking-widest">Connect email to initialize garage</p>
              </div>

              {ignitionState !== "key_on" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <input
                    type="email" required placeholder="OWNER@SYSTEM.IO"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 px-6 rounded-2xl bg-slate-950 border-2 border-white/5 text-white focus:border-cyan-500/50 font-mono text-xs transition-all text-center uppercase tracking-widest"
                    disabled={isSending}
                  />
                  <GameButton type="submit" disabled={isSending} className="w-full py-4 text-xs">
                    {isSending ? "ESTABLISHING..." : "GENERATE ACCESS KEY"}
                  </GameButton>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-950 border-2 border-cyan-500/20 p-5 rounded-2xl text-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Keycode Issued</span>
                    <span className="text-3xl font-black text-cyan-300 tracking-[0.3em] italic">{generatedCode}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 text-center uppercase font-bold leading-relaxed px-4">Transmit this code via automated link below to synchronize security.</p>
                  <a href={`mailto:login@nirin-hub.me?subject=Garage Key: ${generatedCode}&body=SYNC: ${generatedCode}`} className="w-full h-14 flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl transition-all text-[10px] tracking-widest uppercase shadow-lg">TRANSMIT KEY</a>
                  <button onClick={() => setIgnitionState("off")} className="w-full text-slate-600 hover:text-white text-[8px] font-black tracking-widest uppercase">Abort Procedure</button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* --- Opening Ceremony --- */}
        {shutterState === "opening" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950 overflow-hidden">
            <motion.div initial={{ y: 0 }} animate={{ y: "-100%" }} transition={{ duration: 3.2, ease: [0.77, 0, 0.175, 1], delay: 0.5 }} className="absolute top-0 w-full h-1/2 bg-slate-900 border-b-4 border-cyan-500 shadow-2xl z-10 flex flex-col justify-end">
              <div className="w-full h-full opacity-40 bg-[linear-gradient(to_bottom,transparent_50%,#000_50%)] bg-[size:100%_12px]" />
            </motion.div>
            <motion.div initial={{ y: 0 }} animate={{ y: "100%" }} transition={{ duration: 3.2, ease: [0.77, 0, 0.175, 1], delay: 0.5 }} className="absolute bottom-0 w-full h-1/2 bg-slate-900 border-t-4 border-cyan-500 shadow-2xl z-10">
              <div className="w-full h-full opacity-40 bg-[linear-gradient(to_bottom,transparent_50%,#000_50%)] bg-[size:100%_12px]" />
            </motion.div>
            <div className="text-center z-20">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 1, 0] }} transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1] }} className="text-4xl font-black text-cyan-400 italic tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">Initializing Reveal</motion.div>
            </div>
          </div>
        )}

        {/* --- Open State (Dashboard) --- */}
        {shutterState === "open" && (
          <div className="h-full w-full flex flex-col overflow-y-auto no-scrollbar pb-12 relative">
            {/* Cinematic Lighting */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-full bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.1)_0%,transparent_50%)] pointer-events-none" />

            {/* Display Area */}
            <div className="px-6 pt-10 pb-6 flex flex-col items-center gap-8 relative z-10">
              {garageBike ? (
                <>
                  <div className="text-center space-y-1">
                    <span className="text-[9px] font-black text-cyan-500 tracking-[0.4em] uppercase">Primary Asset</span>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{garageBike.name}</h2>
                  </div>

                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }} className="relative">
                     {/* Spotlight Shadow */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-40 h-8 bg-cyan-400/20 blur-[25px] rounded-[100%] z-0" />
                    <BikeCard bike={garageBike} size="large" showDetails={true} />
                  </motion.div>

                  <GameButton variant="secondary" onClick={() => setShowBikeSelectModal(true)} className="px-10 h-14">
                    RE-CONFIGURE MACHINE
                  </GameButton>
                </>
              ) : (
                <div className="py-20 flex flex-col items-center gap-6 opacity-30 italic">
                  <Activity className="w-12 h-12 text-slate-700" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No Asset Registered</p>
                  <GameButton onClick={() => setShowBikeSelectModal(true)}>Register Machine</GameButton>
                </div>
              )}
            </div>

            {/* Diagnostic Signage Section */}
            <div className="px-6 space-y-4 relative z-10">
              <div className="bg-slate-900/80 border-2 border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
                <div className="bg-cyan-500/5 px-5 py-3 border-b border-cyan-500/10 flex items-center gap-3">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Diagnostic Win-Rate Feed</span>
                </div>
                <div className="p-6 space-y-6">
                  {statsQuery.isLoading ? (
                    <div className="flex items-center gap-3 py-10 opacity-20"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px] font-black tracking-widest uppercase">Syncing...</span></div>
                  ) : (() => {
                    const stats = statsQuery.data?.stats || [];
                    const totalWins = stats.reduce((s, r) => s + r.wins, 0);
                    return (
                      <div className="grid gap-6">
                        <div className="flex justify-between items-end border-b-2 border-white/5 pb-4">
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Grand Total</p>
                            <span className="text-3xl font-black text-white italic tracking-tighter">{totalWins} <span className="text-sm not-italic text-slate-500">VICTORIES</span></span>
                          </div>
                          <div className="h-10 w-24 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          {stats.map(row => (
                            <div key={row.edition} className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400 italic">{row.edition.replace('_', ' ')}</span>
                                <span className="text-cyan-400 italic">{row.winRate}% EFFICIENCY</span>
                              </div>
                              <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${row.winRate}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.3)]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bike Selection Modal (Integrated) */}
      <AnimatePresence>
        {showBikeSelectModal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-slate-900 border-2 border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85%]">
              <div className="p-6 border-b border-white/5 bg-slate-950/40 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-cyan-500 uppercase italic tracking-widest">System Archive</span>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mt-1">Select Machine</h3>
                </div>
                <button onClick={() => setShowBikeSelectModal(false)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 bg-slate-950/20">
                {filteredBikes.map((bike: any) => (
                  <motion.div 
                    key={bike.id} whileTap={{ scale: 0.98 }} onClick={() => handleSelectBike(bike.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl border-2 border-white/5 bg-slate-900/60 hover:bg-slate-800/80 hover:border-cyan-500/30 cursor-pointer transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center overflow-hidden"><img src={bike.photoUrl || ""} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-white italic uppercase truncate">{bike.name}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{bike.maker} // {bike.horsepower}PS</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="p-4 bg-slate-950/40 border-t border-white/5">
                <GameButton variant="secondary" onClick={() => setShowBikeSelectModal(false)} className="w-full py-4 text-[10px]">Cancel Sync</GameButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
