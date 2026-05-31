import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home as HomeIcon, Users as UsersIcon, Gem as GemIcon, Wallet as WalletIcon, User as UserIcon, ClipboardList } from 'lucide-react';
import FloatingQuestionnaire from './FloatingQuestionnaire.jsx';
import { cn } from '../lib/utils/cn';

const navItems = [
  { to: '/', icon: HomeIcon, label: 'Inicio' },
  { to: '/tareas', icon: ClipboardList, label: 'Tareas' },
  { to: '/vip', icon: GemIcon, label: 'VIP' },
  { to: '/equipo', icon: UsersIcon, label: 'Mi Equipo' },
  { to: '/usuario', icon: UserIcon, label: 'Perfil' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="app-container min-h-screen bg-sav-bg text-sav-text-main font-sans">
      {/* Flutter Ambient Background - Light & Fresh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[40%] bg-sav-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[5%] right-[-5%] w-[40%] h-[40%] bg-sav-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="flex-1 relative z-10 overflow-x-hidden no-scrollbar pb-[calc(100px+env(safe-area-inset-bottom))]">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.main>
      </div>

      <FloatingQuestionnaire />

      {!isAuthPage && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-md h-20 bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-black/[0.03] z-50 flex items-center justify-around px-2 shadow-[0_15px_40px_rgba(0,0,0,0.08)]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 h-full",
                  isActive ? "text-sav-primary" : "text-sav-muted"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-x-2 inset-y-2 bg-sav-primary/5 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
                  />
                )}
                
                <div className={cn(
                  "transition-all duration-500",
                  isActive ? "scale-110 -translate-y-0.5" : "scale-100"
                )}>
                  <Icon className={cn(
                    "w-6 h-6 transition-all duration-300",
                    isActive ? "text-sav-primary drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" : ""
                  )} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-300",
                  isActive ? "opacity-100 scale-105" : "opacity-60"
                )}>
                  {item.label}
                </span>

                {isActive && (
                  <motion.div 
                    layoutId="nav-dot"
                    className="w-1 h-1 bg-sav-primary rounded-full absolute bottom-2"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
