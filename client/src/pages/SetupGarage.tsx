import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Sparkles, Loader2, Warehouse, Check, Zap, Cpu, Settings, Activity } from "lucide-react";
import GameButton from "@/components/ui/GameButton";

type SetupMode = "menu" | "select" | "register";

export default function SetupGarage() {
  const { isLoaded: isAuthLoaded, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<SetupMode>("menu");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "large" | "medium" | "small">("all");

  // Form States
  const [name, setName] = useState("");
  const [maker, setMaker] = useState("");
  const [category, setCategory] = useState<"large" | "medium" | "small">("medium");
  const [cylinders, setCylinders] = useState("単");
  const [transmission, setTransmission] = useState<"AT" | "MT">("MT");
  const [horsepower, setHorsepower] = useState<number | "">("");
  const [fuelEfficiency, setFuelEfficiency] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [seatHeight, setSeatHeight] = useState<number | "">("");
  const [totalLength, setTotalLength] = useState<number | "">("");
  const [year, setYear] = useState<number | "">(new Date().getFullYear());
  const [price, setPrice] = useState<number | "">("");
  const [displacement, setDisplacement] = useState<number | "">("");
  const [engineType, setEngineType] = useState("4st");
  const [bikeStyle, setBikeStyle] = useState<"scooter" | "supersport" | "american">("supersport");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const bikesQuery = trpc.bike.list.useQuery(undefined, { enabled: isAuthenticated });
  const setGarageBikeMutation = trpc.garage.setGarageBike.useMutation();
  const registerGarageBikeMutation = trpc.garage.registerGarageBike.useMutation();

  useEffect(() => {
    if (isAuthLoaded && !isAuthenticated) setLocation("/");
  }, [isAuthLoaded, isAuthenticated]);

  if (!isAuthLoaded || !isAuthenticated) {
    return <div className="h-full w-full bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;
  }

  const handleChooseBike = async (bikeId: number) => {
    try {
      setIsSubmitting(true);
      const res = await setGarageBikeMutation.mutateAsync({ bikeId });
      if (res.success) { await utils.garage.getGarage.refetch(); setLocation("/"); }
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleRegisterBike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !maker || !horsepower || !fuelEfficiency || !weight || !seatHeight || !totalLength || !year || !price || !displacement) {
      setErrorMsg("Missing critical spec data."); return;
    }
    setIsSubmitting(true);
    try {
      const res = await registerGarageBikeMutation.mutateAsync({
        name, maker, category, cylinders, transmission, horsepower: Number(horsepower), fuelEfficiency: Number(fuelEfficiency),
        weight: Number(weight), seatHeight: Number(seatHeight), totalLength: Number(totalLength), year: Number(year), price: Number(price),
        photoUrl: `/pictogram_${bikeStyle}.png`, displacement: String(displacement), displacementUnit: "cc", engineType,
      });
      if (res.success) { await utils.garage.getGarage.refetch(); await utils.bike.list.refetch(); setLocation("/"); }
    } catch (err: any) { setErrorMsg(err.message || "Sync Error"); } finally { setIsSubmitting(false); }
  };

  const filteredBikes = bikesQuery.data?.filter((b: any) => selectedCategory === "all" || b.category === selectedCategory) || [];

  return (
    <div className="h-full w-full bg-[#020617] text-slate-100 relative overflow-hidden flex flex-col font-mono">
      {/* 1. Header (Lab HUD) */}
      <div className="z-30 shrink-0 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => mode === "menu" ? setLocation("/my-garage") : setMode("menu")} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all">
            <ChevronLeft className="w-4 h-4 text-cyan-400" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[10px] font-black text-white italic tracking-[0.2em] uppercase leading-none mb-1">Module // Tuning</h1>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none">
              {mode === "menu" ? "Mode Selection" : mode === "select" ? "Asset Archive" : "Manual Calibrating"}
            </p>
          </div>
        </div>
        <Settings className="w-4 h-4 text-slate-700 animate-spin-slow" />
      </div>

      <div className="flex-1 flex flex-col relative z-10 min-h-0">
        <AnimatePresence mode="wait">
          
          {/* --- Mode Select --- */}
          {mode === "menu" && (
            <motion.div key="menu" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="h-full flex flex-col justify-center px-6 space-y-6 text-center">
              <div className="mb-4">
                <div className="w-20 h-20 rounded-[2rem] bg-slate-900 border-2 border-cyan-500/20 flex items-center justify-center mx-auto mb-6 shadow-cyan-900/20 shadow-2xl">
                  <Cpu className="w-10 h-10 text-cyan-400 animate-pulse" />
                </div>
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Machine Link Initiation</h2>
                <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-widest leading-relaxed">Select synchronization method to <br/>establish primary asset link.</p>
              </div>

              <div className="grid gap-4">
                <button onClick={() => setMode("select")} className="w-full bg-slate-900/60 border-2 border-white/5 hover:border-cyan-500/40 rounded-3xl p-6 text-left transition-all group flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform text-cyan-400"><Warehouse className="w-6 h-6" /></div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-white italic uppercase leading-none">Asset Database</h3>
                    <p className="text-[8px] text-slate-500 mt-2 uppercase font-bold tracking-tighter">Query existing machine records from central archive.</p>
                  </div>
                </button>
                <button onClick={() => setMode("register")} className="w-full bg-slate-900/60 border-2 border-white/5 hover:border-pink-500/40 rounded-3xl p-6 text-left transition-all group flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-pink-950 border border-pink-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform text-pink-400"><Zap className="w-6 h-6" /></div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-white italic uppercase leading-none">Manual Override</h3>
                    <p className="text-[8px] text-slate-500 mt-2 uppercase font-bold tracking-tighter">Enter raw performance specs for non-indexed assets.</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* --- Asset Select --- */}
          {mode === "select" && (
            <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col overflow-hidden">
              <div className="shrink-0 px-4 py-3 bg-slate-950/40 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
                {(["all", "large", "medium", "small"] as const).map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-cyan-600/20 border-cyan-400 text-cyan-100 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 bg-slate-950/20">
                {filteredBikes.map((bike: any) => (
                  <motion.div key={bike.id} whileTap={{ scale: 0.98 }} onClick={() => handleChooseBike(bike.id)} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-white/5 bg-slate-900/60 hover:bg-slate-800/80 hover:border-cyan-500/30 transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center overflow-hidden"><img src={bike.photoUrl || ""} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-white italic uppercase truncate">{bike.name}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{bike.maker} // {bike.horsepower}PS</p>
                    </div>
                    <Check className="w-4 h-4 text-cyan-500 opacity-0 group-hover:opacity-100" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* --- Manual Register (Tuning) --- */}
          {mode === "register" && (
            <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col overflow-hidden">
              <form onSubmit={handleRegisterBike} className="h-full flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 bg-slate-950/20">
                  {errorMsg && <div className="p-4 bg-pink-950/30 border-2 border-pink-500/20 text-pink-400 rounded-2xl text-[10px] font-black uppercase text-center">{errorMsg}</div>}

                  {/* Tuning Section: Core */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <Activity className="w-3 h-3 text-cyan-500" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset Identification</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase">Maker // ID</label>
                        <input type="text" required placeholder="MAKER" value={maker} onChange={(e) => setMaker(e.target.value.toUpperCase())} className="w-full h-12 px-4 rounded-xl bg-slate-950 border-2 border-white/5 text-white text-[10px] font-black focus:border-cyan-500/50 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase">Model // Name</label>
                        <input type="text" required placeholder="MODEL" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full h-12 px-4 rounded-xl bg-slate-950 border-2 border-white/5 text-white text-[10px] font-black focus:border-cyan-500/50 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Tuning Section: Performance */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <Zap className="w-3 h-3 text-pink-500" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Performance Matrix</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { label: "Power (PS)", value: horsepower, set: setHorsepower, max: 250 },
                         { label: "Efficiency (km/L)", value: fuelEfficiency, set: setFuelEfficiency, max: 100 },
                         { label: "Weight (kg)", value: weight, set: setWeight, max: 400 },
                         { label: "Displacement (cc)", value: displacement, set: setDisplacement, max: 2000 }
                       ].map(spec => (
                         <div key={spec.label} className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                           <div className="flex justify-between items-baseline">
                             <label className="text-[8px] font-black text-slate-500 uppercase">{spec.label}</label>
                             <span className="text-xs font-black text-cyan-400 italic">{spec.value || "---"}</span>
                           </div>
                           <input type="number" required value={spec.value} onChange={(e) => spec.set(e.target.value ? Number(e.target.value) : "")} className="w-full h-8 bg-slate-950 rounded-lg px-3 text-[10px] font-black border border-white/5 focus:border-cyan-500/30 outline-none" />
                           <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                             <motion.div animate={{ width: `${Math.min((Number(spec.value) / spec.max) * 100, 100)}%` }} className="h-full bg-cyan-500/40" />
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* Visual Protocol Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <Warehouse className="w-3 h-3 text-cyan-500" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visual Profile protocol</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(["scooter", "supersport", "american"] as const).map(style => (
                        <button key={style} type="button" onClick={() => setBikeStyle(style)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${bikeStyle === style ? 'bg-cyan-600/10 border-cyan-400 shadow-lg shadow-cyan-900/20' : 'bg-slate-950 border-white/5 text-slate-600'}`}>
                          <img src={`/pictogram_${style}.png`} className="w-10 h-10 grayscale brightness-75 mix-blend-screen" />
                          <span className="text-[8px] font-black uppercase tracking-tighter">{style}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-950 border-t border-white/5 flex gap-4">
                  <GameButton type="submit" disabled={isSubmitting} className="flex-1 py-4 text-xs">
                    {isSubmitting ? "TRANSMITTING..." : "COMMIT CALIBRATION"}
                  </GameButton>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 8s linear infinite; }` }} />
    </div>
  );
}
