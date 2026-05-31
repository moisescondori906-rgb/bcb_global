import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  History, ArrowUpCircle, ArrowDownCircle, 
  FileText, Clock, Filter, CheckCircle2, 
  AlertCircle, XCircle, Loader2,
  Wallet, TrendingUp, Sparkles, ChevronRight
} from 'lucide-react';
import { formatDate } from '../lib/utils/format';

// UI Components
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { cn } from '../lib/utils/cn';

export default function Movimientos() {
  const { user } = useAuth();
  const [tab, setTab] = useState('todo');
  const [data, setData] = useState({ recargas: [], retiros: [] });
  const [loading, setLoading] = useState(true);

  const fetchMovs = useCallback(async (isInitial = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    if (isInitial) setLoading(true);
    
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 15000);

    try {
      const [recargas, retiros] = await Promise.all([
        api.recharges.list().catch(() => []),
        api.withdrawals.list().catch(() => [])
      ]);

      setData({ 
        recargas: Array.isArray(recargas) ? recargas : [], 
        retiros: Array.isArray(retiros) ? retiros : [] 
      });
    } catch (err) {
      console.error('[Movimientos] Fetch error:', err);
    } finally {
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMovs(true);
    const interval = setInterval(() => fetchMovs(false), 30000);
    return () => clearInterval(interval);
  }, [fetchMovs]);

  const combinedItems = [
    ...(Array.isArray(data.recargas) ? data.recargas : []).map(r => ({ ...r, tipo_visual: 'recarga' })),
    ...(Array.isArray(data.retiros) ? data.retiros : []).map(r => ({ ...r, tipo_visual: 'retiro' }))
  ].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  const filteredItems = tab === 'todo' 
    ? combinedItems 
    : (tab === 'recargas' 
        ? combinedItems.filter(i => i.tipo_visual === 'recarga') 
        : combinedItems.filter(i => i.tipo_visual === 'retiro')
      );

  const getStatusBadge = (estado) => {
    const e = String(estado || '').toLowerCase();
    if (['aprobada', 'aprobado', 'completado', 'pagado'].includes(e)) return <Badge variant="success">COMPLETADO</Badge>;
    if (['rechazada', 'rechazado', 'error'].includes(e)) return <Badge variant="error">RECHAZADO</Badge>;
    return <Badge variant="warning" className="animate-pulse">PENDIENTE</Badge>;
  };

  if (loading && combinedItems.length === 0) {
    return (
      <Layout>
        <div className="p-10 flex flex-col items-center justify-center min-h-[70vh] space-y-6">
          <div className="w-16 h-16 border-4 border-sav-surface border-t-sav-primary rounded-full animate-spin" />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-sav-muted animate-pulse">Sincronizando Historial</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-sav-bg min-h-screen pb-32">
        <Header title="Historial Transaccional" />
        
        <main className="px-6 py-8 space-y-10 max-w-lg mx-auto animate-in">
          {/* Tab Switcher - Flutter Style */}
          <section>
            <div className="flex p-1.5 bg-white border border-black/[0.03] rounded-[2rem] gap-2 shadow-m3-1">
              {[
                { id: 'todo', label: 'Todo', icon: History },
                { id: 'recargas', label: 'Ingresos', icon: ArrowUpCircle },
                { id: 'retiros', label: 'Retiros', icon: ArrowDownCircle }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500",
                    tab === t.id 
                      ? "bg-sav-primary text-white shadow-accent-glow" 
                      : "text-sav-muted hover:text-sav-text-main"
                  )}
                >
                  <t.icon size={16} strokeWidth={isActive => tab === t.id ? 3 : 2} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* List Section */}
          <section className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
                <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Lista de Operaciones</h3>
              </div>
              <Badge variant="info">{filteredItems.length} REGISTROS</Badge>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, i) => {
                  const isRecarga = item.tipo_visual === 'recarga';
                  return (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="p-5 flex items-center gap-5 bg-white border-black/[0.03] hover:shadow-m3-2 transition-all group">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 transition-all duration-500 group-hover:rotate-6",
                          isRecarga ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-indigo-50 border-indigo-100 text-indigo-500"
                        )}>
                          {isRecarga ? <ArrowUpCircle size={28} strokeWidth={2} /> : <ArrowDownCircle size={28} strokeWidth={2} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-4">
                            <div className="min-w-0">
                              <h4 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-tight truncate mb-0.5 group-hover:text-sav-primary transition-colors">
                                {isRecarga ? 'Recarga Institucional' : 'Retiro de Capital'}
                              </h4>
                              <p className="text-[9px] text-sav-muted font-bold tracking-[0.2em] uppercase">
                                ID: {item.id?.slice(0, 8).toUpperCase()}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={cn(
                                "text-xl font-black tracking-tighter mb-0.5",
                                isRecarga ? "text-emerald-600" : "text-sav-text-main"
                              )}>
                                {isRecarga ? '+' : '-'}{Number(item.monto).toLocaleString()}
                              </p>
                              <span className="text-[10px] font-black text-sav-muted uppercase tracking-widest">Bs</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-4 border-t border-black/[0.02]">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-sav-muted uppercase tracking-widest">
                              <Clock size={12} className="opacity-50" strokeWidth={3} />
                              {formatDate(item.created_at)}
                            </div>
                            {getStatusBadge(item.estado)}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredItems.length === 0 && !loading && (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 rounded-[3rem] bg-sav-surface border-2 border-dashed border-black/[0.05] flex items-center justify-center text-sav-muted/30">
                    <FileText size={48} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-widest">Historial Vacío</p>
                    <p className="text-[11px] font-bold text-sav-muted uppercase tracking-tight leading-relaxed max-w-[200px] mx-auto">No se han registrado operaciones en esta categoría todavía.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}
