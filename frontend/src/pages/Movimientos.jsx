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
    if (['aprobada', 'aprobado', 'completado', 'pagado'].includes(e)) return <Badge variant="success" icon={CheckCircle2}>COMPLETADO</Badge>;
    if (['rechazada', 'rechazado', 'error'].includes(e)) return <Badge variant="error" icon={XCircle}>RECHAZADO</Badge>;
    return <Badge variant="warning" icon={Loader2} className="animate-pulse">PENDIENTE</Badge>;
  };

  if (loading && combinedItems.length === 0) {
    return (
      <Layout>
        <div className="p-10 flex flex-col items-center justify-center min-h-[70vh] space-y-6">
          <div className="w-16 h-16 border-4 border-sav-primary/10 border-t-sav-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sav-muted animate-pulse">Cargando Historial</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-sav-primary uppercase tracking-tighter leading-none">Movimientos</h1>
          <div className="px-2 py-1 rounded-m3-sm bg-sav-surface border border-sav-border text-sav-primary text-[9px] font-black uppercase tracking-widest">
            HISTORIAL
          </div>
        </div>

        <div className="flex bg-white p-1.5 rounded-m3 border border-sav-border shadow-m3-1">
          {[
            { id: 'todo', label: 'Todos', icon: History },
            { id: 'recargas', label: 'Recargas', icon: ArrowUpCircle },
            { id: 'retiros', label: 'Retiros', icon: ArrowDownCircle }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-m3 text-[9px] font-black uppercase tracking-widest transition-all",
                tab === t.id 
                  ? "bg-sav-primary text-white shadow-m3-2 scale-[1.02]" 
                  : "text-sav-muted hover:bg-sav-surface"
              )}
            >
              <t.icon size={16} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="px-5 space-y-4 pb-12">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, i) => {
            const isRecarga = item.tipo_visual === 'recarga';
            return (
              <Card 
                key={item.id} 
                className="p-5 flex items-center gap-5 bg-white border-sav-border shadow-m3-1 group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-m3 flex items-center justify-center border shadow-m3-1 shrink-0",
                  isRecarga ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-sav-surface border-sav-border text-sav-primary"
                )}>
                  {isRecarga ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0">
                      <h4 className="text-[12px] font-black text-sav-primary uppercase tracking-tight truncate leading-none mb-1">
                        {isRecarga ? 'Recarga de Saldo' : 'Retiro de Capital'}
                      </h4>
                      <p className="text-[9px] text-sav-muted font-bold tracking-widest uppercase">
                        Ref: {item.id?.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-lg font-black tracking-tight leading-none mb-1",
                        isRecarga ? "text-emerald-600" : "text-sav-primary"
                      )}>
                        {isRecarga ? '+' : '-'}{Number(item.monto).toLocaleString()}
                      </p>
                      <span className="text-[9px] font-black text-sav-muted uppercase tracking-widest">Bs</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-sav-border/30">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-sav-muted uppercase tracking-widest">
                      <Clock size={12} />
                      {formatDate(item.created_at)}
                    </div>
                    {getStatusBadge(item.estado)}
                  </div>
                </div>
              </Card>
            );
          })}
        </AnimatePresence>

        {filteredItems.length === 0 && !loading && (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="w-16 h-16 rounded-full bg-sav-surface flex items-center justify-center text-sav-muted">
              <FileText size={32} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sav-muted">No se encontraron movimientos</p>
          </div>
        )}
      </main>
    </Layout>
  );
}
