import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { cn } from '../../lib/utils/cn';

const RouletteWheel = ({ premios, spinning, onSpinComplete, targetIndex }) => {
  const wheelControls = useAnimation();
  const cumulativeRotationRef = useRef(0);
  const [ledActive, setLedActive] = useState(0);
  const audioContextRef = useRef(null);

  // Generador de sonido de "Tick" profesional mediante Web Audio API
  const playTick = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Ignorar si el navegador bloquea el audio sin interacción previa
    }
  };

  // Efecto de luces LED circulares y sonidos de tick sincronizados
  useEffect(() => {
    let interval;
    if (spinning) {
      interval = setInterval(() => {
        setLedActive(prev => {
          const next = (prev + 1) % 12;
          playTick();
          return next;
        });
      }, 150);
    } else {
      setLedActive(-1);
    }
    return () => clearInterval(interval);
  }, [spinning]);

  useEffect(() => {
    if (spinning && targetIndex !== -1) {
      runSpinAnimation();
    }
  }, [spinning, targetIndex]);

  const runSpinAnimation = async () => {
    const count = premios.length || 1;
    const segmentAngle = 360 / count;
    
    // Configuración de la animación física
    const extraRounds = 10; // Más vueltas para realismo
    const targetAngle = (targetIndex * segmentAngle) + (segmentAngle / 2);
    
    const currentRotation = cumulativeRotationRef.current % 360;
    const finalTarget = (360 - targetAngle) % 360;
    
    let distance = finalTarget - currentRotation;
    if (distance < 0) distance += 360;
    
    const totalNewRotation = cumulativeRotationRef.current + (extraRounds * 360) + distance;
    cumulativeRotationRef.current = totalNewRotation;

    // Animación de desaceleración física realista (Cúbica de salida fuerte)
    await wheelControls.start({
      rotate: totalNewRotation,
      transition: { 
        duration: 7, 
        ease: [0.15, 0, 0.15, 1] // Curva de desaceleración progresiva premium
      }
    });

    onSpinComplete();
  };

  return (
    <div className="relative w-80 h-80 md:w-[450px] md:h-[450px] flex items-center justify-center">
      {/* Outer Glow Ring */}
      <div className="absolute inset-[-20px] rounded-full bg-bcb-primary/20 blur-[60px] animate-pulse" />
      
      {/* LED Lights Ring */}
      <div className="absolute inset-[-10px] rounded-full border-4 border-slate-800/50 shadow-2xl flex items-center justify-center">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className={cn(
              "absolute w-3 h-3 rounded-full transition-all duration-300",
              ledActive === i ? "bg-amber-400 shadow-[0_0_15px_#f59e0b] scale-125" : "bg-slate-700 shadow-inner"
            )}
            style={{
              transform: `rotate(${i * 30}deg) translateY(-210px) md:translateY(-220px)`
            }}
          />
        ))}
      </div>

      {/* Main Wheel Container */}
      <div className="relative w-full h-full rounded-full p-4 bg-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] border-8 border-slate-800 overflow-hidden">
        <motion.div 
          animate={wheelControls}
          className="w-full h-full rounded-full overflow-hidden"
          style={{ rotate: 0 }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              {/* Gradients for segments */}
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#312e81" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4338ca" />
                <stop offset="100%" stopColor="#3730a3" />
              </linearGradient>
              <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#4338ca" />
              </linearGradient>
            </defs>
            {premios.map((premio, i) => {
              const count = premios.length;
              const angle = 360 / count;
              const startAngle = i * angle;
              const endAngle = (i + 1) * angle;
              
              const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
              const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
              const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
              const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);

              const largeArcFlag = angle > 180 ? 1 : 0;
              const d = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              const gradients = ['url(#grad1)', 'url(#grad2)', 'url(#grad3)'];

              return (
                <g key={i}>
                  <path d={d} fill={gradients[i % gradients.length]} stroke="#ffffff10" strokeWidth="0.5" />
                  <g transform={`rotate(${startAngle + angle / 2} 50 50)`}>
                    <text
                      x="50"
                      y="15"
                      fill="white"
                      fontSize="3.5"
                      fontWeight="900"
                      textAnchor="middle"
                      className="uppercase tracking-tighter"
                      style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }}
                    >
                      {premio.nombre}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* Center Cap Premium */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-full shadow-[0_0_30px_rgba(0,0,0,1)] border-4 border-slate-700 flex items-center justify-center z-20">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full border-2 border-white/20 shadow-[inset_0_2px_10px_rgba(255,255,255,0.5)] flex items-center justify-center animate-pulse">
             <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </div>
      </div>

      {/* Pointer (Ticker) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-40">
        <motion.div 
          animate={spinning ? { rotate: [0, -15, 0, 10, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.2 }}
          className="relative"
        >
          <div className="w-10 h-14 bg-gradient-to-b from-rose-500 to-rose-700 rounded-b-full shadow-2xl border-2 border-white/20 flex items-center justify-center">
            <div className="w-1 h-6 bg-white/30 rounded-full mb-2" />
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full blur-md opacity-50" />
        </motion.div>
      </div>
    </div>
  );
};

export default RouletteWheel;
