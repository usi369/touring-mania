import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GameButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  glow?: boolean;
}

/**
 * GameButton - A tactile, animated button for gaming interfaces.
 * Logical design: Use physical spring feedback and visual glow.
 */
export default function GameButton({
  children,
  className,
  variant = "primary",
  glow = true,
  disabled,
  ...props
}: GameButtonProps) {
  const variants = {
    primary: "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/50 shadow-cyan-900/20",
    secondary: "bg-slate-800 border-slate-700 text-slate-300 hover:text-white",
    danger: "bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-400/50 shadow-pink-900/20",
    ghost: "bg-transparent border-transparent text-slate-500 hover:text-white",
  };

  const glowColor = variant === "danger" ? "rgba(236,72,153,0.4)" : "rgba(34,211,238,0.4)";

  return (
    <motion.button
      whileHover={!disabled ? { 
        scale: 1.02, 
        boxShadow: glow ? `0 0 25px ${glowColor}` : "none",
        filter: "brightness(1.1)"
      } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
      className={cn(
        "relative px-6 py-3 rounded-xl border-2 font-black italic tracking-widest uppercase text-xs transition-colors overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      
      {/* Subtle glossy overlay */}
      {!disabled && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      )}
    </motion.button>
  );
}
