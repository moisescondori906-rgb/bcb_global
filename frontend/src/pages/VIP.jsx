import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Header from '../components/Header.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Crown, CheckCircle2, Lock, TrendingUp, 
  Users, Sparkles, Clock, ChevronRight, 
  ShieldCheck, ArrowUpCircle, Zap, Star
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
      <div className="bg-sav-bg min-h-screen pb-32">
        <Header title="Membresía VIP" />
        
        <main className="px-6 py-8 space-y-10 max-w-lg mx-auto animate-in">
          {/* Current Status Header Card */}
          <section>
            <Card variant="premium" className="p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-[2.5rem] bg-sav-primary/10 flex items-center justify-center text-sav-primary mb-6 shadow-sm border border-sav-primary/20">
                <Crown size={40} strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-extrabold text-sav-muted uppercase tracking-[0.3em]">Tu Estatus Actual</p>
                <h2 className="text-4xl font-black text-sav-text-main uppercase tracking-tight">
                  {displayLevelCode(user?.nivel_codigo || 'Internar')}
                </h2>
              </div>
              <Badge variant="info" className="mt-6 py-1.5 px-4 rounded-full border-indigo-200/50">MEMBRESÍA ACTIVA</Badge>
            </Card>
          </section>

          {/* Investment Guide Banner */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
              <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Guía de Inversión</h3>
            </div>
            <Card className="p-4 bg-white border-black/[0.03] shadow-m3-1 overflow-hidden group">
               <div className="rounded-2xl overflow-hidden border border-black/[0.02]">
                 <img src="/imag/tabla_invercion.webp" alt="Tabla de Inversión" className="w-full h-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
               </div>
            </Card>
          </section>

          {/* VIP Levels Grid */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Sparkles size={16} className="text-sav-accent" />
              <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Planes Institucionales</h3>
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
                      "p-8 transition-all duration-500 relative overflow-hidden group",
                      esActual ? "bg-white border-sav-primary shadow-m3-3" : "bg-white border-black/[0.03] shadow-m3-1",
                      !esActual && !esSuperior && "opacity-50 grayscale"
                    )}
                  >
                    {esActual && (
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sav-primary to-sav-accent" />
                    )}
                    
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                          esActual ? "bg-sav-primary text-white shadow-accent-glow" : "bg-sav-surface text-sav-muted border border-black/[0.03]"
                        )}>
                          <Crown size={28} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="text-xl font-black text-sav-text-main tracking-tight uppercase">{nivel.nombre}</h3>
                          <div className="flex items-center gap-1.5">
                             <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest">Inversión:</p>
                             <p className="text-xs font-black text-sav-primary">{formatBs(nivel.deposito)} Bs</p>
                          </div>
                        </div>
                      </div>
                      {esActual && (
                         <Badge variant="success" className="shadow-sm">ACTUAL</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-5 mb-8">
                      <div className="p-5 rounded-3xl bg-sav-surface border border-black/[0.02] group-hover:bg-emerald-50/50 transition-colors">
                        <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mb-1.5">Renta Diaria</p>
                        <p className="text-lg font-black text-emerald-600 tracking-tight">+{formatBs(nivel.ingreso_diario)} Bs</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-sav-surface border border-black/[0.02] group-hover:bg-indigo-50/50 transition-colors">
                        <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mb-1.5">Capacidad</p>
                        <p className="text-lg font-black text-sav-primary tracking-tight">{nivel.num_tareas_diarias} Misiones</p>
                      </div>
                    </div>

                    {esSuperior && !bloqueado && (
                      <Button 
                        onClick={() => handleUpgrade(nivel)}
                        variant="primary"
                        className="w-full h-14 shadow-accent-glow"
                        icon={Zap}
                      >
                        ACTIVAR MEMBRESÍA
                      </Button>
                    )}
                    
                    {bloqueado && (
                      <div className="flex items-center justify-center gap-3 py-4 bg-sav-surface rounded-2xl text-sav-muted text-[10px] font-bold uppercase tracking-[0.2em] border border-dashed border-black/[0.05]">
                        <Lock size={14} strokeWidth={2.5} /> Próximamente
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}
