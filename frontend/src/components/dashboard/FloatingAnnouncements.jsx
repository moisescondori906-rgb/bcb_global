import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

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
    <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[100000] flex flex-col gap-3 w-[90%] max-w-[380px] pointer-events-none left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0">
      <AnimatePresence mode="popLayout">
        {visibleItems.map((item, index) => (
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
    const timer = setTimeout(() => {
      onRemove();
    }, 8000); // Auto-cerrar después de 8 segundos
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto relative w-full overflow-hidden",
        "bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)]",
        "rounded-2xl p-4 flex gap-4 group"
      )}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-bcb-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Icon */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-xl bg-bcb-primary/10 flex items-center justify-center text-bcb-primary">
          <Bell size={20} strokeWidth={2.5} className="animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1">
           <Sparkles size={10} className="text-amber-500 animate-bounce" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight truncate">
          {item.titulo || 'Comunicado Oficial'}
        </h4>
        <p className="text-[11px] font-bold text-slate-600 leading-relaxed line-clamp-3">
          {item.mensaje}
        </p>
      </div>

      {/* Close Button */}
      <button 
        onClick={onRemove}
        className="shrink-0 w-8 h-8 rounded-lg bg-slate-100/50 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center"
      >
        <X size={16} strokeWidth={3} />
      </button>

      {/* Progress Bar */}
      <motion.div 
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 8, ease: "linear" }}
        className="absolute bottom-0 left-0 h-0.5 bg-bcb-primary/20"
      />
    </motion.div>
  );
}
