import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'bg-[#060606]/80 backdrop-blur-xl text-emerald-500 border-emerald-500/20 shadow-emerald-500/5',
  error: 'bg-[#060606]/80 backdrop-blur-xl text-rose-500 border-rose-500/20 shadow-rose-500/5',
  warning: 'bg-[#060606]/80 backdrop-blur-xl text-amber-500 border-amber-500/20 shadow-amber-500/5',
  info: 'bg-[#060606]/80 backdrop-blur-xl text-admin-accent border-admin-accent/20 shadow-admin-accent/5',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] space-y-3 flex flex-col items-end pointer-events-none">
        {toasts.map(toast => {
          const Icon = toastIcons[toast.type];
          return (
            <div
              key={toast.id}
              className={cn(
                "flex items-center gap-4 px-6 py-5 rounded-[2rem] border shadow-2xl min-w-[320px] max-w-[450px] pointer-events-auto",
                "animate-in slide-in-from-right-5 fade-in duration-500",
                toastStyles[toast.type]
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20' :
                toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                'bg-admin-accent/10 border-admin-accent/20'
              )}>
                <Icon size={20} strokeWidth={2.5} />
              </div>
              <p className="flex-1 text-[11px] font-black uppercase tracking-widest leading-relaxed">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-500 hover:text-white"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] space-y-3 flex flex-col">
      {toasts.map(toast => {
        const Icon = toastIcons[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl min-w-[300px] max-w-[400px]",
              "animate-in slide-in-from-right-5 fade-in duration-300",
              toastStyles[toast.type]
            )}
          >
            <Icon size={20} />
            <p className="flex-1 text-sm font-bold">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
