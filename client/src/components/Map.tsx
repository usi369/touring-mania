import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Crosshair, Map as MapIcon, Loader2, Activity } from "lucide-react";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

// High-tech dark style for Google Maps
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#020617" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#020617" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#06b6d4" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#0891b2" }, { opacity: 0.2 }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
];

function loadMapScript() {
  return new Promise(resolve => {
    if (window.google) { resolve(null); return; }
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => { resolve(null); script.remove(); };
    script.onerror = () => console.error("Failed to load Google Maps script");
    document.head.appendChild(script);
  });
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  title?: string;
}

/**
 * MapView - Navigation HUD.
 * Logical design: Spatial Awareness. Maps as pilot instruments.
 */
export function MapView({
  className,
  initialCenter = { lat: 35.6812, lng: 139.7671 }, // Tokyo
  initialZoom = 14,
  onMapReady,
  title = "ACTIVE_ROUTE_SYNC",
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const init = usePersistFn(async () => {
    await loadMapScript();
    if (!mapContainer.current) return;
    
    map.current = new window.google.maps.Map(mapContainer.current, {
      zoom: initialZoom,
      center: initialCenter,
      styles: MAP_STYLE,
      disableDefaultUI: true,
      mapId: "TM_HUD_MAP",
    });
    
    setIsLoaded(true);
    if (onMapReady) onMapReady(map.current);
  });

  useEffect(() => { init(); }, [init]);

  return (
    <div className={cn("relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-[2.5rem] border-2 border-white/5 bg-slate-950 shadow-2xl group", className)}>
      
      {/* 1. Map Container */}
      <div ref={mapContainer} className="w-full h-full opacity-60 group-hover:opacity-80 transition-opacity" />

      {/* 2. HUD Overlays (Top) */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_cyan]" />
            <span className="text-[10px] font-black text-white italic tracking-[0.2em] uppercase leading-none">{title}</span>
          </div>
          <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">NAV_SYSTEM // V2.4</p>
        </div>
        <Compass className="w-5 h-5 text-slate-700 animate-spin-slow" />
      </div>

      {/* 3. HUD Overlays (Bottom) */}
      <div className="absolute bottom-0 left-0 w-full p-6 pointer-events-none z-10 flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[7px] text-slate-600 font-black uppercase tracking-widest">Coordinates</p>
            <p className="text-[9px] font-mono text-cyan-500/80 font-bold">
              {initialCenter.lat.toFixed(4)}N / {initialCenter.lng.toFixed(4)}E
            </p>
          </div>
          <div className="text-right">
            <p className="text-[7px] text-slate-600 font-black uppercase tracking-widest">Status</p>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-green-500" />
              <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter leading-none">Signal_Stable</span>
            </div>
          </div>
        </div>
        
        {/* Decorative Scanners */}
        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
          <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        </div>
      </div>

      {/* 4. Scanning & Loading States */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div exit={{ opacity: 0 }} className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">Syncing Satellites...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crosshair Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
        <Crosshair className="w-12 h-12 text-cyan-500" />
      </div>

      {/* Subtle Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.03] bg-[size:100%_4px] bg-[linear-gradient(to_bottom,transparent_50%,#000_50%)]" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}} />
    </div>
  );
}
