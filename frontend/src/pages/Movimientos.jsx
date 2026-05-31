import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  History, ArrowUpCircle, ArrowDownCircle, 
  FileText, Clock, Filter, CheckCircle2, 
  AlertCircle, XCircle, Loader2
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
    
    // Timeout de seguridad por si algo en la cadena de promesas falla silenciosamente
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 15000);

    try {
      console.log('[Movimientos] Fetching list...');
      const recargas = await api.recharges.list().catch((err) => {
        console.error('[Movimientos] Error in recharges:', err);
        return [];
      });
      const retiros = await api.withdrawals.list().catch((err) => {
        console.error('[Movimientos] Error in withdrawals:', err);
        return [];
      });

      console.log('[Movimientos] Received:', { recargas, retiros });

      setData({ 
        recargas: Array.isArray(recargas) ? recargas : [], 
        retiros: Array.isArray(retiros) ? retiros : [] 
      });
    } catch (err) {
      console.error('[Movimientos] Fetch fatal error:', err);
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
          <div className="w-16 h-16 border-4 border-white/5 border-t-sav-accent rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-sav-muted animate-pulse">Cargando Historial</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Historial de <span className="text-gradient">Movimientos</span></h1>
          <Badge variant="info">TRANSACCIONAL</Badge>
        </div>

        <div className="flex p-1.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl gap-2">
          {[
            { id: 'todo', label: 'Todos', icon: History },
            { id: 'recargas', label: 'Recargas', icon: ArrowUpCircle },
            { id: 'retiros', label: 'Retiros', icon: ArrowDownCircle }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                tab === t.id 
                  ? "bg-white/[0.07] border border-white/10 shadow-lg text-white" 
                  : "text-zinc-500 hover:text-white"
              )}
            >
              <t.icon size={18} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="px-5 space-y-4 pb-32">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, i) => {
            const isRecarga = item.tipo_visual === 'recarga';
            return (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="p-5 flex items-center gap-5 bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-m3-1 shrink-0 transition-colors",
                    isRecarga ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-sav-accent/10 border-sav-accent/20 text-sav-accent"
                  )}>
                    {isRecarga ? <ArrowUpCircle size={28} /> : <ArrowDownCircle size={28} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-bold text-white uppercase tracking-tight truncate mb-1">
                          {isRecarga ? 'Recarga de Saldo' : 'Retiro de Capital'}
                        </h4>
                        <p className="text-[9px] text-zinc-600 font-bold tracking-widest uppercase">
                          Ref: {item.id?.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          "text-xl font-bold tracking-tighter mb-1",
                          isRecarga ? "text-emerald-400" : "text-white"
                        )}>
                          {isRecarga ? '+' : '-'}{Number(item.monto).toLocaleString()}
                        </p>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Bs</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <Clock size={12} className="text-zinc-600" />
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
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 opacity-40">
            <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-800">
              <FileText size={40} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">No se encontraron movimientos</p>
          </div>
        )}
      </main>
    </Layout>
  );
}
