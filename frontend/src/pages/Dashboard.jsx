import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  TrendingUp as TrendingUpIcon, 
  ArrowDownCircle as ArrowDownCircleIcon, 
  Bell as BellIcon,
  ChevronRight as ChevronRightIcon, 
  Sparkles as SparklesIcon, 
  Trophy as TrophyIcon, 
  Users as UsersIcon,
  FileText as FileTextIcon,
  Info as InfoIcon,
  MessageCircle as MessageIcon,
  Compass as RouletteIcon,
  Plus as PlusIcon,
  X as CloseIcon,
  ShieldAlert as ShieldAlertIcon,
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
import GlobalLoader from '../components/ui/GlobalLoader';
import DownloadButton from '../components/DownloadButton';
import FloatingAnnouncements from '../components/dashboard/FloatingAnnouncements';

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
  const [announcementsToShow, setAnnouncementsToShow] = useState([]);
  const [showSupportMenu, setShowSupportMenu] = useState(false);
  const [securityAlert, setSecurityAlert] = useState(null);
  const [showSundayModal, setShowSundayModal] = useState(true);
  const isSunday = now.getDay() === 0;

  useEffect(() => {
    // Filtrar comunicados que ya se mostraron en esta sesión
    if (comunicados.length > 0) {
      const shownIds = JSON.parse(sessionStorage.getItem('shown_announcement_ids') || '[]');
      const newAnnouncements = comunicados.filter(ann => !shownIds.includes(ann.id));
      
      if (newAnnouncements.length > 0) {
        setAnnouncementsToShow(newAnnouncements);
        const newShownIds = [...shownIds, ...newAnnouncements.map(ann => ann.id)];
        sessionStorage.setItem('shown_announcement_ids', JSON.stringify(newShownIds));
      }
    }
  }, [comunicados]);

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
      color: 'text-bcb-primary', 
      bg: 'bg-bcb-primary/10',
      className: 'text-[8px] sm:text-[9px] scale-90',
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
    { to: '/anuncios', icon: BellIcon, label: 'Anuncios', color: 'text-blue-700', bg: 'bg-blue-100' },
    { to: '/acerca-de', icon: InfoIcon, label: 'Nosotros', color: 'text-cyan-700', bg: 'bg-cyan-100' },
  ];

  if (loading) return <GlobalLoader />;

  return (
    <>
      {/* Sistema de Anuncios Flotantes (Modernos y No-Bloqueantes) */}
      <FloatingAnnouncements announcements={announcementsToShow} />

      {/* Modal de Mantenimiento Domingo - Fuera de Layout */}
      <AnimatePresence>
        {isSunday && showSundayModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSundayModal(false)}
              className="absolute inset-0 bg-white/95 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-[95%] max-w-sm bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col p-10 space-y-8 items-center text-center z-[100000]"
            >
              <div className="w-24 h-24 bg-bcb-primary/10 rounded-full flex items-center justify-center text-bcb-primary border border-bcb-primary/10">
                <CoffeeIcon size={48} />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-black uppercase tracking-tighter leading-tight !text-black">
                  ¡Buen domingo <br/> <span className="text-bcb-primary">para todos!</span> 😊
                </h2>
                
                <div className="space-y-4 text-sm font-bold uppercase tracking-widest leading-relaxed text-black/60">
                  <p>Mantenimiento semanal para optimizar tu experiencia.</p>
                  <p className="text-black font-black pt-6 border-t border-black/5 text-base">
                    ¡Feliz descanso les desea <br/> BCB Global! 🚀
                  </p>
                </div>
              </div>

              <Button 
                onClick={() => setShowSundayModal(false)}
                className="w-full h-16 rounded-[2rem] bg-bcb-primary text-white font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
              >
                <span className="text-white">ENTRAR AL PANEL</span>
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Layout>
        <div className="fixed inset-0 bg-bcb-dark -z-10" />
        {/* Dynamic Background Effects */}
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-bcb-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-bcb-accent/5 blur-[100px] rounded-full -z-10" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.03)_0%,transparent_70%)] -z-10" />
        
        <main className="px-4 sm:px-5 space-y-6 sm:space-y-7 pb-12 pt-4 animate-in">

        {/* Modal de Mantenimiento Domingo (Eliminado por petición del usuario) */}

        {/* Alerta de Seguridad */}
        <AnimatePresence>
          {securityAlert && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-bcb-error/5 border border-bcb-error/10 backdrop-blur-md shadow-xl shadow-bcb-error/5 overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-bcb-error/5 blur-[50px] -z-10" />
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-bcb-error/10 rounded-2xl flex items-center justify-center text-bcb-error border border-bcb-error/10 shadow-sm group-hover:scale-110 transition-transform duration-500">
                  <ShieldAlertIcon size={24} />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    Aviso de Seguridad
                    <span className="w-1.5 h-1.5 rounded-full bg-bcb-error animate-ping" />
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                    {securityAlert}
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      onClick={handleClearAlert}
                      className="px-3 sm:px-4 py-2 rounded-xl bg-bcb-error text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-md shadow-bcb-error/20"
                    >
                      Entendido
                    </button>
                    <Link 
                      to="/soporte"
                      className="px-3 sm:px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                    >
                      No soy yo
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Header Section */}
        <header className="flex items-center justify-between py-2 sm:py-4 px-1">
          <div className="space-y-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <SparklesIcon size={14} className="text-bcb-primary animate-pulse" />
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">BCB GLOBAL</h1>
              </div>
            </div>
          </div>
          <Link to="/anuncios" className="relative group">
            <div className="absolute -inset-3 bg-bcb-primary/10 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-bcb-muted hover:text-white transition-all duration-300 shadow-sm group-hover:border-bcb-primary/30 group-hover:bg-bcb-primary/5">
              <BellIcon size={20} className="group-hover:animate-bounce" />
              {/* Notif Badge */}
              {comunicados.length > 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-bcb-primary rounded-full border-2 border-bcb-dark shadow-[0_0_10px_rgba(220,38,38,0.4)]" />
              )}
            </div>
          </Link>
        </header>

        {/* Banner Section */}
        <BannerCarousel banners={pc?.banners || []} />

        {/* Download App Banner */}
        <div className="px-1">
          <DownloadButton variant="intelligent" />
        </div>

        {/* Módulo 1: Grado Especial de Usuario */}
        {user?.grado_colaborador && user?.grado_colaborador !== 'ninguno' && (
          <div className="px-1">
            <Card className="p-4 sm:p-5 bg-emerald-500/5 border-emerald-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <MedalIcon size={40} className="text-emerald-500" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <MedalIcon size={20} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] sm:text-xs font-black text-emerald-700 uppercase tracking-tighter">
                    Grado Especial: {user.grado_colaborador === 'colaborador' ? 'Colaborador' : 'Colaborador Senior'}
                  </p>
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Salario Mensual: {formatCurrency(user.salario_colaborador, 'Bs')}
                  </p>
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight italic">
                    Beneficio exclusivo para el equipo de administración
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Wallet Card */}
        <Card variant="premium" className="p-5 sm:p-8 border-none bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 relative overflow-hidden group shadow-2xl shadow-indigo-200 active:scale-[0.99] transition-transform duration-500">
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 blur-[80px] rounded-full transition-all group-hover:bg-white/20 duration-1000" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-400/20 blur-[60px] rounded-full" />
          
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex justify-between items-start">
              <div className="space-y-4 flex-1">
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-[11px] font-black text-white/90 uppercase tracking-[0.3em] drop-shadow-sm">Balance de Capital</p>
                  <div className="flex items-baseline gap-2 overflow-hidden">
                    <p className="text-4xl sm:text-6xl font-black text-white tracking-tighter truncate drop-shadow-lg">
                      {formatCurrency(user?.saldo_principal || 0, 'Bs').trim()}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl shadow-lg inline-block">
                  <p className="text-[8px] sm:text-[9px] font-black text-white/80 uppercase tracking-[0.2em] text-center mb-0.5">Membresía</p>
                  <p className="text-xs sm:text-sm font-black text-white uppercase tracking-widest text-center drop-shadow-sm">{displayLevelCode(user?.nivel_codigo)}</p>
                </div>
              </div>

              <Link to="/recargar" className="shrink-0">
                <Button variant="ghost" className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xl" icon={PlusIcon} />
              </Link>
            </div>

            <div className="flex gap-3">
              <Link to="/recargar" className="flex-1">
                <Button variant="secondary" className="w-full h-12 sm:h-14 text-[10px] sm:text-[11px] font-black tracking-[0.2em] sm:tracking-[0.25em] bg-white text-indigo-900 hover:bg-slate-50 shadow-lg active:scale-[0.98] transition-all" icon={PlusIcon}>RECARGAR</Button>
              </Link>
              <Link to="/retiro" className="flex-1">
                <Button variant="secondary" className="w-full h-12 sm:h-14 text-[10px] sm:text-[11px] font-black tracking-[0.2em] sm:tracking-[0.25em] bg-indigo-700/50 border-white/30 text-white hover:bg-indigo-700/60 backdrop-blur-md shadow-lg active:scale-[0.98] transition-all" icon={ArrowDownCircleIcon}>RETIRAR</Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Quick Stats Grid */}
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-slate-200 p-6 sm:p-8 space-y-7 border-2 border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-900 via-indigo-600 to-indigo-900" />
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-900 shadow-sm border border-indigo-200">
                <TrophyIcon size={16} strokeWidth={3} />
              </div>
              <h3 className="text-[11px] sm:text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Resumen Financiero</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-10 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-10 sm:h-12 bg-slate-300" />
            <div className="space-y-1.5">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">Ingresos Hoy</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tighter drop-shadow-sm">
                +{formatCurrency(stats?.ingresos_hoy || 0, 'Bs').trim()}
              </p>
            </div>
            <div className="space-y-1.5 text-right">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">Total Acumulado</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                {formatCurrency(stats?.total_acumulado || 0, 'Bs').trim()}
              </p>
            </div>
          </div>
        </div>

        {/* Investment Opportunities */}
        <section className="space-y-5">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-bcb-primary/5 flex items-center justify-center text-bcb-primary">
                <TrendingUpIcon size={16} strokeWidth={2.5} />
              </div>
              <h3 className="text-[11px] sm:text-[12px] font-black text-slate-900 uppercase tracking-[0.25em]">Planes VIP GLOBAL</h3>
            </div>
            <Link to="/vip" className="text-[10px] font-black text-bcb-primary uppercase tracking-widest flex items-center gap-1.5 hover:underline">
              Ver Catálogo <ChevronRightIcon size={14} />
            </Link>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 px-1 no-scrollbar snap-x">
            {Array.isArray(niveles) && niveles.filter(n => (n.deposito || n.costo) > 0).map((n, i) => {
              const esActual = n.id === user?.nivel_id;
              return (
                <Link 
                  key={n.id} 
                  to="/vip"
                  className={cn(
                    "min-w-[140px] sm:min-w-[160px] p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border transition-all snap-start relative overflow-hidden group",
                    esActual ? "bg-bcb-primary/10 border-bcb-primary/30" : "bg-white border-black/5 shadow-sm"
                  )}
                >
                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] sm:text-[10px] font-black text-gray-900 uppercase tracking-tighter">{n.nombre}</span>
                      {esActual && <div className="w-1.5 h-1.5 rounded-full bg-bcb-success animate-pulse" />}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[7px] sm:text-[8px] font-black text-bcb-muted uppercase tracking-widest leading-none">Diario</p>
                      <p className="text-base sm:text-lg font-black text-gray-900">+{Number(n.ingreso_diario || 0).toFixed(2)}</p>
                    </div>
                    <div className="pt-2 sm:pt-3 border-t border-black/5 flex justify-between items-center">
                      <span className="text-[7px] sm:text-[8px] font-bold text-bcb-muted uppercase">Inversión</span>
                      <span className="text-[9px] sm:text-[10px] font-black text-gray-900">{formatCurrency(n.deposito, 'Bs')}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Actions Grid */}
        <ActionGrid items={actionItems} />

        {/* Tutorial Section */}
        <div className="px-1 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-bcb-primary/20 to-rose-500/20 rounded-[1.5rem] sm:rounded-[2rem] blur opacity-50 group-hover:opacity-100 transition duration-1000" />
          <GuideSection text={pc?.marquee_text || "Bienvenido a BCB Global Institutional Bolivia — Líder en Publicidad Digital"} />
        </div>

        {/* Footer Brand */}
        <div className="w-full flex justify-center py-4">
          <img src="/images/institutional-security.webp" alt="Seguridad Institucional Garantizada" className="w-full h-auto max-w-md object-contain" />
        </div>
      </main>

      {/* Floating Action Menu - Fixed positioning for mobile safe areas */}
      <div className="fixed bottom-[calc(95px+env(safe-area-inset-bottom))] right-4 sm:right-6 flex flex-col gap-3 sm:gap-4 z-[60] items-end">
        <AnimatePresence>
          {showSupportMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 50 }}
              className="flex flex-col gap-2.5 sm:gap-3 mb-2"
            >
              {pc?.ruleta_activa && (
                <Link to="/premios" className="group flex items-center gap-3 justify-end active:scale-95 transition-transform">
                  <span className="bg-white/90 backdrop-blur-md border border-black/5 px-3 py-2 rounded-xl text-[8px] sm:text-[9px] font-black text-gray-900 uppercase tracking-widest shadow-xl">
                    Centro de Premios
                  </span>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-rose-600 flex items-center justify-center text-white border border-white/30 shadow-xl">
                    <RouletteIcon size={18} className="animate-spin-slow" />
                  </div>
                </Link>
              )}
              
              <a href={pc?.soporte_canal_url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group active:scale-95 transition-transform">
                <span className="bg-white/90 backdrop-blur-md border border-black/5 px-3 py-2 rounded-xl text-[8px] sm:text-[9px] font-black text-gray-900 uppercase tracking-widest shadow-xl">
                  Canal Oficial
                </span>
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-bcb-primary flex items-center justify-center text-white border border-white/10 shadow-xl">
                  <UsersIcon size={18} />
                </div>
              </a>
              <a href={pc?.soporte_gerente_url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group active:scale-95 transition-transform">
                <span className="bg-white/90 backdrop-blur-md border border-black/5 px-3 py-2 rounded-xl text-[8px] sm:text-[9px] font-black text-gray-900 uppercase tracking-widest shadow-xl">
                  Soporte VIP
                </span>
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500 flex items-center justify-center text-white border border-white/10 shadow-xl">
                  <MessageIcon size={18} />
                </div>
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSupportMenu(!showSupportMenu)}
          className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white transition-all duration-300 border-2 z-10 shadow-2xl",
            showSupportMenu 
              ? "bg-white border-black/10 text-gray-900 rotate-45" 
              : "bg-gradient-to-br from-bcb-primary to-rose-700 border-white/20"
          )}
        >
          {showSupportMenu ? <CloseIcon size={20} /> : <PlusIcon size={24} />}
        </motion.button>
      </div>
    </Layout>
    </>
  );
}

