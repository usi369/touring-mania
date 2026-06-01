import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2, Send, User, Sparkles, Activity, Terminal } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Streamdown } from "streamdown";
import { motion, AnimatePresence } from "framer-motion";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIChatBoxProps = {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  height?: string | number;
  emptyStateMessage?: string;
};

/**
 * AIChatBox - On-board AI Navigator.
 * Logical design: Functional Storytelling. AI as a machine co-pilot.
 */
export function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Communicate with System AI...",
  className,
  height = "500px",
  emptyStateMessage = "Initialize AI Link Protocol",
}: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const displayMessages = messages.filter((msg) => msg.role !== "system");

  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-slate-950/90 border-2 border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl relative font-mono",
        className
      )}
      style={{ height }}
    >
      {/* 1. AI HUD Header */}
      <div className="bg-slate-900/80 px-5 py-3 border-b border-white/5 flex justify-between items-center shrink-0 relative">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className={cn("w-4 h-4 text-cyan-400", isLoading && "animate-pulse")} />
            {isLoading && <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-md animate-ping" />}
          </div>
          <span className="text-[10px] font-black text-white italic uppercase tracking-[0.2em]">Navi // AI Sync</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/30" />
        </div>
      </div>

      {/* 2. Messages Terminal */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-5">
        <div className="space-y-6">
          {displayMessages.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center opacity-20 text-center px-8">
              <Terminal className="w-10 h-10 mb-4 text-slate-500" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                {emptyStateMessage}<br />
                Awaiting initial input segment...
              </p>
            </div>
          ) : (
            displayMessages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ x: message.role === "user" ? 10 : -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={cn(
                  "flex flex-col gap-2",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">
                    {message.role === "user" ? "Protocol // Rider" : "Protocol // Navi"}
                  </span>
                </div>
                
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl p-4 text-[11px] leading-relaxed font-medium shadow-lg border",
                    message.role === "user"
                      ? "bg-cyan-600/10 border-cyan-500/30 text-cyan-50 text-right italic"
                      : "bg-slate-900 border-white/5 text-slate-300"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-xs prose-invert max-w-none">
                      <Streamdown>{message.content}</Streamdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))
          )}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
              <div className="bg-slate-900 border border-white/5 rounded-xl p-3 flex gap-2 items-center">
                <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Syncing Response...</span>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* 3. Terminal Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-5 border-t border-white/5 bg-slate-950/50 flex gap-3 items-end"
      >
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSubmit(e))}
            placeholder={placeholder}
            className="w-full bg-slate-950 border-2 border-white/5 focus:border-cyan-500/40 rounded-xl px-4 py-3 text-[10px] font-black text-white placeholder:text-slate-700 resize-none min-h-[50px] transition-all outline-none italic tracking-widest"
            rows={1}
          />
          <div className="absolute right-3 bottom-3 opacity-20 pointer-events-none">
            <span className="text-[7px] font-black text-cyan-400">TX // SEND</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="h-[50px] w-14 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center shadow-lg shadow-cyan-900/20"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </form>

      {/* Scanning lines for atmosphere */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[size:100%_4px] bg-[linear-gradient(to_bottom,transparent_50%,#000_50%)]" />
    </div>
  );
}
