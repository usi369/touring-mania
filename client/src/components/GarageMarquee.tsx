import { motion } from "framer-motion";

interface GarageMarqueeProps {
  bikes?: any[];
}

export default function GarageMarquee({}: GarageMarqueeProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0, scaleY: 0 }}
      animate={{ height: 96, opacity: 1, scaleY: 1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        backgroundImage: "url('/pixel_art_space.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        imageRendering: "pixelated",
        transformOrigin: "top",
      }}
      className="w-full border border-slate-800 rounded-xl relative overflow-hidden flex flex-col items-center justify-center shadow-inner mt-4"
    >
      {/* 走査線（スキャンライン）エフェクト */}
      <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] pointer-events-none" />

      {/* サイバー風グリッドオーバーレイ */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* 暗がりを追加して文字の視認性を高める */}
      <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />

      {/* コーナー装飾 (レトロフューチャー感) */}
      <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-cyan-500/50" />
      <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-cyan-500/50" />
      <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-cyan-500/50" />
      <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-cyan-500/50" />

      {/* レトロなテキストとステータス表示 */}
      <div className="relative z-10 text-center space-y-1 select-none">
        <div className="text-[11px] font-mono text-cyan-400 tracking-[0.25em] uppercase animate-pulse">
          Establishing Connection
        </div>
        <div className="text-[8px] font-mono text-slate-400 tracking-widest">
          SYS_SECURE_LINK: WAITING_RESPONSE
        </div>
      </div>

      {/* 左右のソフトなフェードマスク */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-slate-950/20 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-slate-950/20 to-transparent z-10 pointer-events-none" />
    </motion.div>
  );
}
