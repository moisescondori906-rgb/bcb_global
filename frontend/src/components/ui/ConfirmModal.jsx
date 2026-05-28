import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'danger' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={onCancel}
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative z-10 max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-1.5 ${variant === 'danger' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`} />
            
            <button 
              onClick={onCancel}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center gap-6">
              <div className={`
                w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 border
                ${variant === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-lg shadow-rose-500/5' : 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/5'}
              `}>
                <AlertTriangle size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">{title}</h3>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed px-4">{message}</p>
              </div>
            </div>
            
            <div className="flex gap-4 pt-10">
              <button 
                onClick={onCancel} 
                className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/5 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
              >
                {cancelText}
              </button>
              <button 
                onClick={onConfirm} 
                className={`flex-1 h-14 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                  variant === 'danger' 
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' 
                    : 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
