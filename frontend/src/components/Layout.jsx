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
    <div className="app-container">
      {/* Flutter Style Background - Soft and Professional */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-sav-dark">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-sav-primary/5 to-transparent" />
      </div>

      <div className="flex-1 relative z-10 overflow-x-hidden no-scrollbar pb-[calc(85px+env(safe-area-inset-bottom))]">
        {children}
      </div>

      <FloatingQuestionnaire />

      {!isAuthPage && (
        <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/98 backdrop-blur-xl py-3 px-2 z-50 flex items-center justify-around border-t border-sav-border shadow-m3-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "nav-item group relative flex-1 flex flex-col items-center justify-center transition-all duration-300",
                  isActive ? "text-sav-primary" : "text-sav-muted"
                )}
              >
                <div className={cn(
                  "transition-all duration-300 px-5 py-1.5 rounded-full mb-1",
                  isActive ? "bg-sav-surface" : "bg-transparent hover:bg-sav-surface/50"
                )}>
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest transition-colors",
                  isActive ? "text-sav-primary" : "text-sav-muted"
                )}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
