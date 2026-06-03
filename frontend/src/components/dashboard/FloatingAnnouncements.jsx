import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone, ChevronRight as ChevronRightIcon } from 'lucide-react';
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
  // Eliminamos el auto-dismiss para asegurar que el usuario vea el anuncio
  // hasta que pulse "Entendido" o lo cierre manualmente.

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 100, scale: 0.8, filter: 'blur(10px)' }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        filter: 'blur(0px)',
        transition: {
          type: "spring",
          stiffness: 260,
          damping: 20
        }
      }}
      exit={{ opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.3 } }}
      className={cn(
        "pointer-events-auto relative w-full",
        "bg-white/95 backdrop-blur-md border border-bcb-primary/20 rounded-[2rem] flex flex-col overflow-hidden",
        "shadow-[0_20px_50px_-10px_rgba(79,70,229,0.3)]", // Premium glow shadow
        "z-[100000]",
        "after:absolute after:inset-0 after:rounded-[2rem] after:shadow-[0_0_20px_rgba(79,70,229,0.15)] after:animate-pulse after:pointer-events-none"
      )}
    >
      {/* Premium Gradient Header Decor */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-bcb-primary via-indigo-400 to-bcb-primary" />

      {/* NEW Badge Premium with Pulse */}
      {!item.read && (
        <motion.span 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute top-4 left-4 z-10"
        >
          <span className="relative flex h-full w-full">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex px-3 py-1 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[9px] font-black uppercase tracking-tighter rounded-full shadow-lg shadow-red-500/20">
              NUEVO
            </span>
          </span>
        </motion.span>
      )}

      {/* Close Button: Elegant */}
      <button
        onClick={onRemove}
        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 transition-all flex items-center justify-center border border-slate-200"
      >
        <X size={14} strokeWidth={3} />
      </button>

      <div className="flex items-start gap-4 p-6 pt-10">
        {/* Thumbnail Image or Icon with Ring */}
        <div className="shrink-0 relative">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -inset-1 bg-bcb-primary/20 rounded-2xl blur-sm" 
          />
          {item.imagen_url ? (
            <img
              src={api.getMediaUrl(item.imagen_url)}
              className="relative w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
              alt="BCB Global"
            />
          ) : (
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-bcb-primary to-indigo-600 flex items-center justify-center text-white border-2 border-white shadow-md">
              <Megaphone size={24} strokeWidth={2.5} />
            </div>
          )}
        </div>
        
        {/* Title and Message */}
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="text-base font-black text-slate-900 uppercase tracking-tighter leading-tight italic bg-gradient-to-r from-bcb-primary to-indigo-600 bg-clip-text text-transparent">
            {item.titulo || 'BCB Global Institucional'}
          </h4>
          <p className="text-[12px] font-bold text-slate-500 leading-snug">
            {item.mensaje}
          </p>
        </div>
      </div>

      {/* Action Button: Ultra Premium */}
      <div className="px-6 pb-6">
        <button
          onClick={onRemove}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-bcb-primary via-indigo-600 to-bcb-primary bg-[length:200%_auto] animate-gradient-x text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-bcb-primary/20 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <span>Entendido</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRightIcon size={14} strokeWidth={3} />
          </motion.div>
        </button>
      </div>
    </motion.div>
  );
}