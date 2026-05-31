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
  TrendingUp, Award, Crown
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
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-10">
          <div className="relative">
            <Loader2 className="animate-spin text-sav-accent mb-4" size={40} />
            <div className="absolute inset-0 bg-sav-accent/20 blur-xl animate-pulse" />
          </div>
          <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.3em] animate-pulse">Sincronizando Sistema...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-32">
        <Header title="Inversión Premium" />
        
        <main className="px-4 sm:px-6 py-6 space-y-8 animate-in">
          {/* Nivel Actual - Ultra Modern */}
          <section>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-sav-accent to-sav-secondary rounded-m3-lg blur opacity-20 transition duration-1000 group-hover:opacity-40"></div>
              <Card className="relative p-7 bg-zinc-950/60 backdrop-blur-3xl border border-white/10 rounded-m3-lg overflow-hidden shadow-m3-3">
                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-sav-accent/20 rounded-full blur-[60px]" />
                <div className="flex flex-col items-center py-2 relative z-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sav-accent to-sav-secondary flex items-center justify-center text-white mb-4 shadow-accent-glow">
                    <Crown size={32} strokeWidth={2.5} />
                  </div>
                  <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.3em] mb-1">Membresía Activa</p>
                  <h2 className="text-3xl font-bold text-white uppercase tracking-tight leading-none">
                    {displayLevelCode(user?.nivel_codigo)}
                  </h2>
                </div>
              </Card>
            </div>
          </section>

          {isScheduleLocked && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-start gap-3 shadow-m3-1">
                <Clock size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-widest mb-1">Horario Restringido</h4>
                  <p className="text-[10px] text-zinc-400 font-medium leading-relaxed tracking-tight">{scheduleMsg}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Selection */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-sav-accent" />
                <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Selecciona un Plan</h3>
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
                      "w-full text-left p-6 rounded-xl border transition-all duration-300 relative overflow-hidden group",
                      isSelected 
                        ? "bg-white/[0.05] border-sav-accent shadow-accent-glow" 
                        : "bg-white/[0.02] border-white/10 hover:border-white/20 shadow-m3-1",
                      (isCurrent || !isHigher) && "opacity-40 grayscale cursor-not-allowed"
                    )}
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[12px] font-bold uppercase tracking-wider",
                            isSelected ? "text-white" : "text-zinc-400"
                          )}>
                            {n.nombre}
                          </span>
                          {isCurrent && <Badge variant="success">ACTUAL</Badge>}
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className={cn(
                            "text-3xl font-bold tracking-tighter",
                            isSelected ? "text-sav-accent" : "text-white"
                          )}>
                            {Number(n.deposito || n.costo).toLocaleString('es-BO')}
                          </span>
                          <span className="text-xs font-bold text-zinc-600">Bs</span>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Renta Diaria</p>
                        <p className={cn("text-lg font-bold tracking-tight", isSelected ? "text-white" : "text-emerald-400")}>
                          +{Number(n.ingreso_diario || (Number(n.num_tareas_diarias || 0) * Number(n.ganancia_tarea || 0))).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="h-24" />
          
          <AnimatePresence>
            {selectedLevel && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-28 left-0 right-0 p-6 z-[100] flex justify-center pointer-events-none"
              >
                <div className="w-full max-w-sm pointer-events-auto">
                  <Button 
                    onClick={handleContinue}
                    className="w-full h-14 shadow-accent-glow uppercase tracking-widest"
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
}
