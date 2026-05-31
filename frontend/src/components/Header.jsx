import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils/cn';

export default function Header({ title, rightAction, backTo, transparent = false }) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      if (window.history.state?.idx === 0) {
        navigate('/', { replace: true });
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300",
      transparent ? "bg-transparent" : "bg-sav-dark/40 backdrop-blur-xl border-b border-white/[0.05]"
    )}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <button
          type="button"
          onClick={handleBack}
          className="group flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white active:scale-90 transition-all hover:bg-white/10 shadow-m3-1"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        
        <div className="flex flex-col min-w-0">
          <h1 className="font-bold text-white text-[13px] uppercase tracking-[0.2em] truncate">
            {title}
          </h1>
          <div className="h-1 w-8 bg-gradient-to-r from-sav-accent to-sav-secondary rounded-full mt-1 opacity-80" />
        </div>
      </div>
      
      {rightAction && (
        <div className="flex justify-end ml-4">
          {rightAction}
        </div>
      )}
    </header>
  );
}
