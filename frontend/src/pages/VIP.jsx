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
            <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Membresía <span className="text-gradient">VIP</span></h1>
            <Badge variant="info" className="py-1">OFICIAL</Badge>
          </div>

          {/* Current Status Card - Ultra Modern */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-sav-accent to-sav-secondary rounded-m3-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <Card className="relative bg-zinc-950/60 backdrop-blur-3xl border border-white/10 p-8 overflow-hidden shadow-m3-3">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-sav-accent/20 rounded-full blur-[60px]" />
              <div className="flex flex-col items-center relative z-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sav-accent to-sav-secondary flex items-center justify-center text-white mb-4 shadow-accent-glow">
                  <Crown size={32} strokeWidth={2.5} />
                </div>
                <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.3em] mb-1">Tu Nivel Actual</p>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  {displayLevelCode(user?.nivel_codigo || 'Internar')}
                </h2>
              </div>
            </Card>
          </div>
          
          {/* Info Table Card */}
          <Card className="p-4 bg-white/[0.03] border-white/10 shadow-m3-1 overflow-hidden group">
             <div className="rounded-m3 overflow-hidden border border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
               <img src="/imag/tabla_invercion.webp" alt="Tabla de Inversión" className="w-full h-auto object-contain" />
             </div>
          </Card>
        </header>

        <main className="px-5 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={16} className="text-sav-accent" />
            <h2 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Opciones Premium</h2>
          </div>

          <div className="space-y-6">
            {Array.isArray(niveles) && niveles.filter(n => (n.deposito || n.costo) > 0).map((nivel, i) => {
              const esActual = nivel.id === user?.nivel_id;
              const esSuperior = esNivelSuperior(nivel);
              const bloqueado = nivel.activo === false;

              return (
                <Card 
                  key={nivel.id} 
                  className={cn(
                    "p-6 transition-all duration-500 border-white/10 relative overflow-hidden group",
                    esActual ? "bg-gradient-to-br from-sav-accent/20 to-sav-secondary/20 border-sav-accent/40 shadow-accent-glow" : "bg-white/[0.03]",
                    !esActual && !esSuperior && "opacity-40 grayscale"
                  )}
                >
                  {esActual && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sav-accent to-sav-secondary" />
                  )}
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                        esActual ? "bg-sav-accent text-white shadow-accent-glow scale-110" : "bg-white/5 text-sav-muted border border-white/5"
                      )}>
                        <Crown size={24} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-lg font-bold text-white tracking-tight">{nivel.nombre}</h3>
                        <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest">Costo: {formatBs(nivel.deposito)} Bs</p>
                      </div>
                    </div>
                    {esActual && (
                       <Badge variant="success">ACTIVO</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] group-hover:bg-white/[0.05] transition-colors">
                      <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mb-1">Retorno Diario</p>
                      <p className="text-base font-bold text-emerald-400 tracking-tight">+{formatBs(nivel.ingreso_diario)} Bs</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] group-hover:bg-white/[0.05] transition-colors">
                      <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mb-1">Capacidad</p>
                      <p className="text-base font-bold text-sav-accent tracking-tight">{nivel.num_tareas_diarias} Tareas</p>
                    </div>
                  </div>

                  {esSuperior && !bloqueado && (
                    <Button 
                      onClick={() => handleUpgrade(nivel)}
                      variant="primary"
                      className="w-full h-13 text-[11px]"
                    >
                      ADQUIRIR MEMBRESÍA
                    </Button>
                  )}
                  
                  {bloqueado && (
                    <div className="flex items-center justify-center gap-2 py-4 bg-white/5 rounded-xl text-zinc-500 text-[10px] font-bold uppercase tracking-widest border border-dashed border-white/10">
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
