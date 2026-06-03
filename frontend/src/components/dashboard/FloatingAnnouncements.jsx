import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone } from 'lucide-react';
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
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100000] flex flex-col-reverse gap-3 max-w-[95vw] md:max-w-[360px] pointer-events-none left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0">
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
    const duration = item.isSpecial ? 20000 : 12000; // Keep longer duration for special announcements
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
        "pointer-events-auto relative w-full",
        "bg-white border border-slate-200 shadow-md", // Simpler styling
        "rounded-xl flex flex-col overflow-hidden"
      )}
      style={{ maxHeight: '150px' }} // Enforce max height
    >
      {/* Close Button: Minimalist */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/10 hover:bg-black/20 text-white transition-all flex items-center justify-center"
      >
        <X size={12} strokeWidth={2} />
      </button>

      <div className="flex-1 flex items-start gap-3 p-3 pb-0">
        {/* Thumbnail Image or Icon */}
        {item.imagen_url ? (
          <img
            src={api.getMediaUrl(item.imagen_url)}
            className="w-10 h-10 rounded-lg object-cover shrink-0"
            alt="BCB Global"
          />
        ) : (
          <div className="shrink-0 w-10 h-10 rounded-lg bg-bcb-primary/10 flex items-center justify-center text-bcb-primary border border-bcb-primary/5">
            <Megaphone size={18} strokeWidth={2} />
          </div>
        )}
        
        {/* Title and Message */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight leading-tight !text-bcb-primary">
            {item.titulo || 'BCB Global Institucional'}
          </h4>
          <p className="text-[11px] font-medium text-slate-600 leading-tight line-clamp-2">
            {item.mensaje}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end p-3 pt-0">
        <button
          onClick={onRemove}
          className="px-3 py-1.5 rounded-xl bg-bcb-primary text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Entendido
        </button>
      </div>

      {/* Progress Bar */}
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