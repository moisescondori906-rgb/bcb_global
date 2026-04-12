import { cn } from '../../lib/utils/cn';

export function Badge({ 
  children, 
  variant = 'success', 
  className, 
  icon: Icon, 
  ...props 
}) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-sav-error/10 text-sav-error border-sav-error/20',
    info: 'bg-sav-primary/10 text-sav-accent border-sav-primary/20',
    muted: 'bg-sav-surface text-sav-muted border-sav-border'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest',
        variants[variant],
        className
      )}
      {...props}
    >
      {Icon && <Icon size={10} strokeWidth={3} />}
      {children}
    </div>
  );
}
