import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone, ChevronRight as ChevronRightIcon, BellRing } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { api } from '../../lib/api';

export default function FloatingAnnouncements({ announcements, onClose }) {
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    if (announcements && announcements.length > 0) {
      const newItems = announcements.map(ann => ({
        ...ann,
        id: ann.id || Math.random().toString(36).substr(2, 9),
        startTime: Date.now()
      }));
      setVisibleItems(newItems);
    }
  }, [announcements]);

  const handleRemove = (id) => {
    setVisibleItems(prev => prev.filter(item => item.id !== id));
    if (onClose) onClose(id);
  };

  return (
    <div className="fixed bottom-24 md:bottom-8 md:right-8 z-[100000] flex flex-col-reverse gap-3 w-full max-w-[95vw] md:max-w-[380px] pointer-events-none left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 px-4 md:px-0">
      <AnimatePresence mode="popLayout">
        {visibleItems.map((item) => (
          <NotificationItem
            key={item.id}
            item={item}
            onRemove={() => handleRemove(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({ item, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9, rotate: 2 }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        scale: 1, 
        rotate: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 25
        }
      }}
      exit={{ opacity: 0, scale: 0.8, x: 50, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto relative w-full",
        "bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden",
        "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_20px_rgba(79,70,229,0.2)]",
        "z-[100000] group"
      )}
    >
      {/* Decorative Glow Orb */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-bcb-primary/20 blur-[80px] rounded-full group-hover:bg-bcb-primary/30 transition-colors duration-700" />
      
      {/* Top Accent Line (Animated) */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-bcb-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* NEW Badge: Floating Neon Style */}
      {!item.read && (
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-6 left-6 z-10"
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bcb-primary/20 border border-bcb-primary/30 backdrop-blur-sm shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <div className="w-1.5 h-1.5 rounded-full bg-bcb-primary animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">COMUNICADO</span>
          </div>
        </motion.div>
      )}

      {/* Close Button: Futuristic Glass */}
      <button
        onClick={onRemove}
        className="absolute top-6 right-6 z-10 w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all flex items-center justify-center border border-white/10 backdrop-blur-md active:scale-90"
      >
        <X size={18} strokeWidth={2.5} />
      </button>

      <div className="flex flex-col gap-6 p-8 pt-16">
        <div className="flex items-center gap-5">
          {/* Main Icon Container */}
          <div className="shrink-0 relative">
            <div className="absolute inset-0 bg-bcb-primary/30 blur-xl rounded-full animate-pulse" />
            <div className="relative w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-bcb-primary to-indigo-700 p-0.5 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-black/10" />
              {item.imagen_url ? (
                <img
                  src={api.getMediaUrl(item.imagen_url)}
                  className="w-full h-full rounded-[1.4rem] object-cover"
                  alt="BCB"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <BellRing size={28} strokeWidth={2.5} className="animate-bounce" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <h4 className="text-xl font-black text-white uppercase tracking-tighter leading-none italic">
              {item.titulo || 'BCB Global'}
            </h4>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-bcb-primary" />
              <span className="text-[10px] font-bold text-bcb-primary uppercase tracking-[0.2em]">Importante</span>
            </div>
          </div>
        </div>
        
        {/* Message: Elegant Silver Typography */}
        <p className="text-[13px] font-bold text-slate-300 leading-relaxed uppercase tracking-wide">
          {item.mensaje}
        </p>
      </div>

      {/* Action Area */}
      <div className="px-8 pb-8">
        <button
          onClick={onRemove}
          className="relative w-full py-4 rounded-[1.5rem] bg-white text-slate-950 text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_15px_30px_-10px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 group/btn overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
          <span className="relative">Entendido</span>
          <ChevronRightIcon size={16} strokeWidth={3} className="relative group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}