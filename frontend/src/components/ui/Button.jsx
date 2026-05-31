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
    primary: 'bg-gradient-to-r from-sav-accent to-sav-secondary text-white shadow-accent-glow hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]',
    secondary: 'bg-white/5 border border-white/10 text-white hover:bg-white/10 backdrop-blur-md',
    ghost: 'bg-transparent hover:bg-white/5 text-sav-muted hover:text-white',
    danger: 'bg-gradient-to-r from-sav-error to-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]'
  };

  return (
    <button
      className={cn(
        'h-12 sm:h-13 px-6 rounded-m3 flex items-center justify-center gap-2.5 font-bold text-[13px] sm:text-[14px] uppercase tracking-[0.1em] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        loading && 'opacity-70',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon size={18} className="transition-transform group-hover:scale-110" />}
          {children}
        </>
      )}
    </button>
  );
}
