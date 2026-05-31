import { cn } from '../../lib/utils/cn';

export function Badge({ 
  children, 
  variant = 'success', 
  className, 
  icon: Icon, 
  ...props 
}) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
    error: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    muted: 'bg-white/5 text-zinc-400 border-white/10'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm',
        variants[variant],
        className
      )}
      {...props}
    >
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {children}
    </div>
  );
}
