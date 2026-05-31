import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import Layout from '../components/Layout.jsx';
import { api } from '../lib/api.js';
import { 
  ShieldCheck, Play, Check, Clock, Wallet, 
  ArrowRight, X, Sparkles, AlertCircle, 
  ClipboardList, Trophy, Target, TrendingUp,
  ChevronRight, Heart, Coffee, Sun, Home, Calendar,
  Zap, ArrowLeft, ShieldAlert
} from 'lucide-react';
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler.js';
import { cn } from '../lib/utils/cn';

// UI Components
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';

import { getperuNow as getBoliviaNow } from '../utils/time';

export default function TaskRoom() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [timer, setTimer] = useState(10);
  const [surveyVisible, setSurveyVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const videoRef = useRef(null);

  const formatBs = (val) => Number(val || 0).toFixed(2);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const [res, nivelesData] = await Promise.all([
        api.tasks.list(),
        api.levels.list()
      ]);
      setData(res);
      setNiveles(nivelesData || []);
      if (res.error) setError(res.error);
    } catch (err) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !activeTask) fetchTasks();
    }, 60000);
    return () => clearInterval(interval);
  }, [activeTask]);

  useEffect(() => {
    if (activeTask && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        videoRef.current.muted = true;
        videoRef.current.play();
      });
    }
  }, [activeTask?.id]);

  useEffect(() => {
    let interval;
    if (activeTask && !surveyVisible && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && activeTask && !surveyVisible) {
      setSurveyVisible(true);
    }
    return () => clearInterval(interval);
  }, [activeTask, surveyVisible, timer]);

  useAndroidBackHandler(activeTask, () => setActiveTask(null));

  const startTask = (task) => {
    if (data?.tareas_restantes <= 0) {
      setErrorMessage('Límite diario de tareas alcanzado. Sube de nivel para realizar más tareas.');
      setShowResult(true);
      setIsCorrect(false);
      return;
    }
    setActiveTask(task);
    setTimer(10);
    setSurveyVisible(false);
    setShowResult(false);
    setVideoFinished(false);
    window.scrollTo(0, 0);
  };

  const onConfirmResponse = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const idempotency_key = `task_${activeTask.id}_${Date.now()}`;
      const res = await api.tasks.responder(activeTask.id, { idempotency_key });
      setShowResult(true);
      setEarnedAmount(res.monto);
      setIsCorrect(true);
      refreshUser();
    } catch (err) {
      setErrorMessage(err.message || 'Error de conexión');
      setShowResult(true);
      setIsCorrect(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !activeTask) {
    return (
      <Layout>
        <div className="p-10 flex flex-col items-center justify-center min-h-[70vh] space-y-6">
          <div className="w-16 h-16 border-4 border-sav-surface border-t-sav-primary rounded-full animate-spin" />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-sav-muted animate-pulse">Analizando Oportunidades</p>
        </div>
      </Layout>
    );
  }

  if ((error || data?.bloqueado) && !activeTask) {
    const isLevelBlocked = data && !data.tareas_restantes && data.num_tareas_diarias === 0;
    
    let displayTitle = isLevelBlocked ? 'Evoluciona tu Nivel' : 'Acceso Restringido';
    let displayMessage = error || data?.mensaje || (isLevelBlocked ? 'Tu nivel actual no dispone de tareas activas. Adquiere un plan institucional para comenzar a generar comisiones diarias.' : 'El sistema de tareas no está disponible en este momento.');
    let Icon = ShieldAlert;
    let iconColor = "bg-amber-50 text-amber-500 border-amber-100 shadow-sm";
    let isSunday = false;

    const msg = (error || data?.mensaje || '').toLowerCase();
    
    if (msg.includes('domingo')) {
      isSunday = true;
      displayTitle = 'Tiempo de Descanso';
      displayMessage = 'En BCB Global priorizamos el bienestar. Aprovecha este domingo para desconectar y recargar energías. Las operaciones se reanudarán automáticamente mañana.';
      Icon = Heart;
      iconColor = "bg-rose-50 text-rose-500 border-rose-100 shadow-sm";
    }

    return (
      <Layout>
        <div className="px-6 py-12 flex flex-col items-center justify-center min-h-[80vh] text-center space-y-10">
          <Card variant="premium" className="w-full flex flex-col items-center p-12 space-y-8">
            <div className={cn(
              "w-24 h-24 rounded-[2.5rem] flex items-center justify-center border transition-all duration-700",
              iconColor
            )}>
              <Icon size={48} strokeWidth={1.5} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight text-sav-text-main uppercase">
                {displayTitle}
              </h2>
              <p className="text-sm font-medium text-sav-text-dim leading-relaxed max-w-xs mx-auto">
                {displayMessage}
              </p>
              {isSunday && (
                <div className="pt-4 flex items-center justify-center gap-2">
                   <Calendar size={14} className="text-sav-primary" />
                   <span className="text-[10px] font-extrabold text-sav-primary uppercase tracking-[0.2em]">Sincronización: Lunes 00:00</span>
                </div>
              )}
            </div>
            <Button onClick={() => navigate('/')} variant="secondary" className="w-full h-14" icon={Home}>IR AL INICIO</Button>
          </Card>
          
          {(data?.bloqueado || isLevelBlocked) && !isSunday && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <Link to="/vip" className="w-full">
                <Button variant="primary" className="w-full h-16 shadow-accent-glow uppercase tracking-widest text-[15px]" icon={Zap}>SUBIR A NIVEL VIP</Button>
              </Link>
            </motion.div>
          )}
        </div>
      </Layout>
    );
  }

  if (activeTask) {
    return (
      <Layout>
        <div className="min-h-screen bg-sav-bg flex flex-col animate-in pb-12">
          <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-black/[0.03]">
            <button onClick={() => setActiveTask(null)} className="p-3 bg-sav-surface rounded-2xl border border-black/[0.03] text-sav-text-main hover:bg-white transition-all shadow-sm">
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="text-center">
              <h2 className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-sav-muted leading-none mb-1.5">Misión Activa</h2>
              <p className="text-sm font-extrabold text-sav-text-main uppercase tracking-tight truncate max-w-[180px]">{activeTask.nombre}</p>
            </div>
            <div className="w-12" />
          </header>

          <main className="px-6 py-8 space-y-8 flex-1 max-w-lg mx-auto w-full">
            <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border-4 border-white bg-black shadow-m3-3 group">
              <video 
                ref={videoRef}
                src={api.getMediaUrl(activeTask.video_url)}
                className="w-full h-full object-cover"
                onEnded={() => setVideoFinished(true)}
                playsInline
                autoPlay
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

              {!surveyVisible && !showResult && (
                <div className="absolute top-6 right-6 px-5 py-2.5 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 flex items-center gap-3 shadow-2xl">
                  <div className="w-2.5 h-2.5 bg-sav-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  <span className="text-[15px] font-black text-sav-text-main tracking-tighter">{timer}s</span>
                </div>
              )}
              
              {videoFinished && !surveyVisible && !showResult && (
                <div className="absolute inset-0 bg-sav-primary/20 backdrop-blur-[2px] flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="w-20 h-20 rounded-full bg-white text-sav-primary flex items-center justify-center shadow-accent-glow"
                  >
                    <Check size={40} strokeWidth={4} />
                  </motion.div>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {showResult ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <Card className={cn(
                    "p-10 border-none relative overflow-hidden text-center",
                    isCorrect ? "bg-emerald-50 border border-emerald-100 shadow-success-glow" : "bg-red-50 border border-red-100 shadow-lg"
                  )}>
                    <div className={cn(
                      "w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-4 border-white transition-all duration-700 shadow-m3-2",
                      isCorrect ? "bg-sav-success text-white" : "bg-sav-error text-white"
                    )}>
                      {isCorrect ? <Trophy size={48} strokeWidth={1.5} /> : <ShieldAlert size={48} strokeWidth={1.5} />}
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className={cn(
                        "text-2xl font-extrabold tracking-tight uppercase",
                        isCorrect ? "text-emerald-700" : "text-red-700"
                      )}>
                        {isCorrect ? '¡Misión Cumplida!' : 'Ocurrió un Error'}
                      </h3>
                      <p className="text-sm font-bold text-sav-text-dim/80">
                        {isCorrect ? `Has validado correctamente la campaña y generado un beneficio neto de:` : errorMessage}
                      </p>
                      {isCorrect && (
                        <div className="py-6">
                          <span className="text-5xl font-black text-sav-text-main tracking-tighter">
                            +{formatBs(earnedAmount)} <span className="text-2xl text-sav-primary">Bs</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                  
                  <Button 
                    onClick={() => { setActiveTask(null); setTimer(10); setSurveyVisible(false); setShowResult(false); }} 
                    variant="primary" 
                    className="w-full h-16 uppercase tracking-widest shadow-accent-glow text-[15px]"
                    icon={ArrowRight}
                  >
                    SIGUIENTE TAREA
                  </Button>
                </motion.div>
              ) : surveyVisible ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <Card variant="premium" className="p-10 space-y-10 text-center">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-sav-primary/10 flex items-center justify-center mx-auto text-sav-primary mb-4">
                         <ShieldCheck size={28} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-xl font-extrabold text-sav-text-main tracking-tight uppercase">Confirmar Validación</h3>
                      <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.25em]">Verificación de Impacto Publicitario</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-sav-surface border border-black/[0.03] text-center">
                      <p className="text-[15px] font-bold text-sav-text-main leading-relaxed">
                        ¿Has completado la visualización del material para proceder con el cobro de tu comisión?
                      </p>
                    </div>

                    <Button 
                      onClick={onConfirmResponse} 
                      variant="primary" 
                      className="w-full h-16 shadow-accent-glow text-[15px]"
                      loading={isSubmitting}
                      icon={Check}
                    >
                      CONFIRMAR Y COBRAR
                    </Button>
                  </Card>
                </motion.div>
              ) : (
                <div className="text-center space-y-4 py-4">
                   <div className="flex items-center justify-center gap-3">
                      <div className="h-1 w-12 bg-sav-primary/20 rounded-full" />
                      <p className="text-[11px] font-extrabold text-sav-muted uppercase tracking-[0.3em]">Visualización en Progreso</p>
                      <div className="h-1 w-12 bg-sav-primary/20 rounded-full" />
                   </div>
                   <p className="text-xs font-bold text-sav-text-dim/60 italic">Por favor, mantén la aplicación abierta para validar la tarea.</p>
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </Layout>
    );
  }

  const tareasRestantes = data?.tareas_restantes || 0;
  const numTareas = data?.num_tareas_diarias || 0;
  const progreso = numTareas > 0 ? ((numTareas - tareasRestantes) / numTareas) * 100 : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-sav-bg pb-32">
        <header className="px-6 pt-12 pb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sav-primary/5 rounded-full -mr-40 -mt-40 blur-3xl" />
          <div className="relative z-10 space-y-6">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                   <h1 className="text-3xl font-extrabold text-sav-text-main tracking-tight uppercase">Centro de Tareas</h1>
                   <div className="flex items-center gap-2">
                      <Badge variant="info" className="py-1">SISTEMA V12.0</Badge>
                      <span className="text-[10px] font-bold text-sav-muted uppercase tracking-widest">{displayLevelCode(user?.nivel_codigo)}</span>
                   </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white shadow-m3-1 flex items-center justify-center border border-black/[0.03]">
                   <ClipboardList size={28} className="text-sav-primary" strokeWidth={2.5} />
                </div>
             </div>
          </div>
        </header>

        <main className="px-6 -mt-16 relative z-10 space-y-8 max-w-lg mx-auto">
          {/* Progress Card */}
          <Card variant="premium" className="p-8">
            <div className="flex items-center justify-between mb-8">
               <div className="space-y-1">
                  <p className="text-[11px] font-bold text-sav-muted uppercase tracking-[0.2em]">Disponibilidad Hoy</p>
                  <p className="text-3xl font-black text-sav-text-main tracking-tighter">
                    {tareasRestantes} <span className="text-lg text-sav-primary">Misiones</span>
                  </p>
               </div>
               <div className="w-16 h-16 rounded-full border-4 border-sav-surface flex items-center justify-center relative">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-sav-surface" />
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-sav-primary" strokeDasharray={176} strokeDashoffset={176 - (176 * progreso / 100)} strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-[10px] font-black text-sav-text-main">{Math.round(progreso)}%</span>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-sav-surface border border-black/[0.02]">
                  <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mb-1">Ganancia Diaria</p>
                  <p className="text-lg font-extrabold text-sav-text-main">{formatBs(data?.ganancia_diaria)} Bs</p>
               </div>
               <div className="p-4 rounded-2xl bg-sav-surface border border-black/[0.02]">
                  <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mb-1">Misiones Totales</p>
                  <p className="text-lg font-extrabold text-sav-text-main">{numTareas}</p>
               </div>
            </div>
          </Card>

          {/* Task List / Interaction Area */}
          <section className="space-y-5">
            <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
                  <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Lista de Misiones</h3>
               </div>
               <Badge variant="success" className="animate-pulse">SISTEMA ONLINE</Badge>
            </div>

            <div className="space-y-4">
              {Array.isArray(data?.tareas) && data.tareas.length > 0 ? (
                data.tareas.map((task, i) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card 
                      className="p-5 flex items-center justify-between group hover:border-sav-primary/30 transition-all cursor-pointer"
                      onClick={() => startTask(task)}
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-sav-surface flex items-center justify-center text-sav-primary border border-black/[0.03] group-hover:bg-sav-primary group-hover:text-white transition-all shadow-sm">
                           <Play size={24} fill="currentColor" strokeWidth={0} className="ml-1" />
                        </div>
                        <div>
                          <p className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-tight group-hover:text-sav-primary transition-colors">{task.nombre}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                             <div className="flex items-center gap-1 text-emerald-600">
                                <Zap size={10} fill="currentColor" />
                                <span className="text-[10px] font-bold">Comisión: {formatBs(task.monto)} Bs</span>
                             </div>
                             <div className="w-1 h-1 rounded-full bg-sav-muted/30" />
                             <div className="flex items-center gap-1 text-sav-muted">
                                <Clock size={10} />
                                <span className="text-[10px] font-bold">10s</span>
                             </div>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-sav-muted group-hover:text-sav-primary group-hover:translate-x-1 transition-all" strokeWidth={2.5} />
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center space-y-6">
                   <div className="w-24 h-24 rounded-full bg-sav-surface flex items-center justify-center mx-auto text-sav-muted border-2 border-dashed border-black/[0.05]">
                      <ClipboardList size={40} strokeWidth={1.5} />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-widest">Sin misiones disponibles</p>
                      <p className="text-[11px] font-bold text-sav-muted uppercase tracking-tight max-w-[200px] mx-auto leading-relaxed">Vuelve más tarde o actualiza tu nivel VIP para nuevas campañas.</p>
                   </div>
                   <Link to="/vip" className="inline-block">
                      <Button variant="secondary" className="px-10 h-12">EXPLORAR VIP</Button>
                   </Link>
                </div>
              )}
            </div>
          </section>

          {/* History / Recent Activity */}
          <section className="space-y-5 pb-12">
             <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-4 bg-indigo-400 rounded-full" />
                <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Actividad Reciente</h3>
             </div>
             
             <div className="space-y-3">
               {[1, 2, 3].map((_, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-white/50 border border-black/[0.02] rounded-2xl opacity-60">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-sav-surface flex items-center justify-center text-sav-muted">
                          <Check size={16} strokeWidth={3} />
                       </div>
                       <div>
                          <div className="h-2 w-24 bg-sav-surface rounded-full mb-2" />
                          <div className="h-1.5 w-16 bg-sav-surface/50 rounded-full" />
                       </div>
                    </div>
                    <div className="h-4 w-12 bg-sav-surface rounded-full" />
                 </div>
               ))}
             </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}
