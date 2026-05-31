import { cn } from '../../lib/utils/cn';

export function Button({ 
  children, 
  variant = 'primary', 
  className, 
  loading, 
  disabled, 
  icon: Icon, 
  ...props 
}) {
  const variants = {
    primary: 'h-12 sm:h-13 w-full flex items-center justify-center gap-2.5 rounded-m3 bg-sav-primary text-white font-black text-[13px] sm:text-[14px] uppercase tracking-[0.08em] transition-all shadow-m3-2 hover:shadow-m3-3 active:translate-y-0.5 hover:brightness-110',
    secondary: 'h-12 sm:h-13 w-full flex items-center justify-center gap-2.5 rounded-m3 bg-white border-2 border-sav-border text-sav-primary font-black text-[13px] sm:text-[14px] uppercase tracking-[0.08em] transition-all shadow-m3-1 hover:bg-sav-surface',
    ghost: 'bg-transparent hover:bg-sav-primary/10 text-sav-primary font-black px-5 py-2.5 text-[13px] sm:text-[14px] uppercase tracking-[0.1em] rounded-m3-sm',
    danger: 'h-12 sm:h-13 w-full flex items-center justify-center gap-2.5 rounded-m3 bg-sav-error text-white font-black text-[13px] sm:text-[14px] uppercase tracking-[0.08em] shadow-m3-2 hover:brightness-110'
  };

  return (
    <button
      className={cn(
        'relative overflow-hidden font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2',
        variants[variant],
        loading && 'opacity-70 pointer-events-none',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-sav-primary/30 border-t-sav-primary rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon size={20} />}
          {children}
        </>
      )}
    </button>
  );
}
