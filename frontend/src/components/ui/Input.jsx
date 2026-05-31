import { useState } from 'react';
import { Eye as EyeIcon, EyeOff as EyeOffIcon } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export function Input({ 
  label, 
  error, 
  type = 'text', 
  icon: Icon, 
  className, 
  showPasswordToggle,
  ...props 
}) {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';
  const finalType = isPassword && showPass ? 'text' : type;

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {label && (
        <label className="flex items-center gap-2 text-[11px] font-bold text-sav-muted uppercase tracking-[0.15em] ml-1">
          {Icon && <Icon size={12} className="text-sav-accent" />}
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          type={finalType}
          className={cn(
            "h-12 sm:h-13 w-full px-5 rounded-m3 bg-white/[0.03] border border-white/[0.08] text-white text-[14px] font-medium focus:border-sav-accent/50 focus:ring-4 focus:ring-sav-accent/10 transition-all outline-none placeholder:text-zinc-600 hover:border-white/[0.15]",
            error && "border-sav-error/50 bg-sav-error/5",
            showPasswordToggle && "pr-14"
          )}
          {...props}
        />
        {showPasswordToggle && isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-2"
          >
            {showPass ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[10px] font-bold text-sav-error uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
