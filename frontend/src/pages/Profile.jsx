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
    { to: '/ganancias', icon: Wallet, label: 'Mi Billetera', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { to: '/vip', icon: TrendingUp, label: 'Membresía VIP', color: 'text-sav-accent', bg: 'bg-sav-accent/10' },
    { to: '/premios', icon: Gift, label: 'Premios y Regalos', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { to: '/seguridad', icon: Settings, label: 'Seguridad y Cuenta', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
    { to: '/ayuda', icon: HelpCircle, label: 'Centro de Ayuda', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  return (
    <Layout>
      <Header title="Perfil Premium" />
      
      <main className="px-4 sm:px-6 py-6 space-y-8 pb-32 animate-in">
        {/* User Identity Card - Ultra Modern */}
        <section>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-sav-accent to-sav-secondary rounded-m3-lg blur opacity-20 transition duration-1000 group-hover:opacity-40"></div>
            <Card className="relative p-7 bg-zinc-950/60 backdrop-blur-3xl border border-white/10 rounded-m3-lg overflow-hidden shadow-m3-3">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-sav-accent/20 rounded-full blur-[60px]" />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="relative">
                  <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center shadow-xl">
                    <User size={36} className="text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-sav-accent rounded-full border-2 border-zinc-950 flex items-center justify-center shadow-accent-glow">
                    <ShieldCheck size={14} className="text-white" strokeWidth={3} />
                  </div>
                </div>
                
                <div className="space-y-1.5 min-w-0">
                  <h2 className="text-2xl font-bold tracking-tight truncate text-white uppercase">{user?.nombre_usuario || 'Usuario'}</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="info" className="py-0.5 px-2">
                      {user?.nivel_nombre || 'Pasante'}
                    </Badge>
                    <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest">{user?.telefono}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Financial Summary - Rediseñado Fintech 2026 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <TrendingUp size={16} className="text-sav-accent" />
            <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Rendimiento Financiero</h3>
          </div>

          <Card className="p-7 bg-white/[0.02] border-white/10 shadow-m3-2 space-y-8">
            {/* Grid Hoy / Ayer */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.2em]">Ingresos Hoy</p>
                <p className="text-3xl font-bold text-emerald-400 tracking-tighter">
                  { (stats?.ingresos_hoy || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                  <span className="text-xs font-bold text-sav-muted ml-1.5 uppercase">Bs</span>
                </p>
              </div>
              <div className="space-y-1.5 text-right border-l border-white/5 pl-8">
                <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.2em]">Ayer</p>
                <p className="text-3xl font-bold text-zinc-500 tracking-tighter">
                  { (stats?.ingresos_ayer || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                  <span className="text-xs font-bold text-zinc-700 ml-1.5 uppercase">Bs</span>
                </p>
              </div>
            </div>

            {/* Total Balance Banner - Glassmorphism */}
            <div className="relative p-6 rounded-m3 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-sav-accent to-sav-secondary opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl" />
              
              <div className="relative z-10 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">Saldo Institucional</p>
                  <p className="text-3xl font-bold text-white tracking-tight">
                    { (stats?.saldo_total_actual || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                    <span className="text-xs font-bold ml-1.5 opacity-60">Bs</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">Cargas</p>
                  <p className="text-3xl font-bold text-white drop-shadow-md">+{stats?.total_completadas || 0}</p>
                </div>
              </div>
            </div>

            {/* Grid Semana / Mes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mb-1.5">Semana Actual</p>
                <p className="text-lg font-bold text-white tracking-tight">
                  { (stats?.ingresos_semana || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) } Bs
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mb-1.5">Mes Actual</p>
                <p className="text-lg font-bold text-white tracking-tight">
                  { (stats?.ingresos_mes || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) } Bs
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Menu Items - Premium Glass List */}
        <section className="bg-white/[0.02] rounded-m3-lg border border-white/10 overflow-hidden shadow-m3-2">
          <div className="divide-y divide-white/5">
            {menuItems.map((item, idx) => (
              <Link 
                key={idx} 
                to={item.to}
                className="flex items-center justify-between p-5 hover:bg-white/[0.05] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110", item.bg)}>
                    <item.icon size={20} className={item.color} />
                  </div>
                  <span className="text-[12px] font-bold text-white uppercase tracking-wider group-hover:translate-x-1 transition-transform">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full h-14 rounded-m3 bg-red-500/5 border border-red-500/10 text-red-500 flex items-center justify-center gap-3 hover:bg-red-500/10 transition-all shadow-m3-1 active:scale-[0.98] group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[12px] font-bold uppercase tracking-[0.2em]">Cerrar Sesión</span>
        </button>
      </main>
    </Layout>
  );
}
