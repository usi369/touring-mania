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
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [logs, isOpen]);

  return (
    <>
      {/* Toggle Button - Floating Icon */}
      <div className="fixed bottom-20 right-4 z-40">
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
          "fixed z-50 transition-all duration-500 ease-in-out overflow-hidden flex flex-col border border-slate-700 shadow-2xl",
          // Mobile: Bottom sheet / Full screen
          "bottom-0 left-0 right-0 h-[60vh] sm:h-[400px] rounded-t-2xl sm:rounded-2xl",
          // Desktop: Bottom right box
          "sm:bottom-6 sm:right-6 sm:left-auto sm:w-80",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">ゲームログ</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea ref={scrollRef} className="flex-1 bg-slate-900/95 backdrop-blur-md p-3">
          <div className="space-y-3 pb-4">
            {logs.length === 0 ? (
              <p className="text-center text-slate-600 text-xs py-8">ログはありません</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-1">
                  <div className="flex justify-between items-center">
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                      log.type === 'info' && "bg-blue-500/10 text-blue-400",
                      log.type === 'success' && "bg-green-500/10 text-green-400",
                      log.type === 'error' && "bg-red-500/10 text-red-400",
                      log.type === 'warning' && "bg-amber-500/10 text-amber-400"
                    )}>
                      {log.type}
                    </span>
                    <span className="text-[9px] text-slate-600">
                      {log.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed pl-1 border-l-2 border-slate-800">
                    {log.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer / Fade effect */}
        <div className="h-4 bg-gradient-to-t from-slate-900 to-transparent shrink-0" />
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
