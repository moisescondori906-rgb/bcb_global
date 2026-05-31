import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

export default function BannerCarousel({ banners = [] }) {
  const [slide, setSlide] = useState(0);

  // Fallback banners con las nuevas imágenes .webp
  const fallbackBanners = [
    { id: 'f1', titulo: 'Bienvenido a BCB Global', imagen_url: '/imag/carrusel1.webp' },
    { id: 'f2', titulo: 'Gana comisiones diarias', imagen_url: '/imag/carrusel2.webp' },
    { id: 'f3', titulo: 'Invierte y Crece', imagen_url: '/imag/carrusel3.webp' },
    { id: 'f4', titulo: 'Seguridad Institucional', imagen_url: '/imag/carrusel4.webp' }
  ];

  // Asegurar que banners sea un array válido y tenga contenido
  const validBanners = Array.isArray(banners) && banners.length > 0 ? banners : fallbackBanners;

  useEffect(() => {
    if (validBanners.length <= 1) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % validBanners.length), 5000);
    return () => clearInterval(t);
  }, [validBanners.length]);

  const next = () => setSlide((s) => (s + 1) % validBanners.length);
  const prev = () => setSlide((s) => (s - 1 + validBanners.length) % validBanners.length);

  if (validBanners.length === 0) return (
    <div className="h-48 w-full rounded-m3-lg bg-white/[0.02] border border-white/[0.05] flex flex-col items-center justify-center gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-sav-accent/10 flex items-center justify-center text-sav-accent/30">
        <Sparkles size={24} />
      </div>
      <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.2em]">Cargando promociones...</p>
    </div>
  );

  return (
    <div className="relative aspect-[21/9] w-full rounded-m3-lg overflow-hidden shadow-m3-3 border border-white/10 group">
      <AnimatePresence mode='wait'>
        <motion.div
          key={slide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={api.getMediaUrl(validBanners[slide]?.imagen_url)}
            alt={validBanners[slide]?.titulo || 'Promoción'}
            className="w-full h-full object-cover bg-black"
            onError={(e) => { 
              if (e.target.src !== '/imag/carrusel1.webp') {
                e.target.src = '/imag/carrusel1.webp'; 
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          
          <div className="absolute bottom-6 left-6 right-6">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-1"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="h-0.5 w-6 bg-sav-accent rounded-full" />
                <span className="text-[9px] font-bold text-sav-accent uppercase tracking-[0.3em]">Destacado</span>
              </div>
              {validBanners[slide]?.titulo && (
                <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-lg leading-tight">
                  {validBanners[slide].titulo}
                </h3>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute bottom-4 right-6 flex gap-1.5">
        {validBanners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setSlide(idx)}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              slide === idx ? "w-6 bg-sav-accent" : "w-2 bg-white/20"
            )}
          />
        ))}
      </div>
    </div>
  );
        {validBanners.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-500 ${i === slide ? 'w-6 bg-sav-primary' : 'w-1.5 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
