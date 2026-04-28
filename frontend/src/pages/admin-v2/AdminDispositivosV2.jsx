import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Search, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ShieldCheck,
  Lock,
  Clock
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate } from '../../utils/format';

export default function AdminDispositivosV2() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/device-requests');
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching device requests:', err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id, status) => {
    if (!confirm(`¿Seguro que quieres ${status} esta solicitud de acceso?`)) return;
    try {
      await api.post(`/admin/device-requests/${id}`, { status });
      setList(l => l.filter(r => r.id !== id));
      alert(`Solicitud ${status} con éxito`);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredList = list.filter(r => {
    return r.nombre_usuario?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           r.telefono?.includes(searchTerm) ||
           r.device_id?.includes(searchTerm);
  });

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-sav-primary to-rose-600 text-white shadow-xl shadow-sav-primary/20">
              <Lock size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Control de Dispositivos</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <ShieldCheck size={14} className="text-sav-primary" /> Gestión de seguridad multi-dispositivo
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group flex-1 min-w-[300px]">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sav-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por usuario, teléfono o ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-sav-border rounded-2xl py-4 pl-12 pr-6 text-xs font-bold text-slate-900 outline-none focus:border-sav-primary/30 transition-all shadow-2xl"
            />
          </div>
          <button 
            onClick={fetchRequests}
            className="p-4 rounded-2xl bg-sav-surface border border-sav-border text-slate-400 hover:text-sav-primary transition-all shadow-2xl"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Grid de Solicitudes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white border border-sav-border h-64 rounded-[30px] animate-pulse" />
            ))
          ) : filteredList.length > 0 ? (
            filteredList.map((r, index) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-sav-border p-6 rounded-[30px] flex flex-col justify-between group hover:border-sav-primary/20 transition-all duration-500 shadow-xl shadow-black/5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sav-surface flex items-center justify-center font-black text-sav-primary border border-sav-border">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter truncate w-24">{r.nombre_usuario}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{r.telefono}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-sav-surface rounded-2xl p-4 border border-sav-border space-y-3">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Modelo Detectado</p>
                      <p className="text-xs font-black text-slate-900 tracking-tight uppercase italic">{r.modelo_dispositivo || 'Desconocido'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Device ID</p>
                      <p className="text-[9px] font-bold text-sav-primary tracking-widest truncate">{r.device_id}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-sav-border">
                      <Clock size={12} className="text-slate-500" />
                      <p className="text-[9px] font-bold text-slate-500">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button 
                    onClick={() => handleProcess(r.id, 'aprobado')}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-sav-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-sav-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={14} /> Aprobar
                  </button>
                  <button 
                    onClick={() => handleProcess(r.id, 'rechazado')}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-sav-surface border border-sav-border text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
                  >
                    <XCircle size={14} /> Rechazar
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-700">
                <Smartphone size={40} />
              </div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">No hay solicitudes pendientes</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
