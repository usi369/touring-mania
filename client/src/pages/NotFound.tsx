import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden font-sans">
      {/* Background Cyberpunk Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(236,72,153,0.1)_0%,_transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
            <AlertCircle className="relative h-24 w-24 text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
          </div>
        </div>

        <h1 className="text-6xl font-black text-white italic tracking-tighter mb-2 italic">404</h1>
        <h2 className="text-xl font-bold text-slate-300 uppercase tracking-widest mb-6">
          System Error: <span className="text-pink-500">Route Not Found</span>
        </h2>

        <p className="text-slate-500 text-[11px] font-bold uppercase leading-relaxed mb-10 max-w-[240px]">
          The requested data segment does not exist or has been relocated to another sector.
        </p>

        <Button
          onClick={handleGoHome}
          className="group relative h-14 px-10 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-black text-sm rounded-xl shadow-lg transition-all uppercase tracking-widest"
        >
          <div className="flex items-center gap-3">
            <Home className="w-4 h-4" />
            <span>Emergency Abort</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
