import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Header from '../components/Header.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CONFIG } from '../config.js';
import { 
  Users, UserPlus, TrendingUp, Info, 
  ShieldAlert, ChevronRight, Copy, Check,
  Target, Zap, Gem, Trash2, Star, PieChart as PieChartIcon,
  Loader2
} from 'lucide-react';

// UI Components
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { cn } from '../lib/utils/cn';
import { formatCurrency } from '../lib/utils/format';

import { motion, AnimatePresence } from 'framer-motion';

const PieChart = ({ data }) => {
  const chartData = Array.isArray(data) ? data : [];
  if (chartData.length === 0) return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
      <div className="w-16 h-16 rounded-full border-4 border-dashed border-sav-muted/20" />
      <p className="text-[8px] font-black text-sav-muted uppercase tracking-widest">Sin datos de ingresos</p>
    </div>
  );

  const total = chartData.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
  if (total === 0) return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
      <div className="w-16 h-16 rounded-full border-4 border-dashed border-sav-muted/20" />
      <p className="text-[8px] font-black text-sav-muted uppercase tracking-widest">Sin ingresos registrados</p>
    </div>
  );

  let cumulativePercent = 0;
  const colors = [
    { from: '#3b82f6', to: '#2563eb' }, // Azul
    { from: '#10b981', to: '#059669' }, // Verde
    { from: '#f59e0b', to: '#d97706' }, // Ámbar
    { from: '#ef4444', to: '#dc2626' }, // Rojo
    { from: '#8b5cf6', to: '#7c3aed' }, // Violeta
  ];

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 p-2">
      <div className="relative w-40 h-40 group">
        <svg viewBox="-1.1 -1.1 2.2 2.2" className="transform -rotate-90 w-full h-full drop-shadow-sm">
          <defs>
            {chartData.map((_, idx) => (
              <linearGradient key={`grad-${idx}`} id={`grad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors[idx % colors.length].from} />
                <stop offset="100%" stopColor={colors[idx % colors.length].to} />
              </linearGradient>
            ))}
          </defs>
          {chartData.map((item, idx) => {
            const val = Number(item.value) || 0;
            if (val <= 0) return null;
            const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
            const percent = val / total;
            cumulativePercent += percent;
            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
            return (
              <motion.path 
                key={idx} 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                d={pathData} 
                fill={`url(#grad-${idx})`}
                className="hover:brightness-110 transition-all cursor-pointer" 
              />
            );
          })}
          <circle cx="0" cy="0" r="0.75" fill="#ffffff" />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-[8px] font-black text-sav-muted uppercase tracking-[0.2em] mb-0.5">Total</p>
            <p className="text-lg font-black text-sav-primary tracking-tighter">
              {formatCurrency(total, 'Bs').trim()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full space-y-4">
        {chartData.filter(item => Number(item.value) > 0).map((item, idx) => {
          const val = Number(item.value) || 0;
          const percent = (val / total) * 100;
          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors[idx % colors.length].from }} />
                  <span className="text-[9px] font-black text-sav-muted uppercase tracking-widest">{item.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[11px] font-black text-sav-primary">{percent.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-sav-surface rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  className="h-full rounded-full"
                  style={{ background: colors[idx % colors.length].from }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Team() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const [referrals, setReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  const [selectedNivel, setSelectedNivel] = useState('A');
  const [deletingId, setDeletingId] = useState(null);

  const fetchTeam = async (isSilent = false) => {
    if (!isSilent && !data) setLoading(true);
    try {
      const [teamRes, statsRes] = await Promise.all([
        api.users.teamReport(),
        api.get('/users/stats')
      ]);
      setData(teamRes);
      setStats(statsRes);
    } catch (err) {
      console.error('Error fetching team/stats:', err);
      if (!data) setData({ resumen: {}, niveles: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async (isSilent = false) => {
    if (!isSilent && referrals.length === 0) setReferralsLoading(true);
    try {
      const res = await api.get(`/users/my-referrals?nivel=${selectedNivel}`);
      setReferrals(res.items || []);
    } catch (err) {
      console.error('Error fetching referrals:', err);
    } finally {
      setReferralsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    const interval = setInterval(() => fetchTeam(true), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchReferrals();
    const interval = setInterval(() => fetchReferrals(true), 5000);
    return () => clearInterval(interval);
  }, [selectedNivel]);

  const handleCopy = () => {
    if (!user?.codigo_invitacion) return;
    const invitationLink = `${CONFIG.WEB_URL}/invitar?code=${user.codigo_invitacion}`;
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteReferral = async (referralId) => {
    if (!window.confirm('¿Estás seguro de eliminar a este usuario Pasante? Esta acción no se puede deshacer.')) return;
    
    setDeletingId(referralId);
    try {
      await api.delete(`/users/my-referrals/${referralId}`);
      fetchReferrals();
      fetchTeam(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar referido');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && !data) {
    return (
      <Layout>
        <div className="p-10 flex flex-col items-center justify-center min-h-[70vh] space-y-6 bg-sav-dark">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-sav-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Sincronizando Equipo</p>
        </div>
      </Layout>
    );
  }

  const resumen = data?.resumen || {};
  const niveles = Array.isArray(data?.niveles) ? data.niveles : [];
  const isInternar = user?.nivel_codigo === 'internar';

  return (
    <Layout>
      <Header title="Equipo" />
      
      <main className="px-4 sm:px-6 py-6 space-y-6 pb-32 animate-in">
        {/* Referral Card - Modern Flutter Style */}
        <Card className="p-6 bg-sav-primary border-none shadow-m3-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Código de Invitación</p>
                <p className="text-3xl font-black text-white tracking-tighter uppercase">{user?.codigo_invitacion || '------'}</p>
              </div>
              <button 
                onClick={handleCopy}
                className="p-3 rounded-m3 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all shadow-lg active:scale-95"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 rounded-m3-sm bg-white/5 border border-white/10">
              <UserPlus size={14} className="text-white/60" />
              <p className="text-[9px] font-black text-white/80 uppercase tracking-widest truncate">Comparte tu enlace para ganar comisiones</p>
            </div>
          </div>
        </Card>

        {/* Team Statistics - Rediseñado */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <PieChartIcon size={14} className="text-sav-primary" />
            <h3 className="text-[11px] font-black text-sav-primary uppercase tracking-[0.2em]">Resumen de Comisiones</h3>
          </div>

          <Card className="p-6 bg-white border-sav-border shadow-m3-2">
            <PieChart data={[
              { name: 'Nivel A', value: resumen.comisiones_a || 0 },
              { name: 'Nivel B', value: resumen.comisiones_b || 0 },
              { name: 'Nivel C', value: resumen.comisiones_c || 0 }
            ]} />
          </Card>
        </section>

        {/* Levels Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Nivel A', count: resumen.total_a || 0, icon: Gem, color: 'text-sav-primary', bg: 'bg-sav-surface' },
            { label: 'Nivel B', count: resumen.total_b || 0, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Nivel C', count: resumen.total_c || 0, icon: Star, color: 'text-rose-500', bg: 'bg-rose-50' }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedNivel(item.label.split(' ')[1])}
              className={cn(
                "p-4 rounded-m3-lg border transition-all flex flex-col items-center gap-2 text-center",
                selectedNivel === item.label.split(' ')[1]
                  ? "bg-sav-primary border-sav-primary shadow-m3-2 text-white"
                  : "bg-white border-sav-border shadow-m3-1 text-sav-primary"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-m3 flex items-center justify-center mb-1",
                selectedNivel === item.label.split(' ')[1] ? "bg-white/10" : item.bg
              )}>
                <item.icon size={20} className={selectedNivel === item.label.split(' ')[1] ? "text-white" : item.color} />
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">{item.label}</p>
              <p className="text-lg font-black tracking-tight">{item.count}</p>
            </button>
          ))}
        </div>

        {/* Referrals List - Clean Material Table */}
        <section className="space-y-4 pb-12">
          <div className="flex items-center justify-between px-1">
             <h3 className="text-[11px] font-black text-sav-primary uppercase tracking-[0.2em]">Integrantes Nivel {selectedNivel}</h3>
             <Badge variant="info" className="bg-sav-surface text-sav-primary border-sav-border">Sincronizado</Badge>
          </div>

          <div className="space-y-3">
            {referralsLoading ? (
              <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-sav-primary/30" /></div>
            ) : referrals.length > 0 ? (
              referrals.map((ref) => (
                <Card key={ref.id} className="p-4 flex items-center justify-between bg-white border-sav-border shadow-m3-1">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-m3 bg-sav-surface border border-sav-border flex items-center justify-center text-sav-primary font-black text-xs">
                      {ref.nombre_usuario?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-sav-primary uppercase truncate">{ref.nombre_usuario}</p>
                      <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest">{ref.telefono}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-sav-primary">{ref.nivel_nombre || 'Pasante'}</p>
                    <p className="text-[8px] font-bold text-sav-muted uppercase tracking-widest">{new Date(ref.created_at).toLocaleDateString()}</p>
                  </div>
                </Card>
              ))
            ) : (
              <div className="py-20 text-center opacity-40 flex flex-col items-center gap-3">
                <Users size={40} className="text-sav-muted" />
                <p className="text-[10px] font-black uppercase tracking-widest text-sav-muted">No hay integrantes registrados</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
}
