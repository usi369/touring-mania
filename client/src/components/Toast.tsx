import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

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
    if (message.duration) {
      const timer = setTimeout(() => {
        onClose(message.id);
      }, message.duration);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  const bgColor = {
    success: 'bg-green-900/20 border-green-500/30',
    error: 'bg-red-900/20 border-red-500/30',
    info: 'bg-blue-900/20 border-blue-500/30',
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
    <div className={`${bgColor} border rounded-lg p-3 sm:p-4 flex gap-2 sm:gap-3 items-start pointer-events-auto shadow-md backdrop-blur-sm`}>
      <Icon className={`${textColor} flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className={`${textColor} font-semibold text-sm sm:text-base`}>{message.title}</p>
        {message.message && (
          <p className="text-gray-300 text-xs sm:text-sm mt-1">{message.message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(message.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-200 p-1"
      >
        ×
      </button>
    </div>
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
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [toasts]);

  const addToast = (
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 0
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { id, type, title, message, duration };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <div 
        ref={scrollRef}
        className="fixed bottom-4 right-4 z-50 w-full max-w-[280px] sm:max-w-sm max-h-[40vh] sm:max-h-[50vh] overflow-y-auto pr-1 pb-1 pointer-events-none"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex flex-col gap-2 justify-end min-h-full">
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast} onClose={removeToast} />
          ))}
        </div>
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
