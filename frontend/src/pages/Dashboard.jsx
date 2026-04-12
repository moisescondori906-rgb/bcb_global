import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, TrendingUp, Target, ShieldCheck, 
  ArrowUpCircle, ArrowDownCircle, Bell,
  ChevronRight, PlayCircle, Sparkles, Zap, Trophy, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';
import { APP_DISPLAY_NAME } from '../theme/branding.js';
import { displayLevelCode } from '../lib/displayLevel.js';
import { cn } from '../lib/utils/cn';
import Layout from '../components/Layout.jsx';

// UI Components
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import BannerCarousel from '../components/dashboard/BannerCarousel.jsx';
import ActionGrid from '../components/dashboard/ActionGrid.jsx';
import GuideSection from '../components/dashboard/GuideSection.jsx';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [banners, setBanners] = useState([]);
  const [stats, setStats] = useState(null);
  const [guideText, setGuideText] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);

  const quickActions = useMemo(() => [
    { to: '/recompensas', icon: Trophy, label: 'Premios', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { to: '/tareas', icon: Zap, label: 'Tareas', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { to: '/equipo', icon: Users, label: 'Equipo', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ], []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersData, statsData, configData] = await Promise.all([
          api.banners().catch(() => []),
          api.users.stats().catch(() => null),
          api.publicContent().catch(() => null)
        ]);
        
        setBanners(Array.isArray(bannersData) ? bannersData : []);
        setStats(statsData);
        if (configData) {
          setGuideText(configData.home_guide);
          setPopupData(configData);
          if (configData.popup_enabled && !sessionStorage.getItem('seen_popup')) {
            setShowPopup(true);
            sessionStorage.setItem('seen_popup', 'true');
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    fetchData();

    // Real-time subscriptions
    const userSub = supabase.channel(`user_${user?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios', filter: `id=eq.${user?.id}` }, () => {
        refreshUser();
        api.users.stats().then(setStats).catch(() => {});
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userSub);
    };
  }, [user?.id]);

  return (
    <Layout>
      <div className="animate-fade pb-24">
        {/* Header - More Premium */}
        <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-40 nav-blur border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-sav-primary to-sav-accent opacity-30 blur-sm group-hover:opacity-50 transition-opacity" />
              <div className="relative w-11 h-11 rounded-2xl bg-sav-dark border border-white/10 flex items-center justify-center p-2.5 overflow-hidden shadow-2xl">
                <img src="/imag/logo-carrusel.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white leading-none uppercase">
                BCB <span className="text-sav-primary">Global</span>
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">SISTEMA ACTIVO</span>
              </div>
            </div>
          </div>
          <button className="relative p-2.5 rounded-2xl bg-white/5 border border-white/10 text-sav-muted hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-lg">
            <Bell size={20} />
            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-sav-primary rounded-full ring-4 ring-sav-dark" />
          </button>
        </header>

        <main className="px-5 space-y-8 pt-6">
          {/* Balance Card - Refined Design */}
          <Card variant="premium" className="relative overflow-hidden group border-none shadow-[0_30px_60px_-15px_rgba(220,38,38,0.3)]">
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-700 pointer-events-none">
              <Wallet size={120} />
            </div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sav-primary/20 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-sav-muted uppercase tracking-[0.3em] opacity-80">Saldo Disponible</span>
                  <div className="h-0.5 w-8 bg-sav-primary/50 rounded-full" />
                </div>
                <Badge variant="info" className="bg-white/10 backdrop-blur-md border border-white/20 py-1 px-3">
                  <Sparkles size={10} className="mr-1.5 text-amber-400" />
                  {displayLevelCode(user?.nivel_codigo)}
                </Badge>
              </div>
              
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                  {user?.saldo?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-black text-sav-muted/60 uppercase tracking-widest">BOB</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-10">
                <Link to="/recargar" className="w-full">
                  <Button className="w-full h-14 text-[11px] font-black tracking-[0.2em] shadow-xl shadow-sav-primary/20 active:scale-[0.98] transition-all" icon={ArrowUpCircle}>RECARGAR</Button>
                </Link>
                <Link to="/retiro" className="w-full">
                  <Button variant="secondary" className="w-full h-14 text-[11px] font-black tracking-[0.2em] bg-white/5 hover:bg-white/10 border-white/10 active:scale-[0.98] transition-all" icon={ArrowDownCircle}>RETIRAR</Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Carousel - Improved Visibility */}
          <section className="relative">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                <Sparkles size={14} className="text-sav-primary" /> Promociones
              </h2>
            </div>
            <BannerCarousel banners={banners} />
          </section>

          {/* Quick Actions Grid - Using ActionGrid Component */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                <Zap size={14} className="text-sav-accent" /> Acceso Rápido
              </h2>
            </div>
            <ActionGrid items={quickActions} />
          </section>

          {/* Guide Marquee */}
          <GuideSection text={guideText} />

          {/* Stats Grid - Premium Cards */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                <TrendingUp size={14} className="text-sav-primary" /> Rendimiento
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card variant="flat" className="p-6 space-y-3 bg-gradient-to-br from-white/[0.03] to-transparent border-white/5 group hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-sav-muted uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Hoy</span>
                  <div className="p-2 rounded-xl bg-sav-accent/10 text-sav-accent">
                    <Target size={16} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-white tracking-tighter">
                    {stats?.earnings_today?.toLocaleString() || '0.00'}
                  </p>
                  <p className="text-[9px] font-bold text-emerald-400 mt-1 uppercase tracking-widest">+ Ingresos</p>
                </div>
              </Card>
              <Card variant="flat" className="p-6 space-y-3 bg-gradient-to-br from-white/[0.03] to-transparent border-white/5 group hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-sav-muted uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Total</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Sparkles size={16} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-white tracking-tighter">
                    {stats?.earnings_total?.toLocaleString() || '0.00'}
                  </p>
                  <p className="text-[9px] font-bold text-sav-primary mt-1 uppercase tracking-widest">Acumulado</p>
                </div>
              </Card>
            </div>
          </section>

          {/* Tutorial CTA - More Integrated */}
          <Link to="/ayuda">
            <Card variant="outline" className="p-6 relative overflow-hidden group border-sav-primary/20 bg-sav-primary/5 hover:bg-sav-primary/10 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-700 pointer-events-none">
                <PlayCircle size={80} />
              </div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-sav-primary/20 flex items-center justify-center text-sav-primary shadow-inner">
                  <PlayCircle size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Centro de Ayuda</h3>
                  <p className="text-[10px] text-sav-muted mt-1 font-bold uppercase tracking-widest">Aprende a maximizar tus ganancias</p>
                </div>
                <div className="p-2 rounded-full bg-white/5 group-hover:bg-sav-primary group-hover:text-white transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>
            </Card>
          </Link>
        </main>
      </div>

      {/* Global Popup */}
      <AnimatePresence>
        {showPopup && popupData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPopup(false)}
              className="absolute inset-0 bg-sav-dark/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-sav-dark border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              {popupData.popup_image && (
                <div className="aspect-video w-full overflow-hidden">
                  <img src={api.getMediaUrl(popupData.popup_image)} alt="Aviso" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-8 text-center">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">
                  {popupData.popup_title || 'Aviso Importante'}
                </h3>
                <p className="text-sm text-sav-muted font-bold leading-relaxed mb-8">
                  {popupData.popup_text}
                </p>
                <Button 
                  onClick={() => setShowPopup(false)}
                  className="w-full h-14 rounded-2xl text-[11px] font-black tracking-widest"
                >
                  ENTENDIDO
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
