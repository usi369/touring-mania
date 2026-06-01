import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, ChevronUp, ChevronDown, SortAsc, Database, Search, Filter } from "lucide-react";
import BikeCard from "@/components/BikeCard";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameButton from "@/components/ui/GameButton";

export default function Encyclopedia() {
  const [, setLocation] = useLocation();
  const [cachedData, setCachedData] = useState<any[] | null>(() => {
    const saved = localStorage.getItem('bike_encyclopedia_cache');
    return saved ? JSON.parse(saved) : null;
  });

  const bikesQuery = trpc.bike.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (bikesQuery.data && bikesQuery.data.length > 0) {
      localStorage.setItem('bike_encyclopedia_cache', JSON.stringify(bikesQuery.data));
      setCachedData(bikesQuery.data);
    }
  }, [bikesQuery.data]);

  const [sortKey, setSortKey] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterEdition, setFilterEdition] = useState<string>("all");
  const [isScanning, setIsScanning] = useState(false);

  const displayData = useMemo(() => {
    const data = bikesQuery.data || cachedData;
    if (!data) return null;
    let filtered = [...data];
    if (filterEdition !== "all") filtered = filtered.filter(bike => !!bike[filterEdition as keyof typeof bike]);
    return filtered.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      const factor = sortOrder === "asc" ? 1 : -1;
      return valA > valB ? factor : -factor;
    });
  }, [bikesQuery.data, cachedData, sortKey, sortOrder, filterEdition]);

  // Trigger scan animation on filter/sort change
  useEffect(() => {
    setIsScanning(true);
    const timer = setTimeout(() => setIsScanning(false), 600);
    return () => clearTimeout(timer);
  }, [filterEdition, sortKey, sortOrder]);

  const toggleSort = (key: string) => {
    setSortOrder(sortKey === key && sortOrder === "asc" ? "desc" : "asc");
    if (sortKey !== key) setSortKey(key);
  };

  const sortOptions = [
    { key: "id", label: "ID" },
    { key: "horsepower", label: "HP" },
    { key: "fuelEfficiency", label: "FE" },
    { key: "price", label: "PRC" },
    { key: "weight", label: "WGT" },
    { key: "year", label: "YR" },
  ];

  const editionOptions = [
    { key: "all", label: "ALL" },
    { key: "isTokyoRemake", label: "TKY" },
    { key: "isR6Complete", label: "R6C" },
    { key: "isR7Mega", label: "R7M" },
  ];

  return (
    <div className="h-full w-full bg-[#020617] flex flex-col items-center relative overflow-hidden font-mono">
      
      {/* 1. Header Area (System HUD) */}
      <div className="w-full z-30 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setLocation("/")} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all">
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[10px] font-black text-white italic tracking-[0.2em] uppercase leading-none mb-1">Archive // Assets</h1>
            <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest leading-none">Accessing Central Database...</p>
          </div>
        </div>
        <Database className="w-4 h-4 text-slate-700" />
      </div>

      <div className="w-full h-full flex flex-col relative z-10">
        
        {/* 2. Control Console (Filters & Sort) */}
        <div className="shrink-0 p-4 space-y-4 bg-slate-900/40 border-b border-white/5">
          {/* Edition Selectors */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {editionOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setFilterEdition(opt.key)}
                className={`px-4 py-2 rounded-lg border-2 text-[9px] font-black tracking-widest transition-all ${
                  filterEdition === opt.key ? 'bg-cyan-600/20 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort Toggles */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-2 mr-2 px-2 border-r border-white/10">
              <SortAsc className="w-3 h-3 text-slate-600" />
            </div>
            {sortOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => toggleSort(opt.key)}
                className={`px-3 py-1.5 rounded border text-[8px] font-black uppercase tracking-tight transition-all flex items-center gap-1.5 ${
                  sortKey === opt.key ? 'bg-slate-800 border-cyan-500/50 text-cyan-400' : 'bg-transparent border-white/5 text-slate-600 hover:text-slate-400'
                }`}
              >
                {opt.label}
                {sortKey === opt.key && (sortOrder === "asc" ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />)}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Main Data Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 relative bg-slate-950/40">
          
          {/* Scanning Line Effect */}
          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ top: 0, opacity: 0 }}
                animate={{ top: "100%", opacity: [0, 1, 0] }}
                transition={{ duration: 0.6, ease: "linear" }}
                className="absolute left-0 w-full h-1 bg-cyan-400/40 shadow-[0_0_15px_cyan] z-20 pointer-events-none"
              />
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4 place-items-center pb-20">
            <AnimatePresence mode="popLayout">
              {displayData?.map((bike, idx) => (
                <motion.div
                  key={bike.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx % 10 * 0.03, duration: 0.3 }}
                >
                  <BikeCard bike={bike as any} showDetails={true} isPokerRatio={true} isEncyclopedia={true} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {!displayData?.length && !bikesQuery.isLoading && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-700 italic">
              <Search className="w-8 h-8 mb-4 opacity-20" />
              <p className="text-[10px] uppercase font-black tracking-widest">No matching records</p>
            </div>
          )}
        </div>

        {/* 4. Console Footer Status */}
        <div className="shrink-0 px-6 py-3 bg-slate-950 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">System Link Active</span>
          </div>
          <p className="text-[9px] font-mono text-cyan-500/60 font-bold uppercase">
            {displayData?.length || 0} Assets Loaded // VER.7.0.1
          </p>
        </div>
      </div>
    </div>
  );
}
