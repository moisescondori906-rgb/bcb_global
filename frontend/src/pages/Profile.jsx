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
  Calendar, Clock, DollarSign, Target, CreditCard
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
    { to: '/movimientos', icon: Wallet, label: 'Mi Billetera', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { to: '/vip', icon: TrendingUp, label: 'Membresía VIP', color: 'text-sav-primary', bg: 'bg-sav-primary/10' },
    { to: '/premios', icon: Gift, label: 'Premios y Regalos', color: 'text-amber-600', bg: 'bg-amber-50' },
    { to: '/seguridad', icon: Settings, label: 'Seguridad y Cuenta', color: 'text-slate-600', bg: 'bg-slate-50' },
    { to: '/ayuda', icon: HelpCircle, label: 'Centro de Ayuda', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <Layout>
      <div className="bg-sav-bg min-h-screen pb-32">
        <Header title="Perfil Premium" />
        
        <main className="px-6 py-8 space-y-10 max-w-lg mx-auto animate-in">
          {/* User Identity Card */}
          <section>
            <Card variant="premium" className="p-8 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-[2.5rem] bg-sav-surface border-4 border-white flex items-center justify-center shadow-m3-2 overflow-hidden">
                  <User size={48} className="text-sav-muted" strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-sav-primary rounded-2xl border-4 border-white flex items-center justify-center shadow-accent-glow">
                  <ShieldCheck size={16} className="text-white" strokeWidth={3} />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <h2 className="text-3xl font-black text-sav-text-main tracking-tight uppercase leading-none">{user?.nombre_usuario || 'Usuario'}</h2>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="info" className="py-1 px-3">
                    {user?.nivel_nombre || 'Pasante'}
                  </Badge>
                  <span className="text-[10px] font-extrabold text-sav-muted uppercase tracking-widest">{user?.telefono}</span>
                </div>
              </div>
            </Card>
          </section>

          {/* Financial Performance */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
              <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Rendimiento Financiero</h3>
            </div>

            <Card className="p-8 space-y-8 bg-white border-black/[0.02] shadow-m3-2">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold text-sav-muted uppercase tracking-[0.2em]">Ingresos Hoy</p>
                  <p className="text-3xl font-black text-emerald-600 tracking-tighter">
                    { (stats?.ingresos_hoy || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                    <span className="text-xs font-bold text-sav-muted ml-1.5 uppercase tracking-normal">Bs</span>
                  </p>
                </div>
                <div className="space-y-2 text-right border-l border-black/[0.03] pl-8">
                  <p className="text-[10px] font-extrabold text-sav-muted uppercase tracking-[0.2em]">Ayer</p>
                  <p className="text-3xl font-black text-sav-text-dim tracking-tighter">
                    { (stats?.ingresos_ayer || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                    <span className="text-xs font-bold text-sav-muted ml-1.5 uppercase tracking-normal">Bs</span>
                  </p>
                </div>
              </div>

              {/* Total Balance Banner */}
              <div className="relative p-6 rounded-[2.5rem] bg-sav-primary text-white overflow-hidden group shadow-accent-glow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Saldo Total Acumulado</p>
                    <p className="text-3xl font-black tracking-tight">
                      { (stats?.saldo_total_actual || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                      <span className="text-xs font-bold ml-1.5 opacity-60 tracking-normal">Bs</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                     <Target size={24} strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-sav-surface border border-black/[0.02] hover:bg-white hover:shadow-m3-1 transition-all duration-300">
                  <p className="text-[9px] font-extrabold text-sav-muted uppercase tracking-widest mb-1.5">Esta Semana</p>
                  <p className="text-lg font-black text-sav-text-main tracking-tight">
                    { (stats?.ingresos_semana || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) } Bs
                  </p>
                </div>
                <div className="p-5 rounded-3xl bg-sav-surface border border-black/[0.02] hover:bg-white hover:shadow-m3-1 transition-all duration-300">
                  <p className="text-[9px] font-extrabold text-sav-muted uppercase tracking-widest mb-1.5">Este Mes</p>
                  <p className="text-lg font-black text-sav-text-main tracking-tight">
                    { (stats?.ingresos_mes || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) } Bs
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Menu Items */}
          <section className="bg-white rounded-[2.5rem] border border-black/[0.03] overflow-hidden shadow-m3-2">
            <div className="divide-y divide-black/[0.03]">
              {menuItems.map((item, idx) => (
                <Link 
                  key={idx} 
                  to={item.to}
                  className="flex items-center justify-between p-6 hover:bg-sav-surface transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 shadow-sm", item.bg)}>
                      <item.icon size={22} className={item.color} strokeWidth={2.5} />
                    </div>
                    <span className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-widest group-hover:translate-x-1 transition-transform">{item.label}</span>
                  </div>
                  <ChevronRight size={20} className="text-sav-muted group-hover:text-sav-primary transition-colors" strokeWidth={2.5} />
                </Link>
              ))}
            </div>
          </section>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full h-16 rounded-[2rem] bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center gap-3 hover:bg-rose-100 transition-all shadow-sm active:scale-[0.98] group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
            <span className="text-[13px] font-black uppercase tracking-[0.2em]">Finalizar Conexión</span>
          </button>
        </main>
      </div>
    </Layout>
  );
}
