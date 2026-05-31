import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';
import Layout from '../components/Layout.jsx';
import Header from '../components/Header.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Trophy, 
  Sparkles, 
  History, 
  Wallet, 
  ChevronRight, 
  Coins,
  AlertCircle,
  CheckCircle2,
  Lock,
  UserPlus,
  Gift,
  ArrowRight
} from 'lucide-react';
import { displayLevelCode } from '../lib/displayLevel.js';
import { formatTime } from '../lib/utils/format';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { cn } from '../lib/utils/cn';

export default function Recompensas() {
  const { user, refreshUser } = useAuth();
  const [premios, setPremios] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [config, setConfig] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [punished, setPunished] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = () => {
      Promise.all([
        api.sorteo.premios().catch(() => []),
        api.sorteo.historial().catch(() => []),
        api.sorteo.config().catch(() => null),
        api.users.team().catch(() => null)
      ]).then(([p, h, c, t]) => {
        if (isMounted) {
          setPremios(p || []);
          setHistorial(h || []);
          setConfig(c);
          setTeamStats(t);
          setLoading(false);
        }
      }).catch(err => {
        console.error('Error cargando datos de ruleta:', err);
        if (isMounted) setLoading(false);
      });
    };

    loadData();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !spinning) {
        api.sorteo.historial().then(data => {
          if (isMounted) setHistorial(data || []);
        }).catch(() => {});
        
        api.sorteo.config().then(data => {
          if (isMounted) setConfig(data || null);
        }).catch(() => {});
      }
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [spinning]);

  const cumulativeRotationRef = useRef(0);
  const wheelControls = useAnimation();

  const spinWheel = async () => {
    if (spinning || premios.length === 0 || (Number(user?.tickets_ruleta) || 0) < 1) return;
    
    setError(null);
    setResult(null);
    
    try {
      const idempotency_key = `spin_${user.id}_${Date.now()}`;
      const res = await api.sorteo.girar({ idempotency_key });
      
      if (res.ok) {
        setSpinning(true);
        
        const count = premios.length || 1;
        const premioIndex = premios.findIndex(p => p.id === res.premio.id);
        
        const extraRounds = 8;
        const segmentAngle = 360 / count;
        const targetAngle = (premioIndex * segmentAngle) + (segmentAngle / 2);
        const currentRotation = cumulativeRotationRef.current % 360;
        const finalTarget = (360 - targetAngle) % 360;
        
        let distance = finalTarget - currentRotation;
        if (distance < 0) distance += 360;
        
        const totalNewRotation = cumulativeRotationRef.current + (extraRounds * 360) + distance;
        cumulativeRotationRef.current = totalNewRotation;

        await wheelControls.start({
          rotate: totalNewRotation,
          transition: { 
            duration: 6, 
            ease: [0.2, 0, 0.1, 1]
          }
        });

        setSpinning(false);
        setResult(res.premio);
        setRotation(totalNewRotation % 360); 
        
        if (Number(res.premio.valor) > 0) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899']
          });
        }

        refreshUser();
        api.sorteo.historial().then(data => {
           if (data) setHistorial(data);
        });
      }
    } catch (err) {
      setError(err.message || 'Error al girar la ruleta');
      setSpinning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1f36] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (punished) {
    return (
      <Layout>
        <div className="p-8 text-center space-y-6 flex flex-col items-center justify-center min-h-[70vh] bg-white">
          <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center shadow-xl border border-rose-100 animate-pulse">
            <AlertCircle size={48} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#1a1f36] uppercase tracking-tighter">Premios Bloqueados</h2>
            <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-xs mx-auto">
              Tu acceso a la ruleta de premios ha sido <span className="text-rose-600 font-bold uppercase">bloqueado por hoy</span> como castigo por no responder el cuestionario obligatorio de ayer.
            </p>
          </div>
          <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 text-left w-full shadow-inner">
            <p className="text-[10px] text-amber-700 font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <AlertCircle size={14} /> Nota:
            </p>
            <p className="text-xs text-amber-600 leading-relaxed font-medium">
              Asegúrate de responder el cuestionario de hoy para evitar ser sancionado nuevamente mañana.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (config && !config.recompensas_visibles) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-xs">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
              <Lock size={40} />
            </div>
            <h2 className="text-xl font-black text-[#1a1f36] uppercase tracking-tighter mb-2">Sección Bloqueada</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
              El administrador ha desactivado temporalmente el centro de recompensas.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const isInternar = user?.nivel_codigo === 'internar';
  const amigosRequeridos = config?.recompensa_amigos_cantidad || 10;
  const totalAmigosA = teamStats?.niveles?.[0]?.total_miembros || 0;
  const retoAmigosHabilitado = !isInternar && totalAmigosA >= amigosRequeridos;

  return (
    <Layout>
      <div className="bg-sav-dark min-h-screen pb-32">
        <Header title="Premios" />

        <div className="bg-sav-primary pt-12 pb-24 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-m3-sm bg-white/10 backdrop-blur-md border border-white/20">
              <Sparkles className="text-amber-400" size={14} />
              <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Sorteo Institucional</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
              Gira y <span className="text-emerald-400">Gana</span>
            </h1>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest max-w-[200px] mx-auto">Premios directos a tu balance principal</p>
          </div>
        </div>

        <main className="px-6 -mt-16 relative z-10 space-y-8 max-w-lg mx-auto">
          <Card className="p-8 bg-white border-sav-border shadow-m3-3 flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[320px]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-30">
                <div className="w-8 h-10 bg-sav-accent rounded-b-xl shadow-m3-2 border-2 border-white flex items-center justify-center">
                   <div className="w-1 h-5 bg-white/30 rounded-full" />
                </div>
              </div>

              <div className="w-full h-full rounded-full p-2 bg-sav-surface border-4 border-sav-border shadow-m3-1 relative overflow-hidden">
                <motion.div 
                  animate={wheelControls}
                  className="w-full h-full rounded-full overflow-hidden"
                  style={{ rotate: rotation }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {Array.isArray(premios) && premios.map((premio, i) => {
                      const count = premios.length || 1;
                      const angle = 360 / count;
                      const rotationAngle = i * angle;
                      const x1 = 50 + 50 * Math.cos(((rotationAngle - 90) * Math.PI) / 180);
                      const y1 = 50 + 50 * Math.sin(((rotationAngle - 90) * Math.PI) / 180);
                      const x2 = 50 + 50 * Math.cos(((rotationAngle + angle - 90) * Math.PI) / 180);
                      const y2 = 50 + 50 * Math.sin(((rotationAngle + angle - 90) * Math.PI) / 180);

                      return (
                        <g key={premio.id}>
                          <path 
                            d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                            fill={premio.color || (i % 2 === 0 ? '#1A237E' : '#E8EAF6')}
                            stroke="#D1D9E6"
                            strokeWidth="0.2"
                          />
                          <g transform={`rotate(${rotationAngle + angle/2}, 50, 50)`}>
                            <text x="50" y="15" fill={i % 2 === 0 ? 'white' : '#1A237E'} fontSize="2.8" fontWeight="900" textAnchor="middle" style={{ textTransform: 'uppercase' }}>
                              {premio.valor > 0 ? `${premio.valor}` : '0'}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                </motion.div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border-4 border-sav-border shadow-m3-2 flex items-center justify-center z-20">
                   <Coins size={20} className="text-sav-primary" />
                </div>
              </div>
            </div>

            <div className="w-full mt-8 space-y-6">
              <Button
                onClick={spinWheel}
                disabled={spinning || premios.length === 0 || (Number(user?.tickets_ruleta) || 0) < 1}
                className="h-14 shadow-m3-2"
              >
                {spinning ? 'SORTEANDO...' : 'GIRAR AHORA'}
              </Button>

              <div className="flex justify-around items-center pt-4 border-t border-sav-border/50">
                <div className="text-center">
                  <p className="text-[8px] font-black text-sav-muted uppercase tracking-widest mb-1">Costo</p>
                  <p className="text-sm font-black text-sav-primary">1 TICKET</p>
                </div>
                <div className="w-px h-8 bg-sav-border/50" />
                <div className="text-center">
                  <p className="text-[8px] font-black text-sav-muted uppercase tracking-widest mb-1">Disponibles</p>
                  <p className="text-sm font-black text-sav-primary uppercase">{user?.tickets_ruleta || 0}</p>
                </div>
              </div>
            </div>
          </Card>

          <section className="space-y-4">
            <h2 className="text-[11px] font-black text-sav-primary uppercase tracking-[0.2em] px-1">Retos Especiales</h2>
            {config?.recompensa_amigos_activa && (
              <Card className={cn(
                "p-5 flex items-center gap-5 bg-white border-sav-border shadow-m3-1",
                !retoAmigosHabilitado && "opacity-60 grayscale-[0.5]"
              )}>
                <div className="w-14 h-14 rounded-m3 bg-sav-surface flex items-center justify-center text-sav-primary border border-sav-border shrink-0 shadow-m3-1">
                  <UserPlus size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-black text-sav-primary uppercase tracking-tight">Invitado Estrella</h3>
                  <p className="text-[10px] text-sav-muted font-bold uppercase tracking-tight leading-relaxed">
                    Invita a {amigosRequeridos} socios para ganar 1 giro gratis
                  </p>
                  <div className="mt-3 h-1.5 w-full bg-sav-surface rounded-full overflow-hidden border border-sav-border/50">
                    <div className="h-full bg-sav-primary" style={{ width: `${Math.min(100, (totalAmigosA/amigosRequeridos)*100)}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                   <p className="text-lg font-black text-sav-primary">{totalAmigosA}/{amigosRequeridos}</p>
                </div>
              </Card>
            )}
          </section>

          <section className="space-y-4 pb-12">
            <h2 className="text-[11px] font-black text-sav-primary uppercase tracking-[0.2em] px-1">Historial de Premios</h2>
            <div className="space-y-3">
              {historial.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white rounded-m3 border border-sav-border shadow-m3-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-m3-sm bg-sav-surface flex items-center justify-center text-sav-primary">
                      <Gift size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-sav-primary uppercase truncate max-w-[120px]">{h.premio_nombre}</p>
                      <p className="text-[8px] font-bold text-sav-muted uppercase tracking-widest">{new Date(h.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-emerald-600">+{h.premio_valor || h.valor_premio || h.monto} Bs</p>
                </div>
              ))}
              {historial.length === 0 && (
                <div className="py-12 text-center opacity-30">
                   <History size={32} className="mx-auto mb-2" />
                   <p className="text-[9px] font-black uppercase tracking-widest">Sin registros recientes</p>
                </div>
              )}
            </div>
          </section>
        </main>

        <AnimatePresence>
          {result && !spinning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="w-full max-w-sm bg-white rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] p-12 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-500" />
                
                <motion.div 
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 100 }}
                  className="w-32 h-32 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30 relative overflow-hidden"
                >
                  {result.imagen_url && result.imagen_url !== 'null' ? (
                    <img src={api.getMediaUrl(result.imagen_url)} className="w-full h-full object-cover" alt={result.nombre} />
                  ) : (
                    <Trophy size={64} className="text-white drop-shadow-lg" />
                  )}
                </motion.div>
                
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-3">{result.nombre || '¡Giro Exitoso!'}</p>
                <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-2 leading-none">
                  {result.valor > 0 ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">{result.valor} Bs</span>
                  ) : (
                    <span className="text-gray-400">¡GRACIAS!</span>
                  )}
                </h2>
                
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="w-full mt-8 py-5 rounded-[2rem] bg-gray-900 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-gray-800 active:scale-95 transition-all"
                >
                  Confirmar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
