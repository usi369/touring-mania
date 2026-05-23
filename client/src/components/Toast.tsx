import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    success: 'bg-green-900/40 border-green-500/40 backdrop-blur-md',
    error: 'bg-red-900/40 border-red-500/40 backdrop-blur-md',
    info: 'bg-slate-900/60 border-slate-700/60 backdrop-blur-md',
  }[message.type];

  const textColor = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400',
  }[message.type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[message.type];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, transition: { duration: 0.8, ease: "easeInOut" } }}
      layout
      className={`${bgColor} border rounded-xl p-4 flex gap-3 items-start pointer-events-auto shadow-[0_4px_20px_rgba(0,0,0,0.4)] border-white/10`}
    >
      <Icon className={`${textColor} flex-shrink-0 w-5 h-5 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className={`${textColor} font-bold text-sm sm:text-base tracking-tight`}>{message.title}</p>
        {message.message && (
          <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">{message.message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(message.id)}
        className="flex-shrink-0 text-slate-500 hover:text-white transition-colors p-1"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
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
      <div 
        className="fixed bottom-6 right-6 z-[1000] w-full max-w-[320px] sm:max-w-sm flex flex-col gap-3 pointer-events-none"
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
