import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  TrendingUp as TrendingUpIcon, 
  Target as TargetIcon, 
  ShieldCheck as ShieldCheckIcon, 
  ArrowUpCircle as ArrowUpCircleIcon, 
  ArrowDownCircle as ArrowDownCircleIcon, 
  Bell as BellIcon,
  ChevronRight as ChevronRightIcon, 
  PlayCircle as PlayCircleIcon, 
  Sparkles as SparklesIcon, 
  Zap as ZapIcon, 
  Trophy as TrophyIcon, 
  Users as UsersIcon,
  FileText as FileTextIcon,
  HelpCircle as HelpCircleIcon,
  Info as InfoIcon,
  MessageCircle as MessageIcon,
  Compass as RouletteIcon,
  Plus as PlusIcon,
  X as CloseIcon,
  ShieldAlert as ShieldAlertIcon,
  Smartphone as SmartphoneIcon,
  Medal as MedalIcon,
  Coffee as CoffeeIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBoliviaNow } from '../utils/time';
import { formatCurrency, formatDate } from '../lib/utils/format';
import Layout from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { cn } from '../lib/utils/cn';
import { displayLevelCode } from '../lib/displayLevel.js';
import BannerCarousel from '../components/dashboard/BannerCarousel';
import ActionGrid from '../components/dashboard/ActionGrid';
import GuideSection from '../components/dashboard/GuideSection';
import FloatingQuestionnaire from '../components/FloatingQuestionnaire';
import GlobalLoader from '../components/ui/GlobalLoader';
import DownloadButton from '../components/DownloadButton';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(getBoliviaNow());

  useEffect(() => {
    const timer = setInterval(() => setNow(getBoliviaNow()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [stats, setStats] = useState({ ingresos_hoy: 0, total_acumulado: 0 });
  const [niveles, setNiveles] = useState([]);
  const [teamSummary, setTeamSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pc, setPc] = useState(null);
  const [comunicados, setComunicados] = useState([]);
  const [showSupportMenu, setShowSupportMenu] = useState(false);
  const [securityAlert, setSecurityAlert] = useState(null);
  const [showSundayModal, setShowSundayModal] = useState(true);
  const isSunday = now.getDay() === 0;

  useEffect(() => {
    if (user?.security_alert) {
      setSecurityAlert(user.security_alert);
    }
  }, [user]);

  const handleClearAlert = async () => {
    try {
      await api.post('/users/clear-security-alert');
      setSecurityAlert(null);
    } catch (err) {
      console.error('Error clearing alert:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [statsData, pcData, nivelesData, announcementsData, teamData] = await Promise.all([
          api.get('/users/stats'),
          api.publicContent(),
          api.levels.list(),
          api.get('/home-announcements'),
          api.get('/users/team-report')
        ]);
        
        if (isMounted) {
          setStats({
            ingresos_hoy: statsData?.ingresos_hoy ?? 0,
            total_acumulado: statsData?.total_acumulado ?? 0
          });
          setPc(pcData);
          setNiveles(nivelesData || []);
          setComunicados(announcementsData?.items || []);
          setTeamSummary(teamData);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };
    
    loadData();
    
    // Polling Resiliente (v13.0.1)
    let timeoutId;
    const pollData = async () => {
      if (isMounted && document.visibilityState === 'visible' && navigator.onLine) {
        try {
          await loadData();
        } catch (e) {
          // Ignorar errores de red en polling silencioso
        }
      }
      if (isMounted) {
        timeoutId = setTimeout(pollData, 60000);
      }
    };
    
    timeoutId = setTimeout(pollData, 60000);
    
    return () => { 
      isMounted = false; 
      clearTimeout(timeoutId);
    };
  }, []);

  const actionItems = [
    { to: '/vip', icon: TrophyIcon, label: 'VIP', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    { to: '/invitar', icon: UsersIcon, label: 'Invitar', color: 'text-orange-700', bg: 'bg-orange-100' },
    { to: '/premios', icon: RouletteIcon, label: 'Premios', color: 'text-amber-700', bg: 'bg-amber-100' },
    { 
      to: '/equipo', 
      icon: UsersIcon, 
      label: 'Mi Equipo', 
      color: 'text-blue-700', 
      bg: 'bg-blue-100',
      badge: teamSummary?.niveles ? (
        <div className="flex gap-1 mt-1">
          {teamSummary.niveles.map(n => (
            <span key={n.nivel} className="text-[7px] font-black bg-blue-700 text-white px-1 rounded-sm border border-blue-800">
              {n.nivel}:{n.total_miembros}
            </span>
          ))}
        </div>
      ) : null
    },
    { to: '/movimientos', icon: FileTextIcon, label: 'Movimientos', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { to: '/acerca-de', icon: InfoIcon, label: 'Nosotros', color: 'text-cyan-700', bg: 'bg-cyan-100' },
  ];

  if (loading) return <GlobalLoader />;

  return (
    <Layout>
      <main className="px-4 sm:px-6 space-y-8 pb-12 pt-6 animate-in">
        {/* Header Section - Ultra Modern */}
        <header className="flex items-center justify-between py-2">
          <div className="flex flex-col">
            <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.2em] mb-1">Status Actual</p>
            <h1 className="text-2xl font-bold tracking-tight">
              Hola, <span className="text-gradient">{user?.nombre_usuario || 'BCB GLOBAL'}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/mensajes" className="relative w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all shadow-m3-1">
              <BellIcon size={20} className="text-white" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-sav-accent rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            </Link>
          </div>
        </header>

        {/* Banner Section */}
        <div className="rounded-m3-lg overflow-hidden shadow-m3-3 border border-white/5">
          <BannerCarousel banners={pc?.banners || []} />
        </div>

        {/* Main Wallet Card - Premium 2026 Style */}
        <div className="relative group perspective-1000">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-sav-accent to-sav-secondary rounded-m3-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <Card className="relative bg-zinc-950/60 backdrop-blur-3xl border border-white/10 p-7 sm:p-9 overflow-hidden shadow-m3-3">
            {/* Animated background elements */}
            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-sav-accent/20 rounded-full blur-[80px] animate-pulse" />
            <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-sav-secondary/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1.5s' }} />
            
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-sav-muted uppercase tracking-[0.25em]">Capital Total</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-bold text-white tracking-tighter">
                      {formatCurrency(user?.saldo_principal || 0, 'Bs').replace('Bs', '').trim()}
                    </span>
                    <span className="text-xl font-bold text-sav-accent">Bs</span>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-m3-sm bg-white/5 border border-white/10 backdrop-blur-md">
                   <p className="text-[10px] font-black text-white uppercase tracking-widest">{displayLevelCode(user?.nivel_codigo)}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Link to="/recargar" className="flex-1">
                  <Button variant="primary" className="w-full h-13 shadow-accent-glow" icon={PlusIcon}>RECARGAR</Button>
                </Link>
                <Link to="/retiro" className="flex-1">
                  <Button variant="secondary" className="w-full h-13" icon={ArrowDownCircleIcon}>RETIRAR</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Financial Summary - Glass Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-m3 p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUpIcon size={40} className="text-emerald-500" />
            </div>
            <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.2em] mb-1">Ganancia Hoy</p>
            <p className="text-xl font-bold text-emerald-400 tracking-tight">
              +{formatCurrency(stats?.ingresos_hoy || 0, 'Bs').trim()}
            </p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-m3 p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <TargetIcon size={40} className="text-sav-accent" />
            </div>
            <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.2em] mb-1">Acumulado</p>
            <p className="text-xl font-bold text-white tracking-tight">
              {formatCurrency(stats?.total_acumulado || 0, 'Bs').trim()}
            </p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Servicios Premium</h3>
          </div>
          <ActionGrid items={actionItems} />
        </section>

        {/* Investment Opportunities - Horizontal Scroll */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Oportunidades VIP</h3>
            <Link to="/vip" className="text-[11px] font-bold text-sav-accent uppercase tracking-widest flex items-center gap-1 hover:brightness-125 transition-all">
              Ver Todo <ChevronRightIcon size={14} />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar snap-x">
            {Array.isArray(niveles) && niveles.filter(n => (n.deposito || n.costo) > 0).map((n) => {
              const esActual = n.id === user?.nivel_id;
              return (
                <Link 
                  key={n.id} 
                  to="/vip"
                  className={cn(
                    "min-w-[160px] p-5 rounded-m3 border transition-all duration-500 snap-start relative group overflow-hidden",
                    esActual ? "bg-gradient-to-br from-sav-accent/20 to-sav-secondary/20 border-sav-accent/40 shadow-accent-glow" : "bg-white/[0.03] border-white/10 hover:border-white/20"
                  )}
                >
                  {esActual && (
                    <div className="absolute -top-1 -right-1">
                      <div className="bg-sav-accent text-[8px] font-bold text-white px-2 py-1 rounded-bl-lg uppercase tracking-widest">ACTUAL</div>
                    </div>
                  )}
                  <div className="space-y-3 relative z-10">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                      esActual ? "bg-sav-accent text-white" : "bg-white/5 text-sav-muted"
                    )}>
                      <TrophyIcon size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest mb-0.5">{n.nombre}</p>
                      <p className="text-lg font-bold text-white tracking-tight">{formatCurrency(n.deposito || n.costo, 'Bs').trim()}</p>
                    </div>
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                        Renta: {formatCurrency(n.ingreso_diario, 'Bs').trim()}/día
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Official Guides */}
        <GuideSection guides={pc?.guias || []} />
        
        {/* Help/Support Section */}
        <section className="bg-gradient-to-r from-zinc-900 to-black rounded-m3-lg p-6 border border-white/5 flex items-center justify-between group cursor-pointer hover:border-sav-accent/30 transition-all duration-500">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Centro de Ayuda</h4>
            <p className="text-[11px] text-sav-muted">¿Necesitas asistencia técnica?</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-sav-accent group-hover:bg-sav-accent group-hover:text-white transition-all duration-500">
            <HelpCircleIcon size={24} />
          </div>
        </section>
      </main>

      <FloatingQuestionnaire />
      
      {/* Sunday Modal - Upgraded */}
      <AnimatePresence>
        {isSunday && showSundayModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setShowSundayModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-sm bg-zinc-900 border border-white/10 rounded-m3-lg p-8 shadow-m3-3 text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
                <ShieldAlertIcon size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Mantenimiento de Red</h3>
                <p className="text-sm text-sav-muted leading-relaxed">
                  Hoy es domingo. El sistema de retiros se encuentra en mantenimiento semanal. Los retiros se reanudarán mañana lunes.
                </p>
              </div>
              <Button variant="primary" onClick={() => setShowSundayModal(false)} className="w-full">ENTENDIDO</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
