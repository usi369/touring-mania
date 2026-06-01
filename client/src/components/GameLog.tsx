import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollText, Terminal, Activity, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  time: Date;
}

interface GameLogProps {
  logs: LogEntry[];
  isOpen: boolean;
  unreadCount: number;
  onClose: () => void;
  onToggle: () => void;
}

/**
 * GameLog - Cyberpunk System Feed.
 * Logical design: Ambient Storytelling. Turn info into atmosphere.
 */
export default function GameLog({ logs, isOpen, unreadCount, onToggle }: GameLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      requestAnimationFrame(() => {
        const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      });
    }
  }, [logs, isOpen]);

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden font-mono">
      
      {/* 1. Integrated HUD Toggle */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <button
          onClick={onToggle}
          className={cn(
            "group flex items-center gap-3 px-4 py-2 rounded-xl border-2 transition-all duration-300",
            isOpen 
              ? "bg-slate-900/90 border-cyan-500/50 text-cyan-400" 
              : "bg-slate-950/40 border-white/10 text-slate-500 hover:border-cyan-500/40 hover:text-slate-300"
          )}
        >
          <div className="relative">
            <Activity className={cn("w-4 h-4", isOpen && "animate-pulse")} />
            {unreadCount > 0 && !isOpen && (
              <span className="absolute -top-2 -right-2 w-3 h-3 bg-pink-500 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-black tracking-widest uppercase italic">System Log</span>
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {/* 2. System Console Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-16 left-4 right-4 h-[40%] bg-slate-950/90 border-2 border-white/5 rounded-2xl shadow-2xl pointer-events-auto backdrop-blur-md overflow-hidden flex flex-col"
          >
            {/* Console Header */}
            <div className="bg-slate-900/80 px-4 py-2 flex justify-between items-center border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-cyan-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Data Stream</span>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 animate-pulse" />
              </div>
            </div>

            {/* Console Output */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-3">
                {logs.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center opacity-20 italic">
                    <p className="text-[10px] text-slate-500">Awaiting Signal...</p>
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <motion.div 
                      key={log.id}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Status Code */}
                        <span className={cn(
                          "text-[8px] font-black px-1.5 py-0.5 rounded shrink-0",
                          log.type === 'info' && "text-cyan-600 bg-cyan-500/10",
                          log.type === 'success' && "text-green-600 bg-green-500/10",
                          log.type === 'error' && "text-pink-600 bg-pink-500/10",
                          log.type === 'warning' && "text-amber-600 bg-amber-500/10"
                        )}>
                          [{log.type.slice(0, 3).toUpperCase()}.{(idx + 1).toString().padStart(3, '0')}]
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-300 leading-relaxed break-words font-medium">
                            {log.message}
                          </p>
                          <span className="text-[7px] text-slate-600 uppercase tracking-tighter mt-1 block">
                            Trace // {log.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                <div className="h-4" />
              </div>
            </ScrollArea>

            {/* Matrix-like Scanning Line */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(to_bottom,transparent_50%,#000_50%)] bg-[size:100%_4px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
