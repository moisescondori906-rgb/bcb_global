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
      <main className="px-4 sm:px-6 space-y-6 pb-12 pt-6 animate-in">
        {/* Header Section - Modern & Clean */}
        <header className="flex items-center justify-between py-2 px-1">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-sav-muted uppercase tracking-[0.15em] leading-none mb-1">Bienvenido de nuevo</p>
            <h1 className="text-2xl font-black text-sav-primary uppercase tracking-tight leading-none">
              {user?.nombre_usuario || 'BCB GLOBAL'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/mensajes" className="relative p-2.5 rounded-m3 bg-white border border-sav-border shadow-m3-1 hover:bg-sav-surface transition-colors">
              <BellIcon size={22} className="text-sav-primary" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-sav-accent rounded-full border-2 border-white shadow-sm" />
            </Link>
          </div>
        </header>

        {/* Banner Section */}
        <div className="rounded-m3-lg overflow-hidden shadow-m3-2 border border-sav-border/30">
          <BannerCarousel banners={pc?.banners || []} />
        </div>

        {/* Main Wallet Card - Flutter Fintech Style */}
        <Card className="bg-sav-primary border-none p-6 sm:p-8 relative overflow-hidden group shadow-m3-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.2em]">Balance de Capital</p>
                <p className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                  {formatCurrency(user?.saldo_principal || 0, 'Bs').trim()}
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-m3-sm bg-white/10 backdrop-blur-md border border-white/20">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">{displayLevelCode(user?.nivel_codigo)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to="/recargar" className="flex-1">
                <Button variant="secondary" className="bg-white text-sav-primary border-none hover:bg-white/90 h-12 text-[11px]" icon={PlusIcon}>RECARGAR</Button>
              </Link>
              <Link to="/retiro" className="flex-1">
                <Button variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-12 text-[11px]" icon={ArrowDownCircleIcon}>RETIRAR</Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Financial Summary - Metric Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-black text-sav-muted uppercase tracking-widest mb-1">Hoy</p>
            <p className="text-xl font-black text-emerald-600 tracking-tighter">
              +{formatCurrency(stats?.ingresos_hoy || 0, 'Bs').trim()}
            </p>
          </Card>
          <Card className="p-5 border-l-4 border-l-sav-primary">
            <p className="text-[10px] font-black text-sav-muted uppercase tracking-widest mb-1">Acumulado</p>
            <p className="text-xl font-black text-sav-primary tracking-tighter">
              {formatCurrency(stats?.total_acumulado || 0, 'Bs').trim()}
            </p>
          </Card>
        </div>

        {/* Investment Opportunities - Horizontal Scroll */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[12px] font-black text-sav-primary uppercase tracking-[0.2em]">Planes VIP GLOBAL</h3>
            <Link to="/vip" className="text-[10px] font-black text-sav-muted uppercase tracking-widest flex items-center gap-1 hover:text-sav-primary transition-colors">
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
                    "min-w-[150px] p-5 rounded-m3 border transition-all snap-start relative shadow-m3-1",
                    esActual ? "bg-sav-surface border-sav-primary/30 ring-1 ring-sav-primary/10" : "bg-white border-sav-border"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-sav-primary uppercase">{n.nombre}</span>
                      {esActual && <div className="w-2 h-2 rounded-full bg-sav-success shadow-[0_0_8px_rgba(46,125,50,0.5)]" />}
                    </div>
                    <div className="pt-2 border-t border-sav-border/50">
                      <p className="text-[9px] font-bold text-sav-muted uppercase tracking-tighter">Inversión</p>
                      <p className="text-base font-black text-sav-primary">{formatCurrency(n.deposito)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Action Grid - Custom Component */}
        <ActionGrid items={actionItems} />

        {/* Announcements - If any */}
        {comunicados.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[12px] font-black text-sav-primary uppercase tracking-[0.2em] px-1">Comunicados Oficiales</h3>
            <div className="space-y-3">
              {comunicados.map(item => (
                <Card key={item.id} className="p-0 overflow-hidden shadow-m3-2 border-sav-border/30">
                  {item.imagen_url && (
                    <img src={api.getMediaUrl(item.imagen_url)} className="w-full h-40 object-cover" alt={item.titulo} />
                  )}
                  <div className="p-5 space-y-2">
                    <h4 className="text-sm font-black text-sav-primary uppercase tracking-tight">{item.titulo}</h4>
                    <p className="text-[11px] font-medium text-sav-muted leading-relaxed line-clamp-2">{item.mensaje}</p>
                    <p className="text-[9px] font-black text-sav-muted/50 uppercase tracking-widest pt-2">{formatDate(item.created_at)}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer Security Brand */}
        <div className="pt-8 pb-4">
          <img src="/images/institutional-security.webp" alt="Seguridad Institucional" className="mx-auto h-12 object-contain grayscale opacity-30" />
          <p className="text-center text-[8px] font-black text-sav-muted uppercase tracking-[0.3em] mt-4">BCB Global Institutional Bolivia</p>
        </div>
      </main>

      <FloatingQuestionnaire />
      
      {/* Support Floating Menu - Simplified */}
      <div className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-5 z-[60]">
         <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSupportMenu(!showSupportMenu)}
          className={cn(
            "w-14 h-14 rounded-m3-lg flex items-center justify-center text-white transition-all duration-300 shadow-m3-3",
            showSupportMenu ? "bg-white text-sav-primary rotate-45 border border-sav-border" : "bg-sav-primary"
          )}
        >
          {showSupportMenu ? <CloseIcon size={24} /> : <MessageIcon size={24} />}
        </motion.button>
        
        <AnimatePresence>
          {showSupportMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2"
            >
              <a href={pc?.soporte_gerente_url} target="_blank" className="whitespace-nowrap bg-white border border-sav-border px-4 py-3 rounded-m3 shadow-m3-2 text-[10px] font-black text-sav-primary uppercase tracking-widest flex items-center gap-2">
                <MessageIcon size={16} /> Soporte VIP
              </a>
              <a href={pc?.soporte_canal_url} target="_blank" className="whitespace-nowrap bg-white border border-sav-border px-4 py-3 rounded-m3 shadow-m3-2 text-[10px] font-black text-sav-primary uppercase tracking-widest flex items-center gap-2">
                <UsersIcon size={16} /> Canal Oficial
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
