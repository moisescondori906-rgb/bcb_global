import Layout from '../components/Layout';
import Header from '../components/Header';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  Info as InfoIcon, 
  Target as TargetIcon, 
  Shield as ShieldIcon, 
  Globe as GlobeIcon, 
  Star as StarIcon, 
  Zap as ZapIcon, 
  Gem as GemIcon, 
  Crown as CrownIcon, 
  MapPin as MapPinIcon, 
  Coins as CoinsIcon, 
  Users2 as Users2Icon, 
  Wallet as WalletIcon, 
  HelpCircle as HelpCircleIcon,
  BarChart3 as BarChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils/cn';
import { useState } from 'react';

export default function AboutUs() {
  const [activeTab, setActiveTab] = useState('empresa');

  const sections = [
    {
      title: "Nuestra Misión",
      description: "Empoderar a miles de personas en todo el mundo a través de una plataforma publicitaria innovadora y accesible, permitiendo que cualquier usuario genere ingresos desde la comodidad de su hogar.",
      color: "text-sav-primary",
      bg: "bg-sav-primary/10"
    },
    {
      title: "Visión Global",
      description: "Convertirnos en el puente líder entre las marcas más influyentes del mundo y una audiencia global comprometida, redefiniendo el marketing digital a través de la participación activa.",
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      title: "Seguridad y Confianza",
      description: "La seguridad de nuestros usuarios es nuestra prioridad. Contamos con sistemas de encriptación de grado institucional y procesos de retiro verificados para garantizar la transparencia total.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    }
  ];

  const levels = [
    { code: 'Global 1', deposit: 200, daily: 7.20, tasks: 4, monthly: 216, color: 'text-amber-400' },
    { code: 'Global 2', deposit: 720, daily: 25.76, tasks: 8, monthly: 772.8, color: 'text-sav-primary' },
    { code: 'Global 3', deposit: 2830, daily: 101.40, tasks: 15, monthly: 3042, color: 'text-blue-400' },
    { code: 'Global 4', deposit: 9150, daily: 339.90, tasks: 30, monthly: 10197, color: 'text-purple-400' },
  ];

  const commissions = {
    investment: [
      { level: 'A', percent: '10%', desc: 'Comisión por Activación' },
      { level: 'B', percent: '3%', desc: 'Comisión Indirecta' },
      { level: 'C', percent: '1%', desc: 'Bono de Red' },
    ]
  };

  const withdrawalSchedule = [
    { level: 'Global 1', day: 'Martes' },
    { level: 'Global 2', day: 'Miércoles' },
    { level: 'Global 3', day: 'Jueves' },
    { level: 'Global 4', day: 'Viernes' },
    { level: 'Global 5+', day: 'Sábado' },
  ];

  const tabs = [
    { id: 'empresa', label: 'Empresa' },
    { id: 'inversion', label: 'Inversión' },
    { id: 'referidos', label: 'Referidos' },
    { id: 'retiros', label: 'Retiros' },
  ];

  return (
    <Layout>
      <Header title="Acerca de Nosotros" />
      
      <main className="p-6 space-y-8 pb-32 animate-fade">
        {/* Intro Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sav-primary/20 flex items-center justify-center text-sav-primary shadow-lg shadow-sav-primary/10">
              <InfoIcon size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">BCB Global</h2>
              <div className="flex items-center gap-2 mt-1">
                <MapPinIcon size={10} className="text-sav-primary" />
                <p className="text-[10px] text-sav-primary font-black uppercase tracking-[0.2em]">Sede: Colorado, EE. UU.</p>
              </div>
            </div>
          </div>
          <Card className="p-4 border-sav-primary/20 bg-sav-primary/5">
            <p className="text-[11px] text-white/90 font-bold uppercase tracking-wide leading-relaxed">
              BCB Global es una corporación estadounidense líder en publicidad digital, con sede principal en el estado de <span className="text-sav-primary">Colorado</span>. Redefinimos el marketing participativo a nivel institucional.
            </p>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === t.id 
                  ? "bg-sav-primary text-white shadow-lg shadow-sav-primary/20 scale-105" 
                  : "bg-white/5 text-sav-muted hover:bg-white/10"
              )}
            >
              {t.id === 'empresa' && <InfoIcon size={14} />}
              {t.id === 'inversion' && <BarChartIcon size={14} />}
              {t.id === 'referidos' && <Users2Icon size={14} />}
              {t.id === 'retiros' && <WalletIcon size={14} />}
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'empresa' && (
            <motion.div
              key="empresa"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {sections.map((item, index) => (
                <Card key={index} className="p-6 bg-white/[0.02] border-white/5 space-y-4 hover:border-sav-primary/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner", item.bg, item.color)}>
                      {index === 0 && <GlobeIcon size={24} />}
                      {index === 1 && <TargetIcon size={24} />}
                      {index === 2 && <ShieldIcon size={24} />}
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{item.title}</h3>
                  </div>
                  <p className="text-[11px] text-sav-muted font-bold leading-relaxed uppercase tracking-wide">
                    {item.description}
                  </p>
                </Card>
              ))}
            </motion.div>
          )}

          {activeTab === 'inversion' && (
            <motion.div
              key="inversion"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="space-y-2 mb-4">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Planes VIP</h3>
                <p className="text-[10px] text-sav-muted font-black uppercase tracking-[0.2em]">Escala tu potencial de ingresos diarios</p>
              </div>
              {levels.map((level, i) => (
                <Card key={level.code} variant="flat" className="p-4 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sav-primary/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-sav-primary/10 transition-colors" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 shadow-inner", level.color)}>
                        {level.code === 'Global 1' && <StarIcon size={20} />}
                        {level.code === 'Global 2' && <ZapIcon size={20} />}
                        {level.code === 'Global 3' && <GemIcon size={20} />}
                        {level.code === 'Global 4' && <CrownIcon size={20} />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">{level.code}</h4>
                        <p className="text-[9px] text-sav-muted font-bold uppercase tracking-widest">Inversión: {level.deposit} BOB</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5 relative z-10">
                    <div className="text-center">
                      <p className="text-[7px] text-sav-muted font-black uppercase tracking-widest">Tareas</p>
                      <p className="text-[11px] font-black text-white">{level.tasks}</p>
                    </div>
                    <div className="text-center border-x border-white/5">
                      <p className="text-[7px] text-sav-muted font-black uppercase tracking-widest">Diario</p>
                      <p className="text-[11px] font-black text-sav-success">+{level.daily} BOB</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[7px] text-sav-muted font-black uppercase tracking-widest">Mensual</p>
                      <p className="text-[11px] font-black text-white">{level.monthly} BOB</p>
                    </div>
                  </div>
                </Card>
              ))}
            </motion.div>
          )}

          {activeTab === 'referidos' && (
            <motion.div
              key="referidos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="p-6 bg-blue-500/5 border-blue-500/20 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <CoinsIcon size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Bono de Invitación</h4>
                    <p className="text-[8px] text-sav-muted font-bold uppercase tracking-widest">Por activación de subordinado</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {commissions.investment.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Badge variant="info" className="w-6 h-6 p-0 flex items-center justify-center rounded-md font-black border-blue-500/30 text-blue-400">{c.level}</Badge>
                        <span className="text-[9px] text-white/80 font-bold uppercase tracking-widest">{c.desc}</span>
                      </div>
                      <span className="text-xs font-black text-blue-400">{c.percent}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-sav-primary/5 border-sav-primary/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sav-primary/10 flex items-center justify-center text-sav-primary">
                    <ZapIcon size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Comisiones de Tareas</h4>
                    <p className="text-[8px] text-sav-muted font-bold uppercase tracking-widest">Actualizado a 0%</p>
                  </div>
                </div>
                <p className="text-[10px] text-sav-muted font-bold uppercase tracking-widest leading-relaxed">
                  BCB Global ha actualizado su política de red. Actualmente <span className="text-sav-primary">no se generan comisiones</span> por la realización de tareas de los subordinados.
                </p>
              </Card>
            </motion.div>
          )}

          {activeTab === 'retiros' && (
            <motion.div
              key="retiros"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Horario de Retiros</h3>
                <p className="text-[10px] text-sav-muted font-black uppercase tracking-[0.2em]">Días asignados por nivel institucional</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {withdrawalSchedule.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-xs font-black text-white uppercase tracking-widest">{item.level}</span>
                    <Badge variant="info" className="px-3 py-1 font-black">{item.day}</Badge>
                  </div>
                ))}
              </div>
              <Card className="p-4 border-amber-500/20 bg-amber-500/5">
                <div className="flex gap-3">
                  <HelpCircleIcon size={16} className="text-amber-400 shrink-0" />
                  <p className="text-[10px] text-amber-200/80 font-bold uppercase tracking-wide leading-relaxed">
                    Si intentas retirar en un día que no corresponde a tu nivel, el sistema bloqueará la solicitud automáticamente.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <div className="pt-6 space-y-4">
          <Card className="p-8 border-sav-primary/20 bg-sav-primary/5 text-center space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-sav-primary/5 to-transparent opacity-50" />
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sav-primary/10 border border-sav-primary/20">
                <ShieldIcon size={12} className="text-sav-primary" />
                <span className="text-[8px] font-black text-sav-primary uppercase tracking-widest text-white/80">Transparencia Garantizada</span>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black text-white uppercase tracking-[0.3em]">BCB Global Institutional</p>
                <p className="text-[8px] text-sav-muted uppercase tracking-[0.5em] font-bold">Stable Version 7.0.0</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </Layout>
  );
}
