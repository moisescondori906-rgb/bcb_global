import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Sparkles, Megaphone, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { api } from '../../lib/api';

export default function FloatingAnnouncements({ announcements, onClose }) {
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    if (announcements && announcements.length > 0) {
      // Tomar los anuncios que no han sido mostrados aún en esta lista visible
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
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[100000] flex flex-col-reverse gap-4 w-[95%] max-w-[380px] pointer-events-none left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0">
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
  useEffect(() => {
    // Si es un anuncio especial (ej. domingo), dejarlo más tiempo
    const duration = item.isSpecial ? 20000 : 12000;
    const timer = setTimeout(() => {
      onRemove();
    }, duration);
    return () => clearTimeout(timer);
  }, [onRemove, item.isSpecial]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.3 } }}
      className={cn(
        "pointer-events-auto relative w-full overflow-hidden",
        "bg-white/95 backdrop-blur-2xl border border-white shadow-[0_30px_70px_-15px_rgba(30,27,75,0.4)]",
        "rounded-[2.5rem] flex flex-col group border-b-4 border-b-bcb-primary/20"
      )}
    >
      {/* Premium Image Header */}
      {item.imagen_url && (
        <div className="w-full h-[140px] relative overflow-hidden shrink-0 bg-slate-900">
          <img 
            src={api.getMediaUrl(item.imagen_url)} 
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
            alt="BCB Global"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent" />
          
          {/* Top Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-bcb-primary text-white text-[8px] font-black uppercase tracking-[0.2em] shadow-xl border border-white/20">
            <Sparkles size={10} className="animate-pulse" />
            Nuevo Comunicado
          </div>
        </div>
      )}

      {/* Close Button: Floating Minimalist */}
      <button 
        onClick={onRemove}
        className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white transition-all flex items-center justify-center backdrop-blur-md border border-white/20"
      >
        <X size={14} strokeWidth={3} />
      </button>

      <div className="p-7 space-y-4">
        {/* Content Layout */}
        <div className="flex gap-4 items-start">
          {!item.imagen_url && (
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-bcb-primary/10 flex items-center justify-center text-bcb-primary border border-bcb-primary/5">
              <Megaphone size={22} strokeWidth={2.5} className="animate-bounce-slow" />
            </div>
          )}
          
          <div className="flex-1 min-w-0 space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight !text-bcb-primary">
              {item.titulo || 'BCB Global Institucional'}
            </h4>
            <div className="max-h-[120px] overflow-y-auto no-scrollbar">
              <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                {item.mensaje}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Premium Style */}
        <div className="flex gap-2">
          <button 
            onClick={onRemove}
            className="flex-1 h-12 rounded-2xl bg-bcb-primary text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-bcb-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
          >
            Entendido
            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Progress Bar: Luxury Shimmer */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100/50 overflow-hidden">
        <motion.div 
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: item.isSpecial ? 20 : 12, ease: "linear" }}
          className="h-full bg-gradient-to-r from-bcb-primary via-indigo-400 to-bcb-primary shadow-[0_0_10px_rgba(30,27,75,0.5)]"
        />
      </div>
    </motion.div>
  );
}
