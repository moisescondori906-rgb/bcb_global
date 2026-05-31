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
  ArrowRight,
  Zap,
  Ticket
} from 'lucide-react';
import { displayLevelCode } from '../lib/displayLevel.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
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
        
        const extraRounds = 10;
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
            duration: 7, 
            ease: [0.16, 1, 0.3, 1]
          }
        });

        setSpinning(false);
        setResult(res.premio);
        setRotation(totalNewRotation % 360); 
        
        if (Number(res.premio.valor) > 0) {
          confetti({
            particleCount: 200,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B']
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
      <Layout>
        <div className="min-h-screen bg-sav-bg flex items-center justify-center p-10">
          <div className="w-16 h-16 border-4 border-sav-surface border-t-sav-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (punished) {
    return (
      <Layout>
        <div className="px-6 py-12 text-center flex flex-col items-center justify-center min-h-[80vh] space-y-8">
          <Card variant="premium" className="w-full flex flex-col items-center p-12 space-y-6">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center border border-rose-100 shadow-sm">
              <AlertCircle size={48} strokeWidth={1.5} />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold text-sav-text-main uppercase tracking-tight">Acceso Suspendido</h2>
              <p className="text-sm text-sav-text-dim font-medium leading-relaxed max-w-xs mx-auto">
                Tu participación en el sorteo ha sido <span className="text-rose-600 font-extrabold uppercase">restringida por hoy</span> por no completar el cuestionario obligatorio anterior.
              </p>
            </div>
            <Badge variant="warning" className="py-2 px-4">Regulariza tu situación mañana</Badge>
          </Card>
        </div>
      </Layout>
    );
  }

  if (config && !config.recompensas_visibles) {
    return (
      <Layout>
        <div className="min-h-screen bg-sav-bg flex items-center justify-center p-8 text-center">
          <div className="max-w-xs space-y-6">
            <div className="w-24 h-24 bg-sav-surface rounded-full flex items-center justify-center mx-auto text-sav-muted border-2 border-dashed border-black/[0.05]">
              <Lock size={48} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
               <h2 className="text-2xl font-extrabold text-sav-text-main uppercase tracking-tight">Centro Cerrado</h2>
               <p className="text-[11px] font-bold text-sav-muted uppercase tracking-[0.2em] leading-relaxed">
                 El sistema de recompensas está en mantenimiento técnico.
               </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const amigosRequeridos = config?.recompensa_amigos_cantidad || 10;
  const totalAmigosA = teamStats?.niveles?.[0]?.total_miembros || 0;
  const retoAmigosHabilitado = totalAmigosA >= amigosRequeridos;

  return (
    <Layout>
      <div className="bg-sav-bg min-h-screen pb-32">
        <header className="px-6 pt-12 pb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sav-accent/5 rounded-full -mr-40 -mt-40 blur-3xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1.5">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sav-primary/10 border border-sav-primary/20">
                  <Sparkles size={12} className="text-sav-primary" />
                  <span className="text-[9px] font-black text-sav-primary uppercase tracking-[0.3em]">Sorteo Institucional</span>
               </div>
               <h1 className="text-3xl font-extrabold text-sav-text-main uppercase tracking-tight">
                 Gira y <span className="text-sav-primary">Gana</span>
               </h1>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white shadow-m3-1 flex items-center justify-center border border-black/[0.03]">
               <Trophy size={28} className="text-sav-primary" strokeWidth={2.5} />
            </div>
          </div>
        </header>

        <main className="px-6 -mt-16 relative z-10 space-y-10 max-w-lg mx-auto">
          {/* Main Wheel Area */}
          <Card variant="premium" className="p-8 sm:p-12 flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[320px]">
              {/* Flutter Needle */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-5 z-30">
                <div className="w-10 h-14 bg-sav-primary rounded-b-3xl shadow-accent-glow border-4 border-white flex items-center justify-center">
                   <div className="w-1.5 h-6 bg-white/40 rounded-full" />
                </div>
              </div>

              {/* The Wheel */}
              <div className="w-full h-full rounded-full p-4 bg-sav-surface border-8 border-white shadow-m3-2 relative overflow-hidden">
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

                      // Modern color palette for segments
                      const colors = ['#6366F1', '#F1F5F9', '#8B5CF6', '#F8FAFC', '#06B6D4', '#E2E8F0'];
                      const segmentColor = premio.color || colors[i % colors.length];

                      return (
                        <g key={premio.id}>
                          <path 
                            d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                            fill={segmentColor}
                            stroke="white"
                            strokeWidth="0.5"
                          />
                          <g transform={`rotate(${rotationAngle + angle/2}, 50, 50)`}>
                            <text x="50" y="18" fill={(i % 2 === 0 && !premio.color) ? 'white' : '#1e293b'} fontSize="3.5" fontWeight="900" textAnchor="middle" style={{ textTransform: 'uppercase' }}>
                              {premio.valor > 0 ? `${premio.valor}` : '0'}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                </motion.div>
                
                {/* Center Cap */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white border-4 border-sav-surface shadow-m3-2 flex items-center justify-center z-20">
                   <div className="w-10 h-10 rounded-full bg-sav-primary/10 flex items-center justify-center">
                      <Coins size={24} className="text-sav-primary" strokeWidth={2.5} />
                   </div>
                </div>
              </div>
            </div>

            <div className="w-full mt-10 space-y-8">
              <Button
                onClick={spinWheel}
                disabled={spinning || premios.length === 0 || (Number(user?.tickets_ruleta) || 0) < 1}
                className="w-full h-16 text-[15px] shadow-accent-glow"
                icon={Zap}
              >
                {spinning ? 'SORTEANDO...' : 'GIRAR RUELA AHORA'}
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-sav-surface border border-black/[0.02] text-center">
                  <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mb-1">Costo de Giro</p>
                  <p className="text-lg font-black text-sav-text-main">1 TICKET</p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                  <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Disponibles</p>
                  <div className="flex items-center justify-center gap-2">
                     <Ticket size={16} className="text-indigo-600" />
                     <p className="text-lg font-black text-indigo-600 uppercase">{user?.tickets_ruleta || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Challenges Section */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 px-1">
               <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
               <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Retos Especiales</h3>
            </div>
            {config?.recompensa_amigos_activa && (
              <Card className={cn(
                "p-6 flex items-center gap-6 transition-all duration-500",
                !retoAmigosHabilitado ? "bg-sav-surface/50 opacity-70 grayscale-[0.5]" : "bg-white shadow-m3-2 border-sav-primary/20"
              )}>
                <div className="w-16 h-16 rounded-2xl bg-sav-primary/10 flex items-center justify-center text-sav-primary border border-sav-primary/20 shrink-0 shadow-sm">
                  <UserPlus size={32} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-extrabold text-sav-text-main uppercase tracking-tight">Invitado Estrella</h3>
                  <p className="text-[10px] text-sav-text-dim font-bold uppercase tracking-tight leading-relaxed mt-1">
                    Alcanza {amigosRequeridos} socios directos para 1 ticket extra
                  </p>
                  <div className="mt-4 h-2 w-full bg-sav-surface rounded-full overflow-hidden p-0.5 border border-black/[0.03]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (totalAmigosA/amigosRequeridos)*100)}%` }}
                      className="h-full bg-sav-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)]" 
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                   <p className="text-xl font-black text-sav-text-main">{totalAmigosA}/{amigosRequeridos}</p>
                   <Badge variant={retoAmigosHabilitado ? "success" : "muted"} className="mt-1">
                      {retoAmigosHabilitado ? "COMPLETO" : "EN CURSO"}
                   </Badge>
                </div>
              </Card>
            )}
          </section>

          {/* History Section */}
          <section className="space-y-5 pb-12">
            <div className="flex items-center gap-2 px-1">
               <div className="w-1.5 h-4 bg-emerald-400 rounded-full" />
               <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Últimos Premios</h3>
            </div>
            <div className="space-y-3">
              {historial.slice(0, 5).map((h, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-5 bg-white rounded-3xl border border-black/[0.03] shadow-m3-1 hover:shadow-m3-2 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-sav-surface flex items-center justify-center text-sav-primary border border-black/[0.02]">
                      <Gift size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[12px] font-extrabold text-sav-text-main uppercase truncate max-w-[140px] tracking-tight">{h.premio_nombre}</p>
                      <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mt-0.5">{new Date(h.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[15px] font-black text-emerald-600">+{h.premio_valor || h.valor_premio || h.monto} Bs</p>
                     <Badge variant="success" className="text-[8px] py-0 mt-1">ABONADO</Badge>
                  </div>
                </motion.div>
              ))}
              {historial.length === 0 && (
                <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                   <div className="w-20 h-20 rounded-full border-2 border-dashed border-black/[0.1] flex items-center justify-center">
                      <History size={32} />
                   </div>
                   <p className="text-[10px] font-extrabold uppercase tracking-[0.3em]">Sin actividad reciente</p>
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
              className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-2xl flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 30 }}
                className="w-full max-w-sm bg-white rounded-[3.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.15)] p-12 text-center relative overflow-hidden border border-black/[0.03]"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sav-primary via-sav-accent to-sav-secondary" />
                
                <motion.div 
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 100 }}
                  className="w-40 h-40 bg-gradient-to-tr from-sav-primary to-sav-accent rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-accent-glow relative overflow-hidden border-4 border-white"
                >
                  {result.imagen_url && result.imagen_url !== 'null' ? (
                    <img src={api.getMediaUrl(result.imagen_url)} className="w-full h-full object-cover" alt={result.nombre} />
                  ) : (
                    <Trophy size={72} className="text-white drop-shadow-xl" strokeWidth={1.5} />
                  )}
                </motion.div>
                
                <p className="text-[11px] font-black text-sav-primary uppercase tracking-[0.4em] mb-4">{result.nombre || '¡Giro Exitoso!'}</p>
                <h2 className="text-5xl font-black text-sav-text-main uppercase tracking-tighter mb-4 leading-none">
                  {result.valor > 0 ? (
                    <span className="text-gradient">{result.valor} Bs</span>
                  ) : (
                    <span className="text-sav-muted">¡GRACIAS!</span>
                  )}
                </h2>
                
                <Button
                  onClick={() => setResult(null)}
                  variant="primary"
                  className="w-full h-16 shadow-accent-glow mt-6"
                  icon={CheckCircle2}
                >
                  CONFIRMAR PREMIO
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
