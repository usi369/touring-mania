import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const duration = message.duration || 4000;
    const timer = setTimeout(() => {
      onClose(message.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const bgColor = {
    success: 'bg-green-900/40 border-green-500/40',
    error: 'bg-red-900/40 border-red-500/40',
    info: 'bg-slate-900/60 border-slate-700/60',
  }[message.type];

  const textColor = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-cyan-400',
  }[message.type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[message.type];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.3 } }}
      layout
      className={cn(
        "relative p-4 rounded-2xl border-2 flex gap-4 items-center pointer-events-auto backdrop-blur-xl shadow-2xl",
        bgColor,
        "border-white/10"
      )}
    >
      <div className={cn("p-2 rounded-lg bg-slate-950/50 border border-white/5", textColor)}>
        <Icon className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn("font-black text-[10px] uppercase tracking-widest italic leading-none", textColor)}>{message.title}</p>
        {message.message && (
          <p className="text-slate-400 text-[9px] font-bold mt-1 leading-tight uppercase line-clamp-1">{message.message}</p>
        )}
      </div>

      <button
        onClick={() => onClose(message.id)}
        className="shrink-0 p-1 text-slate-600 hover:text-white transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
};

export interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = React.useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 4000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { id, type, title, message, duration };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue = React.useMemo(() => ({
    toasts,
    addToast,
    removeToast,
    clearToasts
  }), [toasts, addToast, removeToast, clearToasts]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Container - Centered within the Stage via absolute positioning */}
      <div 
        className="absolute bottom-24 left-6 right-6 z-[1000] flex flex-col gap-3 pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
