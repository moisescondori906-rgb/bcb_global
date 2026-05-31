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
  Loader2,
  Award,
  Sparkles,
  User
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
    { from: '#6366F1', to: '#4F46E5' }, // Indigo
    { from: '#10B981', to: '#059669' }, // Emerald
    { from: '#F59E0B', to: '#D97706' }, // Amber
    { from: '#EF4444', to: '#DC2626' }, // Red
    { from: '#8B5CF6', to: '#7C3AED' }, // Violet
  ];

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-10 p-4">
      <div className="relative w-44 h-44 group">
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
            <p className="text-[10px] font-extrabold text-sav-muted uppercase tracking-[0.2em] mb-0.5">Total</p>
            <p className="text-xl font-black text-sav-text-main tracking-tighter">
              {formatCurrency(total, 'Bs').replace('Bs', '').trim()}
            </p>
            <p className="text-[9px] font-black text-sav-primary uppercase tracking-widest">Bs</p>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full space-y-5">
        {chartData.filter(item => Number(item.value) > 0).map((item, idx) => {
          const val = Number(item.value) || 0;
          const percent = (val / total) * 100;
          return (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: colors[idx % colors.length].from }} />
                  <span className="text-[10px] font-extrabold text-sav-text-dim uppercase tracking-widest">{item.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[12px] font-black text-sav-primary tracking-tight">{percent.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-2 w-full bg-sav-surface rounded-full overflow-hidden p-0.5 border border-black/[0.03]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  className="h-full rounded-full shadow-sm"
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
    const interval = setInterval(() => fetchTeam(true), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchReferrals();
    const interval = setInterval(() => fetchReferrals(true), 15000);
    return () => clearInterval(interval);
  }, [selectedNivel]);

  const handleCopy = () => {
    if (!user?.codigo_invitacion) return;
    const invitationLink = `${CONFIG.WEB_URL}/register?ref=${user.codigo_invitacion}`;
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
        <div className="p-10 flex flex-col items-center justify-center min-h-[70vh] space-y-6">
          <div className="w-16 h-16 border-4 border-sav-surface border-t-sav-primary rounded-full animate-spin" />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-sav-muted animate-pulse">Sincronizando Red</p>
        </div>
      </Layout>
    );
  }

  const resumen = data?.resumen || {};
  const isInternar = user?.nivel_codigo === 'internar';

  return (
    <Layout>
      <div className="bg-sav-bg min-h-screen pb-32">
        <Header title="Gestión de Equipo" />
        
        <main className="px-6 py-8 space-y-10 max-w-lg mx-auto animate-in">
          {/* Invitation Banner Card */}
          <Card variant="premium" className="p-8 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-lg bg-sav-primary/10 flex items-center justify-center text-sav-primary">
                      <UserPlus size={12} strokeWidth={3} />
                   </div>
                   <p className="text-[11px] font-extrabold text-sav-muted uppercase tracking-[0.2em]">Invitación Directa</p>
                </div>
                <h2 className="text-4xl font-black text-sav-text-main tracking-tighter uppercase">{user?.codigo_invitacion || '------'}</h2>
              </div>
              <button 
                onClick={handleCopy}
                className={cn(
                  "p-4 rounded-2xl transition-all duration-500 shadow-sm active:scale-90",
                  copied ? "bg-emerald-500 text-white" : "bg-sav-primary text-white shadow-accent-glow"
                )}
              >
                {copied ? <Check size={24} strokeWidth={2.5} /> : <Copy size={24} strokeWidth={2.5} />}
              </button>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-sav-surface border border-black/[0.02]">
              <Sparkles size={16} className="text-sav-primary" />
              <p className="text-[10px] font-bold text-sav-text-dim uppercase tracking-widest leading-none">Copia tu enlace y expande tus ganancias diarias</p>
            </div>
          </Card>

          {/* Comisiones Chart Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
              <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Rendimiento de Comisiones</h3>
            </div>

            <Card className="p-8 bg-white border-black/[0.03] shadow-m3-2">
              <PieChart data={[
                { name: 'Nivel A', value: resumen.comisiones_a || 0 },
                { name: 'Nivel B', value: resumen.comisiones_b || 0 },
                { name: 'Nivel C', value: resumen.comisiones_c || 0 }
              ]} />
            </Card>
          </section>

          {/* Level Switcher Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Nivel A', count: resumen.total_a || 0, icon: Gem, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Nivel B', count: resumen.total_b || 0, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
              { label: 'Nivel C', count: resumen.total_c || 0, icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50' }
            ].map((item, idx) => {
              const levelKey = item.label.split(' ')[1];
              const isActive = selectedNivel === levelKey;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedNivel(levelKey)}
                  className={cn(
                    "p-5 rounded-[2rem] border-2 transition-all duration-500 flex flex-col items-center gap-3 text-center group shadow-sm",
                    isActive
                      ? "bg-white border-sav-primary shadow-m3-2 -translate-y-1"
                      : "bg-white border-black/[0.03] hover:border-black/[0.1]"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6",
                    isActive ? "bg-sav-primary text-white shadow-accent-glow" : cn(item.bg, item.color)
                  )}>
                    <item.icon size={24} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-0.5">
                    <p className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? "text-sav-primary" : "text-sav-muted")}>{item.label}</p>
                    <p className="text-xl font-black text-sav-text-main tracking-tight">{item.count}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Members List */}
          <section className="space-y-6 pb-12">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
                <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Miembros Activos</h3>
              </div>
              <Badge variant="info">NIVEL {selectedNivel}</Badge>
            </div>

            <div className="space-y-4">
              {referralsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-sav-primary" size={32} />
                  <p className="text-[10px] font-extrabold text-sav-muted uppercase tracking-[0.3em]">Sincronizando Lista...</p>
                </div>
              ) : referrals.length > 0 ? (
                referrals.map((ref, i) => (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="p-5 flex items-center justify-between group hover:border-sav-primary/30 transition-all shadow-m3-1">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-sav-surface flex items-center justify-center text-sav-muted group-hover:bg-sav-primary/10 group-hover:text-sav-primary transition-all border border-black/[0.02]">
                          <User size={24} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-[14px] font-extrabold text-sav-text-main uppercase tracking-tight truncate">{ref.nombre_usuario}</h4>
                            <Badge variant="info" className="text-[8px] py-0 px-2">{displayLevelCode(ref.nivel_codigo)}</Badge>
                          </div>
                          <p className="text-[11px] font-bold text-sav-muted tracking-widest">{ref.telefono}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {selectedNivel === 'A' && ref.nivel_codigo === 'internar' && (
                          <button 
                            onClick={() => handleDeleteReferral(ref.id)}
                            disabled={deletingId === ref.id}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                          >
                            {deletingId === ref.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} strokeWidth={2.5} />}
                          </button>
                        )}
                        <ChevronRight size={18} className="text-sav-muted group-hover:text-sav-primary transition-colors" strokeWidth={2.5} />
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="py-24 text-center space-y-6">
                   <div className="w-20 h-20 rounded-full border-2 border-dashed border-black/[0.05] flex items-center justify-center mx-auto text-sav-muted/30">
                      <Users size={32} />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[12px] font-extrabold text-sav-text-main uppercase tracking-widest">Sin miembros registrados</p>
                      <p className="text-[10px] font-bold text-sav-muted uppercase tracking-tight leading-relaxed max-w-[180px] mx-auto">Invita a nuevos socios para comenzar a construir tu equipo.</p>
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
