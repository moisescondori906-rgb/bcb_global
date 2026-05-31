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
      // Usar getBoliviaNow para asegurar consistencia si se llegara a usar para lógica de tiempo local
      if (document.visibilityState === 'visible' && !activeTask) fetchTasks();
    }, 60000); // Polling cada 60s en lugar de 20s para reducir carga de red
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
      // Generar idempotency_key única para evitar doble cobro
      const idempotency_key = `task_${activeTask.id}_${Date.now()}`;
      
      const res = await api.tasks.responder(activeTask.id, { idempotency_key });
      setShowResult(true);
      setEarnedAmount(res.monto);
      setIsCorrect(true); // Siempre correcto en este modo simplificado
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
          <div className="w-16 h-16 border-4 border-sav-primary/10 border-t-sav-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sav-muted animate-pulse">Sincronizando BCB</p>
        </div>
      </Layout>
    );
  }

  if ((error || data?.bloqueado) && !activeTask) {
    const isLevelBlocked = data && !data.tareas_restantes && data.num_tareas_diarias === 0;
    
    // Determinar el título basado en el mensaje del backend
    let displayTitle = isLevelBlocked ? 'Sube de Nivel' : 'Acceso Restringido';
    let displayMessage = error || data?.mensaje || (isLevelBlocked ? 'Tu nivel actual no tiene tareas disponibles. Adquiere un nivel GLOBAL para comenzar.' : 'Las tareas no están disponibles en este momento.');
    let Icon = ShieldCheck;
    let iconColor = "bg-amber-500/10 text-amber-500";
    let isSunday = false;

    const msg = (error || data?.mensaje || '').toLowerCase();
    
    if (msg.includes('domingo')) {
      isSunday = true;
      displayTitle = 'DOMINGO DE DESCANSO';
      displayMessage = 'Hoy no hay tareas disponibles. En BCB Global también valoramos el descanso. Aprovecha este día para compartir con tu familia, relajarte y disfrutar de un lindo domingo. Las tareas volverán a estar disponibles mañana.';
      Icon = Heart;
      iconColor = "bg-sav-primary/10 text-sav-primary";
    } else if (msg.includes('feriado')) {
      displayTitle = 'Tareas suspendidas';
    } else if (msg.includes('mantenimiento')) {
      displayTitle = 'Sistema en mantenimiento';
    }

    return (
      <Layout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
          <Card variant="premium" className="w-full flex flex-col items-center p-10 space-y-6">
            <div className={cn(
              "w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl",
              iconColor
            )}>
              <Icon size={48} />
            </div>
            <div className="space-y-4">
              <h2 className={cn(
                "text-2xl font-black uppercase tracking-tight leading-none",
                isSunday ? "text-sav-primary" : "text-gray-900"
              )}>
                {displayTitle}
              </h2>
              <div className="space-y-4">
                {isSunday ? (
                  <>
                    <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                      Hoy no hay tareas disponibles
                    </p>
                    <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
                      En BCB Global también valoramos el descanso. Aprovecha este día para compartir con tu familia, relajarte y disfrutar de un lindo domingo.
                    </p>
                    <p className="text-[9px] font-black text-sav-primary uppercase tracking-[0.2em]">
                      Las tareas volverán a estar disponibles mañana.
                    </p>
                  </>
                ) : (
                  <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest leading-relaxed max-w-[250px]">
                    {displayMessage}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => navigate('/')} variant="outline" className="border-black/5 text-[10px] h-12 uppercase tracking-widest">Volver al Inicio</Button>
          </Card>
          
          {(data?.bloqueado || isLevelBlocked) && !isSunday && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <Link to="/vip" className="w-full">
                <Button variant="primary" className="shadow-sav-glow text-[10px] h-14 uppercase tracking-widest">Mejorar a VIP ahora</Button>
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
        <div className="min-h-screen bg-sav-dark flex flex-col animate-fade pb-10">
          <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-50 nav-blur">
            <button onClick={() => setActiveTask(null)} className="p-2 bg-white rounded-xl border border-sav-border text-gray-900">
              <X size={20} />
            </button>
            <div className="text-center">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-sav-muted leading-none mb-1">Campaña Activa</h2>
              <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{activeTask.nombre}</p>
            </div>
            <div className="w-10" />
          </header>

          <main className="px-5 py-6 space-y-6 flex-1 max-w-[430px] mx-auto w-full">
            {/* Video Card */}
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-sav-border bg-black shadow-2xl">
              <video 
                ref={videoRef}
                src={api.getMediaUrl(activeTask.video_url)}
                className="w-full h-full object-cover"
                onEnded={() => setVideoFinished(true)}
                playsInline
                autoPlay
              />
              {!surveyVisible && !showResult && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-sav-dark/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-sav-primary rounded-full animate-ping" />
                  <span className="text-xs font-black text-white">{timer}s</span>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {showResult ? (
                <Card variant="premium" className="text-center p-10 space-y-6 animate-in">
                  <div className={cn(
                    "w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg",
                    isCorrect ? "bg-sav-success/20 text-sav-success" : "bg-sav-error/20 text-sav-error"
                  )}>
                    {isCorrect ? <Trophy size={40} /> : <AlertCircle size={40} />}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                      {isCorrect ? '¡Felicidades!' : 'Reintenta'}
                    </h3>
                    <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest">
                      {isCorrect ? `Has ganado ${earnedAmount} Bs` : errorMessage}
                    </p>
                  </div>
                  <Button onClick={() => { setActiveTask(null); fetchTasks(); }}>Continuar</Button>
                </Card>
              ) : surveyVisible ? (
                <Card className="p-8 space-y-8 animate-in text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-sav-success/10 rounded-3xl flex items-center justify-center text-sav-success mx-auto shadow-lg">
                      <Sparkles size={32} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-tight">
                        Tarea Finalizada
                      </h3>
                      <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest">
                        ¡Has visualizado el contenido con éxito!
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={onConfirmResponse} 
                    loading={isSubmitting} 
                    className="h-16 shadow-sav-glow text-xs"
                  >
                    Reclamar Premio
                  </Button>
                </Card>
              ) : (
                <Card variant="flat" className="p-6 flex items-center gap-4 animate-in">
                  <div className="w-12 h-12 bg-sav-primary/10 rounded-2xl flex items-center justify-center text-sav-primary animate-pulse">
                    <Clock size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-sav-muted uppercase tracking-widest">Analizando contenido...</p>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight mt-1">Espera {timer} segundos</p>
                  </div>
                </Card>
              )}
            </AnimatePresence>
          </main>
        </div>
      </Layout>
    );
  }

  const currentLevel = niveles.find(n => String(n.id) === String(user?.nivel_id));
  const taskReward = Number(data?.ganancia_tarea || currentLevel?.ganancia_tarea || 0);
  const tareasCompletadas = Number(data?.tareas_completadas || 0);
  const tareasRestantes = Number(data?.tareas_restantes || 0);
  const totalDiarias = Number(data?.num_tareas_diarias || currentLevel?.num_tareas_diarias || (tareasCompletadas + tareasRestantes));
  const progress = totalDiarias > 0 ? (tareasCompletadas / totalDiarias) * 100 : 0;

  if (!data && !loading) {
    return (
      <Layout>
        <div className="p-10 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4">
          <AlertCircle size={48} className="text-sav-muted" />
          <p className="text-[10px] font-black uppercase tracking-widest text-sav-muted">No se pudo cargar la información de tareas</p>
          <Button onClick={fetchTasks} variant="outline" size="sm">Reintentar</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-sav-primary uppercase tracking-tighter leading-none">Tareas</h1>
          <div className="px-3 py-1.5 rounded-m3-sm bg-sav-surface border border-sav-border text-sav-primary text-[10px] font-black uppercase tracking-widest">
            {data?.nivel || 'Cargando...'}
          </div>
        </div>
        
        <Card className="p-6 space-y-4 bg-white border-sav-border shadow-m3-2">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-sav-muted uppercase tracking-widest">Progreso Diario</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-sav-primary tracking-tighter">{tareasCompletadas}</span>
                <span className="text-xs font-bold text-sav-muted uppercase tracking-widest">/ {totalDiarias}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-sav-primary uppercase tracking-[0.2em]">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="h-2.5 bg-sav-surface rounded-full overflow-hidden border border-sav-border/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-sav-primary shadow-sm" 
            />
          </div>
        </Card>
      </header>

      <main className="px-5 space-y-4 pb-12">
        <div className="flex items-center gap-2 px-1 mb-2">
          <Target size={16} className="text-sav-primary" />
          <h2 className="text-[11px] font-black text-sav-primary uppercase tracking-[0.2em]">Tareas Disponibles</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {data?.tareas?.map((t, i) => (
            <Card 
              key={`${t.id}-${i}`}
              className={cn(
                "p-4 flex items-center gap-5 bg-white border-sav-border shadow-m3-1 active:scale-[0.98] transition-all cursor-pointer group",
                data.tareas_restantes <= 0 && "opacity-60 grayscale"
              )}
              onClick={() => startTask(t)}
            >
              <div className="relative w-16 h-16 rounded-m3 overflow-hidden border border-sav-border shrink-0 bg-sav-primary/10">
                <video 
                  src={`${api.getMediaUrl(t.video_url)}#t=0.1`} 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
                  muted
                  playsInline
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play size={20} className="text-white fill-white shadow-sm" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black text-sav-primary uppercase tracking-widest bg-sav-surface px-2 py-0.5 rounded-m3-sm border border-sav-primary/10">Video AD</span>
                  <span className="text-sm font-black text-sav-success">+{ (taskReward || 0).toFixed(2) } Bs</span>
                </div>
                <h3 className="text-[13px] font-black text-sav-primary uppercase tracking-tight truncate">{t.nombre}</h3>
                <div className="flex items-center gap-3">
                   <p className="text-[9px] text-sav-muted font-bold uppercase tracking-widest flex items-center gap-1">
                    <Clock size={10} /> 10s
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-sav-border group-hover:text-sav-primary transition-colors" />
            </Card>
          ))}
          
          {(!data?.tareas || data.tareas.length === 0) && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <ClipboardList size={48} className="text-sav-muted" />
              <p className="text-[10px] font-black uppercase tracking-widest text-sav-muted">No hay tareas pendientes por hoy</p>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );

        {/* Visibility Everywhere - Investment Opportunities */}
        <section className="space-y-4 pt-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-sav-primary" />
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Sube de Nivel</h3>
            </div>
            <Link to="/vip" className="text-[9px] font-black text-sav-primary uppercase tracking-widest flex items-center gap-1">
              Ver VIP <ChevronRight size={12} />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar snap-x">
            {niveles.filter(n => (n.deposito || n.costo) > 0).map((n, i) => {
              const esActual = n.id === user?.nivel_id;
              return (
                <Link 
                  key={n.id} 
                  to="/vip"
                  className={cn(
                    "min-w-[150px] p-5 rounded-[2rem] border transition-all snap-start relative overflow-hidden group",
                    esActual ? "bg-sav-primary/10 border-sav-primary/30" : "bg-black/5 border-black/5"
                  )}
                >
                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{n.nombre}</span>
                      {esActual && <div className="w-1.5 h-1.5 rounded-full bg-sav-success animate-pulse" />}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-sav-muted uppercase tracking-widest leading-none">Ganancia Diaria</p>
                      <p className="text-lg font-black text-gray-900">+{Number(n.ingreso_diario || (Number(n.num_tareas_diarias || 0) * Number(n.ganancia_tarea || 0))).toFixed(2)} <span className="text-[9px] opacity-60">Bs</span></p>
                    </div>
                  </div>
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.05] rotate-12 group-hover:rotate-[25deg] transition-transform duration-700 text-gray-900">
                    <TrendingUp size={50} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </Layout>
  );
}
