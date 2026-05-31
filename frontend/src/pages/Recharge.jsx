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
    // Si ya está seleccionado, lo deseleccionamos para forzar re-render de AnimatePresence
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
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-sav-dark p-10">
          <div className="relative">
            <Loader2 className="animate-spin text-sav-primary mb-4" size={40} />
            <div className="absolute inset-0 bg-sav-primary/20 blur-xl animate-pulse" />
          </div>
          <p className="text-[10px] font-black text-sav-muted uppercase tracking-[0.3em] animate-pulse">Sincronizando Perfil...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-32">
        <Header title="Inversión" />
        
        <main className="px-4 sm:px-6 py-6 space-y-6 animate-in">
          {/* Nivel Actual - Flutter Card Style */}
          <section>
            <Card className="p-6 bg-sav-primary border-none shadow-m3-3 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
               <div className="flex flex-col items-center py-2 relative z-10">
                 <div className="w-14 h-14 rounded-m3 bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-3 shadow-lg">
                   <Crown size={28} strokeWidth={2.5} />
                 </div>
                 <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Membresía Actual</p>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
                   {displayLevelCode(user?.nivel_codigo)}
                 </h2>
               </div>
            </Card>
          </section>

          {isScheduleLocked && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="p-4 rounded-m3 bg-sav-error/5 border border-sav-error/20 flex items-start gap-3 shadow-m3-1">
                <Clock size={18} className="text-sav-error shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-black text-sav-error uppercase tracking-widest mb-1">Horario Restringido</h4>
                  <p className="text-[10px] text-sav-error/80 font-bold uppercase leading-relaxed tracking-tight">{scheduleMsg}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Selection */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-sav-primary" />
                <h3 className="text-[11px] font-black text-sav-primary uppercase tracking-[0.2em]">Selecciona un Plan</h3>
              </div>
              <Badge variant="info" className="bg-sav-surface text-sav-primary border-sav-border">BCB GLOBAL</Badge>
            </div>

            <div className="space-y-3">
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
                      "w-full text-left p-5 rounded-m3-lg border transition-all relative overflow-hidden group",
                      isSelected 
                        ? "bg-sav-surface border-sav-primary shadow-m3-2 ring-1 ring-sav-primary/30" 
                        : "bg-white border-sav-border hover:bg-sav-surface/50 shadow-m3-1",
                      (isCurrent || !isHigher) && "opacity-40 grayscale-[0.5] cursor-not-allowed"
                    )}
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[11px] font-black uppercase tracking-widest",
                            isSelected ? "text-sav-primary" : "text-slate-900"
                          )}>
                            {n.nombre}
                          </span>
                          {isCurrent && <Badge variant="success" className="text-[7px] py-0 px-1.5">ACTUAL</Badge>}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className={cn(
                            "text-2xl font-black tracking-tighter",
                            isSelected ? "text-sav-primary" : "text-slate-900"
                          )}>
                            {Number(n.deposito || n.costo).toLocaleString('es-BO')}
                          </span>
                          <span className={cn("text-[10px] font-bold", isSelected ? "text-sav-primary/60" : "text-slate-400")}>Bs</span>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <p className={cn("text-[8px] font-black uppercase tracking-widest", isSelected ? "text-sav-primary/60" : "text-slate-400")}>Renta Diaria</p>
                        <p className={cn("text-[13px] font-black", isSelected ? "text-sav-primary" : "text-emerald-600")}>
                          +{Number(n.ingreso_diario || (Number(n.num_tareas_diarias || 0) * Number(n.ganancia_tarea || 0))).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Spacer */}
          <div className="h-20" />
          
          <AnimatePresence>
            {selectedLevel && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-[calc(95px+env(safe-area-inset-bottom))] left-0 right-0 p-6 z-[100] flex justify-center pointer-events-none"
              >
                <div className="w-full max-w-sm pointer-events-auto">
                  <Button 
                    onClick={handleContinue}
                    className="h-14 shadow-m3-3"
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
