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
    primary: 'bg-sav-primary text-white shadow-accent-glow hover:bg-sav-primary/90 active:scale-[0.97]',
    secondary: 'bg-sav-surface text-sav-text-main border border-black/[0.03] hover:bg-slate-200 active:scale-[0.97]',
    ghost: 'bg-transparent hover:bg-sav-surface text-sav-muted hover:text-sav-text-main',
    danger: 'bg-sav-error/10 text-sav-error border border-sav-error/20 hover:bg-sav-error/20 active:scale-[0.97]',
    success: 'bg-sav-success text-white shadow-success-glow hover:bg-sav-success/90 active:scale-[0.97]'
  };

  return (
    <button
      className={cn(
        'h-12 sm:h-14 px-8 rounded-m3 flex items-center justify-center gap-3 font-bold text-[13px] sm:text-[14px] uppercase tracking-[0.12em] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none group',
        variants[variant],
        loading && 'opacity-70',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon size={18} className="transition-transform group-hover:scale-110 group-active:scale-95" strokeWidth={2.5} />}
          {children}
        </>
      )}
    </button>
  );
}
