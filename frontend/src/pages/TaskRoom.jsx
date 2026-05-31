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
  ChevronRight, Heart, Coffee, Sun, Home, Calendar
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
  const [selectedOption, setSelectedOption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswerFromServer, setCorrectAnswerFromServer] = useState('');
  const videoRef = useRef(null);

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
    setSelectedOption('');
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
          <div className="w-16 h-16 border-4 border-white/5 border-t-sav-accent rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-sav-muted animate-pulse">Sincronizando Sistema</p>
        </div>
      </Layout>
    );
  }

  if ((error || data?.bloqueado) && !activeTask) {
    const isLevelBlocked = data && !data.tareas_restantes && data.num_tareas_diarias === 0;
    
    let displayTitle = isLevelBlocked ? 'Sube de Nivel' : 'Acceso Restringido';
    let displayMessage = error || data?.mensaje || (isLevelBlocked ? 'Tu nivel actual no tiene tareas disponibles. Adquiere un nivel GLOBAL para comenzar.' : 'Las tareas no están disponibles en este momento.');
    let Icon = ShieldCheck;
    let iconColor = "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]";
    let isSunday = false;

    const msg = (error || data?.mensaje || '').toLowerCase();
    
    if (msg.includes('domingo')) {
      isSunday = true;
      displayTitle = 'DOMINGO DE DESCANSO';
      displayMessage = 'Hoy no hay tareas disponibles. En BCB Global también valoramos el descanso. Aprovecha este día para compartir con tu familia, relajarte y disfrutar de un lindo domingo. Las tareas volverán a estar disponibles mañana.';
      Icon = Heart;
      iconColor = "bg-sav-accent/10 text-sav-accent border-sav-accent/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]";
    }

    return (
      <Layout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
          <Card className="w-full flex flex-col items-center p-10 space-y-8 bg-zinc-950/60 backdrop-blur-3xl border border-white/10">
            <div className={cn(
              "w-20 h-20 rounded-[2rem] flex items-center justify-center border transition-all duration-700",
              iconColor
            )}>
              <Icon size={40} />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white">
                {displayTitle}
              </h2>
              <div className="space-y-4 px-2">
                <p className="text-sm font-medium text-zinc-400 leading-relaxed">
                  {displayMessage}
                </p>
                {isSunday && (
                  <p className="text-[10px] font-bold text-sav-accent uppercase tracking-[0.2em] pt-2">
                    PRÓXIMA ACTUALIZACIÓN: MAÑANA LUNES
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => navigate('/')} variant="secondary" className="w-full h-12 uppercase tracking-widest">Volver al Inicio</Button>
          </Card>
          
          {(data?.bloqueado || isLevelBlocked) && !isSunday && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <Link to="/vip" className="w-full">
                <Button variant="primary" className="w-full h-14 shadow-accent-glow uppercase tracking-widest">Adquirir Nivel VIP</Button>
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
        <div className="min-h-screen bg-sav-dark flex flex-col animate-in fade-in duration-500 pb-10">
          <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-50 bg-sav-dark/40 backdrop-blur-xl border-b border-white/5">
            <button onClick={() => setActiveTask(null)} className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all">
              <X size={20} />
            </button>
            <div className="text-center">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-sav-muted leading-none mb-1">Campaña Activa</h2>
              <p className="text-xs font-bold text-white uppercase tracking-tight">{activeTask.nombre}</p>
            </div>
            <div className="w-10" />
          </header>

          <main className="px-5 py-6 space-y-6 flex-1 max-w-[430px] mx-auto w-full">
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.6)] group">
              <video 
                ref={videoRef}
                src={api.getMediaUrl(activeTask.video_url)}
                className="w-full h-full object-cover"
                onEnded={() => setVideoFinished(true)}
                playsInline
                autoPlay
              />
              {!surveyVisible && !showResult && (
                <div className="absolute top-4 right-4 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center gap-2.5 shadow-xl">
                  <div className="w-2 h-2 bg-sav-accent rounded-full animate-ping" />
                  <span className="text-sm font-bold text-white tracking-tighter">{timer}s</span>
                </div>
              )}
              {videoFinished && !surveyVisible && !showResult && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-sav-accent text-white flex items-center justify-center animate-bounce shadow-accent-glow">
                    <Check size={32} strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {showResult ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 text-center"
                >
                  <Card className={cn(
                    "p-8 border-none overflow-hidden relative",
                    isCorrect ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"
                  )}>
                    <div className={cn(
                      "w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border transition-all duration-700",
                      isCorrect ? "bg-emerald-500 text-white shadow-emerald-500/40 border-emerald-400" : "bg-red-500 text-white shadow-red-500/40 border-red-400"
                    )}>
                      {isCorrect ? <Trophy size={40} /> : <AlertCircle size={40} />}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white tracking-tight uppercase">
                        {isCorrect ? '¡Excelente Trabajo!' : 'Ups, algo salió mal'}
                      </h3>
                      <p className="text-sm font-medium text-zinc-400">
                        {isCorrect ? `Has completado la campaña y generado un beneficio de:` : errorMessage}
                      </p>
                      {isCorrect && (
                        <div className="py-4">
                          <span className="text-4xl font-bold text-emerald-400 tracking-tighter">
                            +{formatBs(earnedAmount)} Bs
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                  
                  <Button 
                    onClick={() => { setActiveTask(null); setTimer(10); setSurveyVisible(false); setShowResult(false); }} 
                    variant="primary" 
                    className="w-full h-14 uppercase tracking-widest shadow-accent-glow"
                  >
                    CONTINUAR TAREAS
                  </Button>
                </motion.div>
              ) : surveyVisible ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="p-8 bg-zinc-900/60 backdrop-blur-3xl border border-white/10 space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight uppercase">Confirmar Campaña</h3>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">BCB Global Verification System</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center space-y-4">
                      <p className="text-sm font-medium text-white leading-relaxed">
                        ¿Has visualizado correctamente el contenido publicitario de esta campaña para proceder con el cobro de tu comisión?
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sav-accent">
                        <ShieldCheck size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Verificación Biométrica</span>
                      </div>
                    </div>

                    <Button 
                      loading={isSubmitting}
                      onClick={onConfirmResponse}
                      variant="primary"
                      className="w-full h-14 uppercase tracking-widest shadow-accent-glow"
                      icon={Check}
                    >
                      CONFIRMAR COBRO
                    </Button>
                  </Card>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </main>
        </div>
      </Layout>
    );
  }

  const formatBs = (val) => Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Layout>
      <div className="min-h-screen pb-32">
        <header className="px-6 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Sala de <span className="text-gradient">Tareas</span></h1>
            <Badge variant="info" className="py-1">LIVE</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-m3 p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <ClipboardList size={40} className="text-sav-accent" />
              </div>
              <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.2em] mb-1">Restantes</p>
              <p className="text-2xl font-bold text-white tracking-tight">
                {data?.tareas_restantes || 0}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-m3 p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUpIcon size={40} className="text-emerald-500" />
              </div>
              <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.2em] mb-1">Comisión Hoy</p>
              <p className="text-2xl font-bold text-emerald-400 tracking-tight">
                +{formatBs(data?.ganancia_hoy || 0)}
              </p>
            </div>
          </div>
        </header>

        <main className="px-5 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={16} className="text-sav-accent" />
            <h2 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Campañas Disponibles</h2>
          </div>

          <div className="grid gap-6">
            {data?.tareas?.map((task) => (
              <Card 
                key={task.id} 
                className="p-6 bg-white/[0.03] border-white/10 hover:border-white/20 transition-all duration-300 group overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-sav-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 overflow-hidden relative shrink-0">
                    <img src={api.getMediaUrl(task.video_url)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
                    <div className="absolute inset-0 flex items-center justify-center text-white/40 group-hover:text-sav-accent transition-colors">
                      <Play size={20} fill="currentColor" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="muted" className="text-[8px] py-0.5">VIP GLOBAL</Badge>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">+{formatBs(task.comision || data?.ganancia_tarea)} Bs</span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate uppercase tracking-wide group-hover:text-sav-accent transition-colors">
                      {task.nombre}
                    </h3>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">Campaña Publicitaria 2026</p>
                  </div>
                  
                  <Button 
                    onClick={() => startTask(task)}
                    variant="primary" 
                    className="w-12 h-12 rounded-xl p-0 shrink-0 shadow-accent-glow"
                  >
                    <ArrowRight size={20} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          {(!data?.tareas || data.tareas.length === 0) && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-zinc-700">
                <Target size={32} />
              </div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-[0.2em]">No hay más tareas por hoy</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
