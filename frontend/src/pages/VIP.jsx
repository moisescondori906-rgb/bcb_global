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

  const formatBOB = (val) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const handleUpgrade = (nivel) => {
    navigate('/recargar', {
      state: {
        monto: nivel.deposito || nivel.costo,
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
      <header className="px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Membresías VIP</h1>
          <Badge variant="info">PREMIUM</Badge>
        </div>

        {/* Current Status Card */}
        <Card variant="premium" className="relative overflow-hidden group border-sav-primary/30">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform">
            <Crown size={80} />
          </div>
          <div className="relative z-10 flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-sav-primary/10 border border-sav-primary/20 flex items-center justify-center text-sav-primary mb-4 shadow-lg shadow-sav-primary/10">
              <Crown size={32} strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-black text-sav-muted uppercase tracking-[0.3em] mb-1">Tu Nivel Actual</p>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">
              {displayLevelCode(user?.nivel_codigo || 'pasante')}
            </h2>
          </div>
        </Card>
      </header>

      <main className="px-5 space-y-6 pb-10">
        <div className="flex items-center gap-2 px-1 mb-2">
          <Sparkles size={16} className="text-sav-primary" />
          <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Planes Disponibles</h2>
        </div>

        <div className="space-y-4">
          {niveles.map((nivel, i) => {
            const esActual = nivel.id === user?.nivel_id;
            const esSuperior = esNivelSuperior(nivel);
            const bloqueado = nivel.activo === false;

            return (
              <Card 
                key={nivel.id} 
                variant={esActual ? 'premium' : 'flat'}
                className={cn(
                  "p-6 transition-all relative overflow-hidden",
                  !esActual && !esSuperior && "opacity-40 grayscale"
                )}
                delay={i * 0.05}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110",
                      esActual ? "bg-sav-primary/10 border-sav-primary/20 text-sav-primary" : "bg-sav-surface border-sav-border text-sav-muted"
                    )}>
                      <Crown size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">
                        {displayLevelCode(nivel.codigo)}
                      </h3>
                      <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mt-1">Nivel Profesional</p>
                    </div>
                  </div>
                  {esActual ? (
                    <Badge variant="success" icon={CheckCircle2}>ACTIVO</Badge>
                  ) : esSuperior && !bloqueado ? (
                    <Button 
                      onClick={() => handleUpgrade(nivel)}
                      className="h-10 px-6 text-[10px] tracking-widest"
                    >
                      UNIRSE
                    </Button>
                  ) : (
                    <Badge variant="muted" icon={Lock}>{bloqueado ? 'PRONTO' : 'CERRADO'}</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-sav-dark/40 rounded-2xl p-4 border border-sav-border">
                    <p className="text-[8px] font-black text-sav-muted uppercase tracking-widest mb-1">Inversión</p>
                    <p className="text-sm font-black text-white">
                      {formatBOB(nivel.deposito || nivel.costo)} <span className="text-[9px] font-bold text-sav-muted">BOB</span>
                    </p>
                  </div>
                  <div className="bg-sav-dark/40 rounded-2xl p-4 border border-sav-border">
                    <p className="text-[8px] font-black text-sav-muted uppercase tracking-widest mb-1">Renta Diaria</p>
                    <p className="text-sm font-black text-sav-success">
                      +{formatBOB((nivel.num_tareas_diarias || 0) * (nivel.comision_por_tarea || 0))} <span className="text-[9px] font-bold">BOB</span>
                    </p>
                  </div>
                </div>

                {nivel.retiro_horario_habilitado && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-sav-primary/5 rounded-xl border border-sav-primary/10">
                    <Clock size={12} className="text-sav-primary" />
                    <span className="text-[9px] font-bold text-sav-primary uppercase tracking-widest">Retiros habilitados: {nivel.retiro_hora_inicio} - {nivel.retiro_hora_fin}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Benefits Section */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-2 px-1 mb-2">
            <Users size={16} className="text-sav-primary" />
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Beneficios por Invitación</h2>
          </div>
          <Card variant="outline" className="p-6 border-dashed border-sav-primary/20 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Nivel A', val: '12%', sub: 'Directo' },
                { label: 'Nivel B', val: '3%', sub: 'Indirecto' },
                { label: 'Nivel C', val: '1%', sub: 'Equipo' },
              ].map((item, i) => (
                <div key={i} className="text-center space-y-1">
                  <p className="text-[8px] font-black text-sav-muted uppercase tracking-widest">{item.label}</p>
                  <p className="text-xl font-black text-white tracking-tighter">{item.val}</p>
                  <p className="text-[7px] font-bold text-sav-primary uppercase tracking-widest">{item.sub}</p>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-sav-border">
              <p className="text-[10px] text-sav-muted text-center leading-relaxed font-bold uppercase tracking-widest">
                Multiplica tus ganancias construyendo un equipo sólido en BCB Global.
              </p>
            </div>
          </Card>
        </section>
      </main>
    </Layout>
  );
}
