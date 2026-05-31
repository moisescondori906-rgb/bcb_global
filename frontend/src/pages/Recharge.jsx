import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { isScheduleOpen } from '../lib/schedule';
import { 
  Clock, Sparkles, Zap, ArrowRight, Loader2,
  TrendingUp, Award, Crown, CheckCircle2,
  ChevronRight, ShieldCheck, AlertCircle
} from 'lucide-react';
import { displayLevelCode } from '../lib/displayLevel.js';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils/cn';

export default function Recharge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [niveles, setNiveles] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isScheduleLocked, setIsScheduleLocked] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');

  useEffect(() => {
    setIsMounted(true);
    
    const loadData = async () => {
      try {
        const data = await api.levels.list();
        setNiveles(data || []);
      } catch (err) {
        console.error('Error cargando niveles:', err);
      }
    };

    loadData();
    api.publicContent().then(data => {
      if (data?.horario_recarga) {
        const sched = isScheduleOpen(data.horario_recarga);
        if (!sched.ok) {
          setIsScheduleLocked(true);
          setScheduleMsg(sched.message);
        }
      }
    }).catch(() => {});
  }, []);

  const handleLevelSelect = (level) => {
    if (selectedLevel?.id === level.id) {
      setSelectedLevel(null);
    } else {
      setSelectedLevel(level);
    }
  };

  const handleContinue = () => {
    if (!selectedLevel) return;
    navigate('/pagar', { state: { level: selectedLevel } });
  };

  if (!user && isMounted) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-10 space-y-6">
          <div className="w-16 h-16 border-4 border-sav-surface border-t-sav-primary rounded-full animate-spin" />
          <p className="text-[11px] font-extrabold text-sav-muted uppercase tracking-[0.3em] animate-pulse">Sincronizando Sistema</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-sav-bg pb-32">
        <Header title="Inversión Premium" />
        
        <main className="px-6 py-8 space-y-10 max-w-lg mx-auto animate-in">
          {/* Active Membership Section */}
          <section>
            <Card variant="premium" className="p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-[2.5rem] bg-sav-primary/10 flex items-center justify-center text-sav-primary mb-6 shadow-sm border border-sav-primary/20">
                <Crown size={40} strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold text-sav-muted uppercase tracking-[0.25em]">Membresía Actual</p>
                <h2 className="text-3xl font-black text-sav-text-main uppercase tracking-tight">
                  {displayLevelCode(user?.nivel_codigo)}
                </h2>
              </div>
              <div className="mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-sav-surface border border-black/[0.03]">
                 <ShieldCheck size={14} className="text-sav-primary" />
                 <span className="text-[10px] font-bold text-sav-text-main uppercase tracking-widest">Verificación Institucional</span>
              </div>
            </Card>
          </section>

          {isScheduleLocked && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="p-5 rounded-3xl bg-rose-50 border border-rose-100 flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                  <Clock size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-[12px] font-extrabold text-rose-600 uppercase tracking-widest mb-1">Horario Restringido</h4>
                  <p className="text-[11px] text-rose-500/80 font-bold leading-tight uppercase tracking-tight">{scheduleMsg}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Level Selection */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
                <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Planes de Crecimiento</h3>
              </div>
              <Badge variant="info">GLOBAL TECH</Badge>
            </div>

            <div className="space-y-4">
              {niveles.filter(n => (n.deposito || n.costo) > 0).map((n, i) => {
                const isSelected = selectedLevel?.id === n.id;
                const isCurrent = n.id === user?.nivel_id;
                const isHigher = n.orden > (niveles.find(lvl => lvl.id === user?.nivel_id)?.orden || 0);

                return (
                  <button
                    key={n.id}
                    disabled={isCurrent || !isHigher}
                    onClick={() => handleLevelSelect(n)}
                    className={cn(
                      "w-full text-left p-6 rounded-[2rem] border-2 transition-all duration-500 relative overflow-hidden group",
                      isSelected 
                        ? "bg-white border-sav-primary shadow-m3-3 -translate-y-1" 
                        : "bg-white border-black/[0.03] hover:border-black/[0.1] shadow-m3-1",
                      (isCurrent || !isHigher) && "opacity-40 grayscale-[0.8] cursor-not-allowed bg-sav-surface/50 border-none shadow-none"
                    )}
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[13px] font-extrabold uppercase tracking-widest",
                            isSelected ? "text-sav-primary" : "text-sav-text-main"
                          )}>
                            {n.nombre}
                          </span>
                          {isCurrent && <Badge variant="success" className="py-0 px-2 text-[8px]">ACTIVO</Badge>}
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className={cn(
                            "text-4xl font-black tracking-tighter",
                            isSelected ? "text-sav-text-main" : "text-sav-text-main"
                          )}>
                            {Number(n.deposito || n.costo).toLocaleString('es-BO')}
                          </span>
                          <span className="text-xs font-bold text-sav-muted">Bs</span>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <p className="text-[9px] font-bold text-sav-muted uppercase tracking-[0.2em]">Renta Diaria</p>
                        <p className={cn("text-xl font-black tracking-tight", isSelected ? "text-sav-primary" : "text-emerald-600")}>
                          +{Number(n.ingreso_diario || (Number(n.num_tareas_diarias || 0) * Number(n.ganancia_tarea || 0))).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 size={16} className="text-sav-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="h-28" />
          
          <AnimatePresence>
            {selectedLevel && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-28 left-0 right-0 px-6 z-[100] flex justify-center"
              >
                <div className="w-full max-w-sm">
                  <Button 
                    onClick={handleContinue}
                    className="w-full h-16 shadow-accent-glow uppercase tracking-[0.2em] text-[15px]"
                    icon={ArrowRight}
                  >
                    CONTINUAR AL PAGO
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </Layout>
  );
}
