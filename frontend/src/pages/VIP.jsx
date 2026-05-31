import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Crown, CheckCircle2, Lock, TrendingUp, 
  Users, Sparkles, Clock, ChevronRight, 
  ShieldCheck, ArrowUpCircle 
} from 'lucide-react';
import { displayLevelCode } from '../lib/displayLevel.js';
import { cn } from '../lib/utils/cn';

// UI Components
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';

export default function VIP() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [niveles, setNiveles] = useState([]);

  useEffect(() => {
    api.levels.list().then(setNiveles).catch(() => []);
  }, []);

  const formatBs = (val) => Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleUpgrade = (nivel) => {
    navigate('/recargar', {
      state: {
        monto: nivel.deposito,
        modo: 'Compra VIP',
        nivelId: nivel.id,
        nivelNombre: nivel.nombre
      }
    });
  };

  const esNivelSuperior = (nivel) => {
    const currentNivel = niveles.find(n => n.id === user?.nivel_id);
    if (!currentNivel) return true;
    return (nivel.orden || 0) > (currentNivel.orden || 0);
  };

  return (
    <Layout>
      <div className="min-h-screen pb-32">
        <header className="px-6 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-sav-primary uppercase tracking-tighter leading-none">VIP Global</h1>
            <div className="px-2 py-1 rounded-m3-sm bg-sav-surface border border-sav-border text-sav-primary text-[9px] font-black uppercase tracking-widest">
              OFICIAL
            </div>
          </div>

          {/* Current Status Card - Flutter Redesign */}
          <Card className="p-6 bg-sav-primary border-none shadow-m3-3 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
             <div className="flex flex-col items-center py-4 relative z-10">
               <div className="w-16 h-16 rounded-m3 bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-4 shadow-lg">
                 <Crown size={32} strokeWidth={2.5} />
               </div>
               <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Membresía Actual</p>
               <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                 {displayLevelCode(user?.nivel_codigo || 'Internar')}
               </h2>
             </div>
          </Card>
          
          {/* Info Table Card */}
          <Card className="p-4 bg-white border-sav-border shadow-m3-1 overflow-hidden">
             <div className="rounded-m3 overflow-hidden border border-sav-border/50">
               <img src="/imag/tabla_invercion.webp" alt="Tabla de Inversión" className="w-full h-auto object-contain" />
             </div>
          </Card>
        </header>

        <main className="px-5 space-y-4">
          <div className="flex items-center gap-2 px-1 mb-2">
            <Sparkles size={16} className="text-sav-primary" />
            <h2 className="text-[11px] font-black text-sav-primary uppercase tracking-[0.2em]">Opciones de Membresía</h2>
          </div>

          <div className="space-y-4">
            {Array.isArray(niveles) && niveles.filter(n => (n.deposito || n.costo) > 0).map((nivel, i) => {
              const esActual = nivel.id === user?.nivel_id;
              const esSuperior = esNivelSuperior(nivel);
              const bloqueado = nivel.activo === false;

              return (                <Card 
                  key={nivel.id} 
                  className={cn(
                    "p-6 transition-all border-sav-border shadow-m3-1 relative overflow-hidden",
                    esActual ? "bg-sav-surface border-sav-primary/30" : "bg-white",
                    !esActual && !esSuperior && "opacity-50 grayscale-[0.5]"
                  )}
                >
                  {esActual && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-sav-primary" />
                  )}
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-m3 flex items-center justify-center shadow-m3-1 border",
                        esActual ? "bg-sav-primary text-white border-sav-primary" : "bg-sav-surface text-sav-primary border-sav-border"
                      )}>
                        <Crown size={22} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-base font-black text-sav-primary uppercase tracking-tight">{nivel.nombre}</h3>
                        <p className="text-[9px] font-black text-sav-muted uppercase tracking-widest">Inversión: {formatBs(nivel.deposito)} Bs</p>
                      </div>
                    </div>
                    {esActual && (
                       <Badge variant="success" className="bg-sav-primary text-white border-none px-3">ACTIVO</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3.5 rounded-m3 bg-sav-surface border border-sav-border/50">
                      <p className="text-[8px] font-black text-sav-muted uppercase tracking-widest mb-1">Diario</p>
                      <p className="text-sm font-black text-sav-primary">+{formatBs(nivel.ingreso_diario)} Bs</p>
                    </div>
                    <div className="p-3.5 rounded-m3 bg-sav-surface border border-sav-border/50">
                      <p className="text-[8px] font-black text-sav-muted uppercase tracking-widest mb-1">Tareas</p>
                      <p className="text-sm font-black text-sav-primary">{nivel.num_tareas_diarias} Videos</p>
                    </div>
                  </div>

                  {esSuperior && !bloqueado && (
                    <Button 
                      onClick={() => handleUpgrade(nivel)}
                      variant="primary"
                      className="h-13 text-[11px]"
                    >
                      ADQUIRIR MEMBRESÍA
                    </Button>
                  )}
                  
                  {bloqueado && (
                    <div className="flex items-center justify-center gap-2 p-3.5 bg-sav-surface rounded-m3 text-sav-muted text-[10px] font-black uppercase tracking-widest border border-dashed border-sav-border">
                      <Lock size={14} /> Próximamente
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </Layout>
  );
}
