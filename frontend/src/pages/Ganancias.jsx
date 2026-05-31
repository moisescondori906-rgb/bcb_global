import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  Wallet, TrendingUp, History, Target, 
  ArrowUpCircle, ArrowDownCircle, AlertCircle,
  Trophy, Users, UserPlus, Filter, Clock
} from 'lucide-react';

// UI Components
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { cn } from '../lib/utils/cn';

const categories = [
  { id: 'todo', label: 'Todo', icon: History },
  { id: 'tareas', label: 'Tareas', icon: Trophy },
  { id: 'comisiones', label: 'Comisiones', icon: Users },
  { id: 'invitaciones', label: 'Invitados', icon: UserPlus },
  { id: 'recargas', label: 'Recargas', icon: ArrowUpCircle },
  { id: 'retiros', label: 'Retiros', icon: ArrowDownCircle },
  { id: 'otros', label: 'Otros', icon: Filter }
];

export default function Ganancias() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('todo');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [punished, setPunished] = useState(false);

  const fetchData = async () => {
    try {
      if (!data) setLoading(true);
      const res = await api.users.earnings().catch(err => {
        console.error('Error earnings API:', err);
        return { 
          history: [], 
          summary: { total: 0, hoy: 0 } 
        };
      });
      // Asegurar estructura mínima para evitar errores de renderizado
      setData({
        history: res?.history || [],
        summary: res?.summary || { total: 0, hoy: 0 }
      });
    } catch (err) {
      console.error('Error general fetchData Ganancias:', err);
      setError('No se pudo sincronizar el historial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData();
    }, 15000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user?.id]);

  const historyList = Array.isArray(data?.history) ? data.history.filter(item => {
    if (tab === 'todo') return true;
    const tipo = item.tipo_movimiento?.toLowerCase() || '';
    const filters = {
      tareas: ['ganancia_tarea', 'tarea_completada'],
      comisiones: ['comision_subordinado', 'comision_red'],
      invitaciones: ['recompensa_invitacion', 'bono_invitado'],
      recargas: ['recarga', 'deposito'],
      retiros: ['retiro', 'extraccion'],
      otros: ['ajuste_admin', 'bono_manual', 'premio_ruleta']
    };
    return filters[tab]?.some(f => tipo.includes(f));
  }) : [];

  if (loading && !data) {
    return (
      <Layout>
        <div className="p-10 flex flex-col items-center justify-center min-h-[70vh] space-y-6">
          <div className="w-16 h-16 border-4 border-white/5 border-t-sav-accent rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-sav-muted animate-pulse">Sincronizando Billetera</p>
        </div>
      </Layout>
    );
  }

  if (punished) {
    return (
      <Layout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
          <Card className="w-full flex flex-col items-center p-10 space-y-8 bg-zinc-950/60 backdrop-blur-3xl border border-white/10">
            <div className="w-20 h-20 bg-sav-error/10 text-sav-error border border-sav-error/20 rounded-[2rem] flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.15)]">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white">Acceso Restringido</h2>
              <p className="text-sm font-medium text-zinc-400 leading-relaxed px-4">
                Tu sistema de ganancias ha sido bloqueado por hoy debido al cuestionario obligatorio.
              </p>
            </div>
            <Button onClick={() => window.location.reload()} variant="primary" className="w-full">VERIFICAR ESTADO</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="px-5 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Mi <span className="text-gradient">Billetera</span></h1>
          <Badge variant="info">GLOBAL TECH</Badge>
        </div>

        <div className="relative group perspective-1000">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-sav-accent to-sav-secondary rounded-m3-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <Card className="relative bg-zinc-950/60 backdrop-blur-3xl border border-white/10 p-8 overflow-hidden shadow-m3-3">
            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-sav-accent/20 rounded-full blur-[80px] animate-pulse" />
            
            <div className="space-y-8 relative z-10">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.3em]">Capital Acumulado</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl font-bold text-white tracking-tighter">
                    {(data?.summary?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h2>
                  <span className="text-sm font-bold text-sav-accent uppercase tracking-widest">Bs</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest">Tareas (Hoy)</p>
                  <p className="text-xl font-bold text-white tracking-tight">
                    {(data?.summary?.tareas_hoy || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest">Red (Hoy)</p>
                  <p className="text-xl font-bold text-sav-accent tracking-tight">
                    {(data?.summary?.comisiones_hoy || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </header>

      <main className="px-5 space-y-8 pb-32">
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Filter size={14} className="text-sav-accent" />
            <h2 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Filtrar Historial</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setTab(cat.id)}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3 rounded-xl whitespace-nowrap text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 active:scale-95",
                  tab === cat.id 
                    ? "bg-sav-accent border-sav-accent text-white shadow-accent-glow" 
                    : "bg-white/[0.03] border-white/10 text-zinc-500 hover:border-white/20"
                )}
              >
                <cat.icon size={14} strokeWidth={2.5} />
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <History size={16} className="text-sav-accent" /> Actividad Reciente
            </h2>
            <Badge variant="muted" className="px-2 py-0.5">{historyList.length}</Badge>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {historyList.map((item, i) => {
                const tipoLower = item.tipo_movimiento?.toLowerCase() || '';
                const isPositive = !['retiro', 'extraccion', 'ajuste_admin_negativo'].some(t => tipoLower.includes(t));
                return (
                  <motion.div
                    layout
                    key={item.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="p-4 bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                        isPositive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {isPositive ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-wide truncate">
                          {item.descripcion || item.tipo_movimiento}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock size={10} className="text-zinc-600" />
                          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest truncate">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          "text-lg font-bold tracking-tight",
                          isPositive ? "text-emerald-400" : "text-red-400"
                        )}>
                          {isPositive ? '+' : '-'}{Math.abs(Number(item.monto)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">Bs</p>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {historyList.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-center text-zinc-800">
                  <History size={32} />
                </div>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Sin movimientos registrados</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
}
