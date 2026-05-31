import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';
import Layout from '../components/Layout.jsx';
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

    // Polling de respaldo para historial y config cada 20 segundos
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
        
        // Calculamos la rotación final acumulativa:
        const extraRounds = 8;
        const segmentAngle = 360 / count;
        
        // 1. Calculamos el ángulo central del premio
        // Como ahora los segmentos empiezan en el TOP (12 o'clock), 
        // el centro del premio i está en (i * angle + angle/2)
        const targetAngle = (premioIndex * segmentAngle) + (segmentAngle / 2);
        
        // Queremos que targetAngle termine en 0 grados (TOP)
        // La distancia es (360 - targetAngle)
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
        
        // Lanzar confeti si es un premio bueno
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

  // Si las recompensas no son visibles según el admin
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

  // Bloqueo para Internar (RELAJADO: Mostrar página pero deshabilitar giro)
  const isInternar = user?.nivel_codigo === 'internar';

  const amigosRequeridos = config?.recompensa_amigos_cantidad || 10;
  const nivelMinimoAmigos = config?.recompensa_amigos_nivel_minimo || 'Global';
  const nivelMinimoAmigosLabel = displayLevelCode(nivelMinimoAmigos);
  const totalAmigosA = teamStats?.niveles?.[0]?.total_miembros || 0;
  
  // Lógica para verificar si cumple requisitos del reto de amigos
  const cumpleNivel = !isInternar; 
  const cumpleAmigos = totalAmigosA >= amigosRequeridos;
  const retoAmigosHabilitado = cumpleNivel && cumpleAmigos;

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen pb-24">
        {isInternar && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-4 text-center">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-2">
               <Sparkles size={14} className="animate-pulse" /> ¡Bienvenido! Tienes 1 giro gratis de cortesía
            </p>
          </div>
        )}
        {/* Header Section */}
        <div className="bg-gradient-to-b from-slate-900 to-indigo-950 pt-12 pb-32 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full -mr-64 -mt-64 blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full -ml-48 -mb-48 blur-[100px]" />
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-6 shadow-2xl">
              <Sparkles className="text-amber-400 animate-pulse" size={16} />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Sorteo Premium Global</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter mb-4 leading-none drop-shadow-2xl">
              GIRA Y <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">GANA</span>
            </h1>
            <p className="text-white/40 text-[10px] sm:text-xs font-bold max-w-xs mx-auto uppercase tracking-[0.2em] leading-relaxed">
              Sistema de recompensas verificado. Premios instantáneos acreditados a tu balance.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 -mt-20 max-w-4xl mx-auto space-y-8">
          {/* Wheel Container */}
          <div className="relative flex flex-col items-center">
            {/* Base de la ruleta */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] md:w-[420px] md:h-[420px] bg-indigo-500/5 rounded-full blur-3xl -z-10" />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-30">
              {/* Nuevo diseño del puntero Pro */}
              <div className="relative">
                <div className="w-10 h-12 bg-gradient-to-b from-amber-300 to-amber-600 rounded-b-2xl shadow-[0_10px_30px_rgba(245,158,11,0.5)] flex items-center justify-center border-2 border-white/20">
                  <div className="w-1 h-6 bg-white/30 rounded-full" />
                </div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-200 rounded-full blur-sm animate-pulse" />
              </div>
            </div>

            <div className="relative w-80 h-80 md:w-[400px] md:h-[400px] rounded-full p-3 bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_0_100px_rgba(79,70,229,0.3)] border-8 border-slate-800/50 backdrop-blur-md">
              <div className="absolute inset-0 rounded-full border-[12px] border-white/5 pointer-events-none z-10" />
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.3)_100%)] pointer-events-none z-10" />
              
              <motion.div 
                animate={wheelControls}
                className="w-full h-full rounded-full overflow-hidden shadow-inner"
                style={{ rotate: rotation }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                  <defs>
                    <linearGradient id="gradPremium1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#3730a3" />
                    </linearGradient>
                    <linearGradient id="gradPremium2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#065f46" />
                    </linearGradient>
                    <linearGradient id="gradPremium3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#92400e" />
                    </linearGradient>
                    <linearGradient id="gradPremium4" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#9d174d" />
                    </linearGradient>
                    <linearGradient id="gradPremium5" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#5b21b6" />
                    </linearGradient>
                    <filter id="shadowText">
                      <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.8" floodColor="rgba(0,0,0,0.8)" />
                    </filter>
                  </defs>
                  {Array.isArray(premios) && premios.map((premio, i) => {
                    const count = premios.length || 1;
                    const angle = 360 / count;
                    const rotationAngle = i * angle;
                    
                    // Ajustamos las coordenadas para que el primer premio (i=0) empiece en el TOP (12 o'clock)
                    // En Math, 0 es a las 3 o'clock, restamos 90 para ir a las 12 o'clock.
                    const x1 = 50 + 50 * Math.cos(((rotationAngle - 90) * Math.PI) / 180);
                    const y1 = 50 + 50 * Math.sin(((rotationAngle - 90) * Math.PI) / 180);
                    const x2 = 50 + 50 * Math.cos(((rotationAngle + angle - 90) * Math.PI) / 180);
                    const y2 = 50 + 50 * Math.sin(((rotationAngle + angle - 90) * Math.PI) / 180);

                    const getGradient = (index) => {
                      const gradients = ['url(#gradPremium1)', 'url(#gradPremium2)', 'url(#gradPremium3)', 'url(#gradPremium4)', 'url(#gradPremium5)'];
                      return gradients[index % gradients.length];
                    };
                    
                    return (
                      <g key={premio.id} className="cursor-pointer group/segment">
                        <path 
                          d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                          fill={premio.color && premio.color !== '' ? premio.color : getGradient(i)}
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="0.3"
                          className="transition-opacity group-hover/segment:opacity-90"
                        />
                        {/* La rotación de SVG ya empieza desde el TOP (0 grados = 12 o'clock) */}
                        <g transform={`rotate(${rotationAngle + angle/2}, 50, 50)`}>
                          {/* Nombre del Premio (Arriba) */}
                          <text
                            x="50"
                            y="12"
                            fill="white"
                            fontSize="2.2"
                            fontWeight="900"
                            textAnchor="middle"
                            style={{ 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.05em',
                              opacity: 0.9,
                              paintOrder: 'stroke',
                              stroke: 'rgba(0,0,0,0.3)',
                              strokeWidth: '0.1px'
                            }}
                          >
                            {premio.nombre.length > 15 ? premio.nombre.substring(0, 15) + '..' : premio.nombre}
                          </text>

                          {/* Imagen del Premio (Centro) */}
                          {premio.imagen_url && premio.imagen_url !== 'null' ? (
                            <image
                              href={api.getMediaUrl(premio.imagen_url)}
                              x="44"
                              y="15"
                              width="12"
                              height="12"
                              preserveAspectRatio="xMidYMid slice"
                              crossOrigin="anonymous"
                              style={{ clipPath: 'circle(50%)' }}
                            />
                          ) : (
                            <Gift x="45" y="16" size={10} className="text-white/20" />
                          )}

                          {/* Valor del Premio (Abajo) */}
                          <text
                            x="50"
                            y="32"
                            fill="white"
                            fontSize="3.2"
                            fontWeight="900"
                            textAnchor="middle"
                            filter="url(#shadowText)"
                            style={{ 
                              textTransform: 'uppercase', 
                              paintOrder: 'stroke', 
                              stroke: 'rgba(0,0,0,0.6)', 
                              strokeWidth: '0.3px'
                            }}
                          >
                            {premio.valor > 0 ? `${premio.valor} Bs` : 'NADA'}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                  {(!Array.isArray(premios) || premios.length === 0) && (
                    <circle cx="50" cy="50" r="50" fill="url(#gradSilver)" stroke="#333" strokeWidth="0.5" />
                  )}
                </svg>
              </motion.div>
              
              {premios.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-center p-10 bg-white/80 backdrop-blur-sm z-20">
                  <div className="max-w-[200px]">
                    <AlertCircle className="text-gray-300 mx-auto mb-4" size={48} />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">
                      Ruleta en mantenimiento. Contacta con soporte.
                    </p>
                  </div>
                </div>
              )}
              
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-slate-900 border-4 border-slate-800 shadow-[0_0_40px_rgba(245,158,11,0.3)] flex items-center justify-center z-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 to-transparent" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-lg relative z-10">
                  <Coins className={`text-white ${spinning ? 'animate-spin' : ''}`} size={20} />
                </div>
              </div>
            </div>

            {/* Spin Button */}
            <div className="mt-12 text-center w-full max-w-xs">
              <button
                onClick={spinWheel}
                disabled={spinning || premios.length === 0 || (Number(user?.tickets_ruleta) || 0) < 1}
                className={`
                  w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all duration-300
                  ${spinning || premios.length === 0 || (Number(user?.tickets_ruleta) || 0) < 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-sav-primary text-white shadow-[0_20px_40px_rgba(220,38,38,0.2)] hover:scale-[1.02] active:scale-[0.98]'
                  }
                `}
              >
                {spinning ? 'Girando...' : 'Girar Ahora'}
              </button>

              <div className="mt-6 flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Costo</p>
                  <div className="flex items-center gap-1.5 justify-center">
                    <Trophy size={14} className="text-amber-500" />
                    <span className="text-sm font-black text-gray-900">1 Ticket</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tus Tickets</p>
                  <div className="flex items-center gap-1.5 justify-center">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-sm font-black text-gray-900">{user?.tickets_ruleta || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 animate-shake">
                <AlertCircle size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
              </div>
            )}
          </div>

          {/* User Stats Card */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-black/5 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <Trophy size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tus Tickets de Ruleta</p>
                <p className="text-2xl font-black text-gray-900">
                  {user?.tickets_ruleta || 0}
                  <span className="text-xs font-bold text-gray-400 ml-2 uppercase tracking-tighter">Tickets</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Total</p>
              <p className="text-sm font-black text-gray-900">
                {((Number(user?.saldo_comisiones) || 0) + (Number(user?.saldo_principal) || 0)).toFixed(2)} Bs
              </p>
            </div>
          </div>

          {/* Desafíos Especiales */}
          <div className="space-y-4">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] px-2">Desafíos Especiales</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Reto de Invitados (Dinámico) */}
              {config?.recompensa_amigos_activa && (
                <div className={`group relative overflow-hidden bg-white rounded-[2rem] p-6 border transition-all duration-300 ${retoAmigosHabilitado ? 'border-emerald-100 ring-1 ring-emerald-50 hover:shadow-2xl' : 'opacity-60 grayscale'}`}>
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${retoAmigosHabilitado ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                        <UserPlus size={28} />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 uppercase tracking-tight text-base mb-1">Invitado Estrella</h3>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-[200px] uppercase tracking-wide">
                          Invita a {amigosRequeridos} amigos (Nivel {nivelMinimoAmigosLabel}+) para un Giro Gratis Especial.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black block leading-none text-gray-900">{totalAmigosA}/{amigosRequeridos}</span>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Amigos</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${retoAmigosHabilitado ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {retoAmigosHabilitado ? '¡Reclama tu Giro!' : 'En Progreso'}
                      </div>
                      {!cumpleNivel && (
                        <div className="flex items-center gap-1 text-[8px] font-black text-rose-500 uppercase">
                          <Lock size={10} />
                          Requiere Global1+
                        </div>
                      )}
                    </div>
                    
                    {retoAmigosHabilitado ? (
                      <button 
                        onClick={spinWheel}
                        className="flex items-center gap-2 bg-sav-dark text-gray-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors group/btn"
                      >
                        Girar Ahora
                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <button className="flex items-center gap-2 bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                        Bloqueado
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Otros desafíos pueden ir aquí bajo la misma lógica */}
            </div>
          </div>

          {/* Winners History (Estilo Ultra Llamativo) */}
          <div className="relative group px-2">
            {/* Efecto de resplandor de fondo */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-white rounded-[2.2rem] p-7 shadow-2xl border border-emerald-50 overflow-hidden">
              {/* Adornos de fondo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-50 rounded-full -ml-12 -mb-12 blur-2xl opacity-30" />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-6 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.25em] leading-none mb-1">Ganadores en Vivo</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Actividad en tiempo real</span>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-sav-dark text-gray-900 border border-sav-border text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">
                  LIVE FEED
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                {historial.length > 0 ? historial.slice(0, 5).map((win, i) => (
                  <div 
                    key={win.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300 animate-fade-in group/item"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500 border border-emerald-50 / group-hover/item:scale-110 transition-transform duration-500">
                        <Trophy size={20} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-900 tracking-tighter uppercase mb-0.5">
                          Usuario {win.telefono_masked || '****'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <History size={10} className="text-gray-400" />
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            {formatTime(win.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 mb-1">
                        <Sparkles size={12} className="text-emerald-500" />
                        <span className="text-sm font-black text-emerald-600 tracking-tight">+{win.monto || win.valor_premio}</span>
                        <span className="text-[8px] font-black text-emerald-400">Bs</span>
                      </div>
                      <span className="text-[7px] font-black text-gray-300 uppercase tracking-[0.2em]">{win.premio_nombre || 'Premio'}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 opacity-40">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                      <Trophy size={24} className="text-gray-300" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Esperando nuevos ganadores...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Win Modal */}
        <AnimatePresence>
          {result && !spinning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.8, y: 20, rotate: -5 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                exit={{ scale: 0.8, y: 20, rotate: 5 }}
                className="w-full max-w-sm bg-white rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] p-12 text-center relative overflow-hidden"
              >
                {/* Adornos Premium */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-indigo-500" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

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
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -inset-2 border-2 border-emerald-500/20 rounded-full" 
                  />
                </motion.div>
                
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-3">{result.nombre || '¡Giro Exitoso!'}</p>
                <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-2 leading-none">
                  {result.valor > 0 ? (
                    <><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">{result.valor} Bs</span></>
                  ) : (
                    <span className="text-gray-400">¡GRACIAS POR PARTICIPAR!</span>
                  )}
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-10 italic">
                  {result.valor > 0 ? 'El premio ha sido acreditado a tu balance de comisiones' : 'No te rindas, la suerte está cerca'}
                </p>
                
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="w-full py-5 rounded-[2rem] bg-gray-900 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-gray-800 active:scale-95 transition-all"
                >
                  Confirmar y Continuar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
