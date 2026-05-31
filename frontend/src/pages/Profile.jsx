import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Header from '../components/Header.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  User, ShieldCheck, ChevronRight, LogOut, 
  Wallet, TrendingUp, HelpCircle, Info, 
  Settings, Bell, Share2, Zap, Star, Gift,
  Calendar, Clock, DollarSign
} from 'lucide-react';

// UI Components
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { cn } from '../lib/utils/cn';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const data = await api.get('/users/stats');
        if (isMounted) setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { to: '/ganancias', icon: Wallet, label: 'Mi Billetera', color: 'text-sav-success', bg: 'bg-emerald-50' },
    { to: '/vip', icon: TrendingUp, label: 'Membresía VIP', color: 'text-sav-primary', bg: 'bg-sav-primary/5' },
    { to: '/premios', icon: Gift, label: 'Premios y Regalos', color: 'text-amber-500', bg: 'bg-amber-50' },
    { to: '/seguridad', icon: Settings, label: 'Seguridad y Cuenta', color: 'text-slate-500', bg: 'bg-slate-50' },
    { to: '/ayuda', icon: HelpCircle, label: 'Centro de Ayuda', color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <Layout>
      <Header title="Mi Perfil" />
      
      <main className="px-4 sm:px-6 py-6 space-y-6 pb-32 animate-in">
        {/* User Identity Card - Flutter Style */}
        <section>
          <Card className="p-6 bg-white border-sav-border shadow-m3-2 rounded-m3-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sav-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="relative">
                <div className="w-16 h-16 rounded-m3 bg-sav-surface flex items-center justify-center border border-sav-border shadow-m3-1">
                  <User size={32} className="text-sav-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-sav-success rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                  <ShieldCheck size={12} className="text-white" strokeWidth={3} />
                </div>
              </div>
              
              <div className="space-y-1 min-w-0">
                <h2 className="text-xl font-black tracking-tight truncate uppercase text-sav-primary">{user?.nombre_usuario || 'Usuario'}</h2>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-m3-sm bg-sav-primary text-white text-[9px] font-black uppercase tracking-widest">
                    {user?.nivel_nombre || 'Pasante'}
                  </div>
                  <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest">{user?.telefono}</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Financial Summary - Rediseñado Fintech Flutter */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <TrendingUp size={14} className="text-sav-primary" />
            <h3 className="text-[11px] font-black text-sav-primary uppercase tracking-[0.2em]">Resumen de Ganancias</h3>
          </div>

          <Card className="p-6 bg-white border-sav-border shadow-m3-2 space-y-8">
            {/* Grid Hoy / Ayer */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-sav-muted uppercase tracking-widest">Hoy</p>
                <p className="text-2xl font-black text-sav-primary tracking-tighter">
                  { (stats?.ingresos_hoy || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                  <span className="text-[10px] font-bold text-sav-muted ml-1">Bs</span>
                </p>
              </div>
              <div className="space-y-1 text-right border-l border-sav-border/50 pl-8">
                <p className="text-[9px] font-black text-sav-muted uppercase tracking-widest">Ayer</p>
                <p className="text-2xl font-black text-sav-muted tracking-tighter">
                  { (stats?.ingresos_ayer || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                  <span className="text-[10px] font-bold text-sav-muted ml-1">Bs</span>
                </p>
              </div>
            </div>

            {/* Total Balance Banner */}
            <div className="bg-sav-primary p-5 rounded-m3 shadow-m3-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-xl" />
              <div className="relative z-10 flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Saldo Institucional</p>
                  <p className="text-2xl font-black text-white tracking-tight">
                    { (stats?.saldo_total_actual || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                    <span className="text-xs font-bold ml-1 opacity-50">Bs</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Tareas</p>
                  <p className="text-2xl font-black text-emerald-400">+{stats?.total_completadas || 0}</p>
                </div>
              </div>
            </div>

            {/* Grid Semana / Mes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-m3 bg-sav-surface border border-sav-border/50">
                <p className="text-[8px] font-black text-sav-muted uppercase tracking-widest mb-1">Esta Semana</p>
                <p className="text-sm font-black text-sav-primary">
                  { (stats?.ingresos_semana || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) } Bs
                </p>
              </div>
              <div className="p-4 rounded-m3 bg-sav-surface border border-sav-border/50">
                <p className="text-[8px] font-black text-sav-muted uppercase tracking-widest mb-1">Este Mes</p>
                <p className="text-sm font-black text-sav-primary">
                  { (stats?.ingresos_mes || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) } Bs
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Menu Items - Clean Material List */}
        <section className="bg-white rounded-m3-lg border border-sav-border shadow-m3-1 overflow-hidden">
          <div className="divide-y divide-sav-border/30">
            {menuItems.map((item, idx) => (
              <Link 
                key={idx} 
                to={item.to}
                className="flex items-center justify-between p-5 hover:bg-sav-surface transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-m3 flex items-center justify-center transition-transform group-hover:scale-110", item.bg)}>
                    <item.icon size={20} className={item.color} />
                  </div>
                  <span className="text-[11px] font-black text-sav-primary uppercase tracking-widest">{item.label}</span>
                </div>
                <ChevronRight size={16} className="text-sav-border group-hover:text-sav-primary transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full h-14 rounded-m3 bg-white border border-sav-error/20 text-sav-error flex items-center justify-center gap-3 hover:bg-sav-error/5 transition-all shadow-m3-1 active:scale-[0.98]"
        >
          <LogOut size={18} />
          <span className="text-[11px] font-black uppercase tracking-[0.15em]">Cerrar Sesión</span>
        </button>
      </main>
    </Layout>
  );
}
