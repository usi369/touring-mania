import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, ScrollText, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function GameLog({ logs, isOpen, unreadCount, onClose, onToggle }: GameLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive or opened
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated before scrolling
      requestAnimationFrame(() => {
        if (!scrollRef.current) return;
        const viewport = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"], [data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      });
    }
  }, [logs, isOpen]);

  return (
    <>
      {/* Toggle Button - Floating Icon */}
      <div className="fixed bottom-24 right-4 sm:right-6 z-[60]">
        <Button
          onClick={onToggle}
          size="icon"
          className={cn(
            "w-12 h-12 rounded-full shadow-lg transition-all duration-300",
            isOpen ? "bg-slate-700 scale-0 opacity-0" : "bg-cyan-600 hover:bg-cyan-500 scale-100 opacity-100"
          )}
        >
          <ScrollText className="w-6 h-6 text-white" />
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* Log Window */}
      <div
        className={cn(
          "fixed z-50 transition-all duration-500 ease-in-out overflow-hidden flex flex-col border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]",
          // Mobile: Bottom sheet / Full screen
          "bottom-0 left-0 right-0 h-[70vh] sm:h-[520px] rounded-t-3xl sm:rounded-2xl",
          // Desktop: Bottom right box
          "sm:bottom-6 sm:right-6 sm:left-auto sm:w-[340px] bg-slate-900/95 backdrop-blur-xl",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-slate-800/50 border-b border-white/10 p-4 flex justify-between items-center shrink-0 relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
          <div className="flex items-center gap-3">
            <ScrollText className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-black text-white tracking-tight uppercase italic">Battle Log</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea ref={scrollRef} className="flex-1">
          <div className="space-y-4 p-4 pb-12">
            {logs.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-30">
                <MessageSquare className="w-12 h-12 mb-3 text-slate-600" />
                <p className="text-center text-slate-500 text-sm font-bold uppercase tracking-widest">No Data Logged</p>
              </div>
            ) : (
              <>
                {logs.map((log) => (
                  <div key={log.id} className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 group">
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded tracking-tighter uppercase",
                        log.type === 'info' && "bg-blue-500/20 text-blue-400 border border-blue-500/20",
                        log.type === 'success' && "bg-green-500/20 text-green-400 border border-green-500/20",
                        log.type === 'error' && "bg-red-500/20 text-red-400 border border-red-500/20",
                        log.type === 'warning' && "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                      )}>
                        {log.type}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono">
                        {log.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="pl-3 border-l-2 border-slate-800 group-hover:border-slate-600 transition-colors">
                      <p className="text-sm text-slate-100 font-medium leading-relaxed tracking-tight">
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
                {/* 下部が見切れるのを防ぐための十分なスペース */}
                <div className="h-6" aria-hidden="true" />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Fade */}
        <div className="h-6 bg-gradient-to-t from-slate-950 to-transparent shrink-0 pointer-events-none" />
      </div>

      {/* Overlay for mobile to close when tapping outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden animate-in fade-in duration-300" 
          onClick={onClose}
        />
      )}
    </>
  );
}
