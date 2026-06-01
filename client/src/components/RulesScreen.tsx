import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Terminal, Activity, Database, Book, Shield, Zap } from "lucide-react";
import GameButton from "./ui/GameButton";

interface RulesScreenProps {
  onClose: () => void;
}

const PAGES = [
  {
    id: "overview",
    title: "01 // SYSTEM OVERVIEW",
    icon: <Terminal className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <p className="text-[11px] leading-relaxed text-slate-400 uppercase font-bold">
          TOURING MANIA IS A HIGH-STAKES COMPETITION SYSTEM UTILIZING 78 UNIQUE BIKE ASSETS.
        </p>
        <div className="bg-slate-900/60 border-l-2 border-cyan-500 p-4 rounded-r-xl">
          <p className="text-xs text-slate-200 leading-relaxed italic">
            「宣言されたスペックで相手を凌駕せよ。全てのアセット（手札）を戦場に同期（プレイ）させた者が勝者となる。」
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
            <p className="text-[8px] text-slate-600 font-black mb-1 uppercase">Primary Goal</p>
            <p className="text-[10px] text-white font-bold uppercase">Empty Hand First</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
            <p className="text-[8px] text-slate-600 font-black mb-1 uppercase">Asset Count</p>
            <p className="text-[10px] text-white font-bold uppercase">13 Records / Player</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "flow",
    title: "02 // OPERATION PROTOCOL",
    icon: <Activity className="w-4 h-4" />,
    content: (
      <div className="space-y-3">
        {[
          { step: "01", label: "PRIORITY CHECK", desc: "サイコロで最初の手番（宣言者）を決定。" },
          { step: "02", label: "ASSET SYNC", desc: "各プレイヤーにバイクデータを13枚配布。" },
          { step: "03", label: "SPEC DECLARE", desc: "宣言者が勝負する項目と方向を指定。" },
          { step: "04", label: "DEPLOYMENT", desc: "時計回りに、前のカードより強いデータを投入。" },
          { step: "05", label: "RE-INITIALIZE", desc: "全員がパスすると場が流れ、新たな宣言へ。" },
        ].map((item) => (
          <div key={item.step} className="flex gap-4 items-center bg-slate-900/40 p-3 rounded-xl border border-white/5 group hover:border-cyan-500/30 transition-all">
            <span className="text-xl font-black italic text-slate-700 group-hover:text-cyan-500 transition-colors">{item.step}</span>
            <div>
              <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-[10px] text-slate-400 font-bold">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: "specs",
    title: "03 // PERFORMANCE MATRIX",
    icon: <Database className="w-4 h-4" />,
    content: (
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: "馬力 (PS)", desc: "エンジンの出力限界" },
          { label: "燃費 (km/L)", desc: "エネルギー効率" },
          { label: "シート高 (mm)", desc: "着座接地点の距離" },
          { label: "全長 (mm)", desc: "機体の物理的長さ" },
          { label: "重量 (kg)", desc: "総質量" },
          { label: "価格 (万円)", desc: "調達コスト" },
        ].map(spec => (
          <div key={spec.label} className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
            <p className="text-[10px] font-black text-white italic">{spec.label}</p>
            <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 leading-tight">{spec.desc}</p>
          </div>
        ))}
      </div>
    )
  },
  {
    id: "bind",
    title: "04 // BIND CONSTRAINTS",
    icon: <Shield className="w-4 h-4" />,
    content: (
      <div className="space-y-4">
        <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
          特定の条件下で、追加の「縛りプロトコル」を発動可能です。合致するデータのみが投入を許可されます。
        </p>
        <div className="space-y-2">
          {[
            { label: "MAKER BIND", desc: "同一メーカーの機体のみ" },
            { label: "CYLINDER BIND", desc: "同一気筒数の構成のみ" },
            { label: "DRIVE BIND", desc: "同一変速機（AT/MT）のみ" },
          ].map(b => (
            <div key={b.label} className="flex justify-between items-center bg-pink-500/5 border border-pink-500/20 p-3 rounded-xl">
              <span className="text-[10px] font-black text-pink-400 italic">{b.label}</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
];

/**
 * RulesScreen - Operation Protocol UI.
 * Logical design: Functional Storytelling. Even manual is an asset.
 */
export default function RulesScreen({ onClose }: RulesScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);

  return (
    <div className="absolute inset-0 z-[100] bg-slate-950 flex flex-col font-mono overflow-hidden">
      
      {/* 1. Protocol Header */}
      <div className="shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(8,145,178,0.4)]">
            <Book className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-[10px] font-black text-white italic tracking-[0.2em] uppercase leading-none mb-1">Operation // Manual</h2>
            <p className="text-[7px] text-cyan-500 font-bold uppercase tracking-widest leading-none animate-pulse">Accessing Secure Records...</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Main Terminal Content */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Dynamic Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_cyan_0%,_transparent_70%)]" />
        
        {/* Page Title HUD */}
        <div className="px-8 pt-8 shrink-0">
          <motion.div 
            key={currentPage}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="text-cyan-400">{PAGES[currentPage].icon}</div>
            <h3 className="text-xs font-black text-slate-500 tracking-[0.4em] uppercase">{PAGES[currentPage].title}</h3>
          </motion.div>
          <div className="h-0.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-cyan-500 shadow-[0_0_10px_cyan]"
              animate={{ width: `${((currentPage + 1) / PAGES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Scrollable Protocol Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {PAGES[currentPage].content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. Navigation Controls */}
        <div className="shrink-0 p-8 bg-slate-950/80 border-t border-white/5 flex gap-4">
          {currentPage > 0 ? (
            <GameButton variant="secondary" onClick={() => setCurrentPage(prev => prev - 1)} className="flex-1 py-4">
              <ChevronLeft className="w-4 h-4 mr-2" /> PREV
            </GameButton>
          ) : (
            <GameButton variant="ghost" onClick={onClose} className="flex-1 py-4 opacity-40">EXIT</GameButton>
          )}

          {currentPage < PAGES.length - 1 ? (
            <GameButton variant="primary" onClick={() => setCurrentPage(prev => prev + 1)} className="flex-1 py-4">
              NEXT <ChevronRight className="w-4 h-4 ml-2" />
            </GameButton>
          ) : (
            <GameButton variant="primary" onClick={onClose} className="flex-1 py-4">
              SYNC & CLOSE
            </GameButton>
          )}
        </div>
      </div>

      {/* Footer Meta */}
      <div className="px-8 py-3 flex justify-between items-center opacity-30">
        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest italic">User // {navigator.platform}</span>
        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">TM-PROTOCOL-V7</span>
      </div>
    </div>
  );
}
