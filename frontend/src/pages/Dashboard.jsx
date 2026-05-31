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
  Coffee as CoffeeIcon,
  CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBoliviaNow } from '../utils/time';
import { formatCurrency, formatDate } from '../lib/utils/format';
import Layout from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { cn } from '../lib/utils/cn';
import { displayLevelCode } from '../lib/displayLevel.js';
import BannerCarousel from '../components/dashboard/BannerCarousel';
import ActionGrid from '../components/dashboard/ActionGrid';
import GuideSection from '../components/dashboard/GuideSection';
import GlobalLoader from '../components/ui/GlobalLoader';

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

  useEffect(() => {
    if (user?.security_alert) {
      setSecurityAlert(user.security_alert);
    }
  }, [user]);

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
    
    let timeoutId;
    const pollData = async () => {
      if (isMounted && document.visibilityState === 'visible' && navigator.onLine) {
        try {
          await loadData();
        } catch (e) {}
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
    { to: '/vip', icon: TrophyIcon, label: 'VIP', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { to: '/invitar', icon: UsersIcon, label: 'Invitar', color: 'text-violet-600', bg: 'bg-violet-50' },
    { to: '/premios', icon: RouletteIcon, label: 'Premios', color: 'text-amber-600', bg: 'bg-amber-50' },
    { to: '/equipo', icon: UsersIcon, label: 'Equipo', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { to: '/movimientos', icon: FileTextIcon, label: 'Historial', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { to: '/acerca-de', icon: InfoIcon, label: 'Nosotros', color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  if (loading) return <GlobalLoader />;

  return (
    <Layout>
      <main className="px-6 space-y-8 pb-32 pt-8 animate-in">
        {/* Modern Greeting Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-sav-muted uppercase tracking-[0.2em]">Bienvenido de nuevo</p>
            <h1 className="text-2xl font-extrabold text-sav-text-main tracking-tight flex items-center gap-2">
              {user?.nombre_usuario || 'BCB GLOBAL'}
              <motion.span
                animate={{ rotate: [0, 20, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
              >
                👋
              </motion.span>
            </h1>
          </div>
          <Link to="/mensajes" className="relative w-12 h-12 rounded-2xl bg-white border border-black/[0.03] flex items-center justify-center shadow-m3-1 hover:shadow-m3-2 transition-all">
            <BellIcon size={22} className="text-sav-text-main" strokeWidth={2.5} />
            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-sav-primary rounded-full border-2 border-white" />
          </Link>
        </header>

        {/* Banner Section - Polished */}
        <div className="rounded-m3-lg overflow-hidden shadow-m3-2 border border-black/[0.02]">
          <BannerCarousel banners={pc?.banners || []} />
        </div>

        {/* Main Capital Card - Premium Light Flutter */}
        <Card variant="premium" className="group">
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sav-primary/10 flex items-center justify-center">
                    <WalletIcon size={12} className="text-sav-primary" strokeWidth={3} />
                  </div>
                  <p className="text-[11px] font-bold text-sav-muted uppercase tracking-[0.2em]">Capital Principal</p>
                </div>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-5xl font-extrabold text-sav-text-main tracking-tighter">
                    {formatCurrency(user?.saldo_principal || 0, 'Bs').replace('Bs', '').trim()}
                  </span>
                  <span className="text-lg font-bold text-sav-primary">Bs</span>
                </div>
              </div>
              <Badge variant="info" className="px-4 py-2 rounded-2xl border-indigo-200/50">
                {displayLevelCode(user?.nivel_codigo)}
              </Badge>
            </div>

            <div className="flex gap-4">
              <Link to="/recargar" className="flex-1">
                <Button variant="primary" className="w-full shadow-accent-glow" icon={PlusIcon}>RECARGAR</Button>
              </Link>
              <Link to="/retiro" className="flex-1">
                <Button variant="secondary" className="w-full" icon={ArrowDownCircleIcon}>RETIRAR</Button>
              </Link>
            </div>
          </div>
          
          {/* Abstract flutter shapes */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-sav-primary/5 rounded-full blur-3xl" />
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-sav-accent/5 rounded-full blur-3xl" />
        </Card>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 bg-emerald-50/50 border-emerald-100/50 flex flex-col gap-3 group overflow-hidden relative">
             <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <TrendingUpIcon size={20} strokeWidth={2.5} />
             </div>
             <div>
               <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mb-0.5">Ingresos Hoy</p>
               <p className="text-xl font-extrabold text-emerald-600 tracking-tight">
                 +{formatCurrency(stats?.ingresos_hoy || 0, 'Bs').trim()}
               </p>
             </div>
          </Card>
          <Card className="p-5 bg-indigo-50/50 border-indigo-100/50 flex flex-col gap-3 group overflow-hidden relative">
             <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <TargetIcon size={20} strokeWidth={2.5} />
             </div>
             <div>
               <p className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-widest mb-0.5">Total Acumulado</p>
               <p className="text-xl font-extrabold text-indigo-600 tracking-tight">
                 {formatCurrency(stats?.total_acumulado || 0, 'Bs').trim()}
               </p>
             </div>
          </Card>
        </div>

        {/* Services Grid */}
        <section className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
              <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Servicios Premium</h3>
            </div>
          </div>
          <ActionGrid items={actionItems} />
        </section>

        {/* VIP Section - Flutter Horizontal Scroll */}
        <section className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-amber-400 rounded-full" />
              <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Planes VIP</h3>
            </div>
            <Link to="/vip" className="text-[11px] font-bold text-sav-primary uppercase tracking-widest flex items-center gap-1 hover:translate-x-1 transition-all">
              Ver Todo <ChevronRightIcon size={14} strokeWidth={3} />
            </Link>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-6 px-1 no-scrollbar snap-x">
            {Array.isArray(niveles) && niveles.filter(n => (n.deposito || n.costo) > 0).map((n) => {
              const esActual = n.id === user?.nivel_id;
              return (
                <Link 
                  key={n.id} 
                  to="/vip"
                  className={cn(
                    "min-w-[180px] p-6 rounded-m3-lg border transition-all duration-500 snap-start relative group overflow-hidden",
                    esActual ? "bg-white border-sav-primary/30 shadow-m3-2" : "bg-sav-surface border-black/[0.03] hover:bg-white hover:shadow-m3-1"
                  )}
                >
                  {esActual && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-sav-primary text-[8px] font-bold text-white px-3 py-1.5 rounded-bl-2xl uppercase tracking-[0.2em]">ACTUAL</div>
                    </div>
                  )}
                  <div className="space-y-4 relative z-10">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6",
                      esActual ? "bg-sav-primary text-white shadow-accent-glow" : "bg-white text-sav-muted border border-black/[0.03]"
                    )}>
                      <TrophyIcon size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-sav-muted uppercase tracking-widest mb-1">{n.nombre}</p>
                      <p className="text-xl font-extrabold text-sav-text-main tracking-tight">{formatCurrency(n.deposito || n.costo, 'Bs').trim()}</p>
                    </div>
                    <div className="pt-3 border-t border-black/[0.03]">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                        <ZapIcon size={10} fill="currentColor" /> {formatCurrency(n.ingreso_diario, 'Bs').trim()}/día
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Support Menu Redesign */}
        <AnimatePresence>
          {showSupportMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-28 right-6 z-[100] w-64 bg-white rounded-m3-lg shadow-m3-3 border border-black/[0.05] p-2 overflow-hidden"
            >
              <div className="p-4 border-b border-black/[0.03]">
                <h4 className="text-[12px] font-extrabold text-sav-text-main uppercase tracking-widest">Soporte 24/7</h4>
              </div>
              <div className="p-2 space-y-1">
                <a href={pc?.config?.whatsapp_soporte} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-emerald-50 text-emerald-600 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageIcon size={20} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest">WhatsApp</span>
                </a>
                <a href={pc?.config?.telegram_soporte} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl hover:bg-blue-50 text-blue-600 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <SmartphoneIcon size={20} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest">Telegram</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Support Toggle */}
        <button
          onClick={() => setShowSupportMenu(!showSupportMenu)}
          className={cn(
            "fixed bottom-28 right-6 w-14 h-14 rounded-[2rem] flex items-center justify-center shadow-m3-3 z-[110] transition-all duration-500",
            showSupportMenu ? "bg-sav-text-main text-white rotate-90" : "bg-sav-primary text-white hover:scale-110 active:scale-95"
          )}
        >
          {showSupportMenu ? <CloseIcon size={24} /> : <MessageIcon size={24} strokeWidth={2.5} />}
        </button>
      </main>
    </Layout>
  );
}
