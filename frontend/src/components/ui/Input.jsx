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
    <div className={cn("space-y-2.5 w-full", className)}>
      {label && (
        <label className="flex items-center gap-2.5 text-[11px] font-bold text-sav-muted uppercase tracking-[0.15em] ml-1.5">
          {Icon && <Icon size={13} className="text-sav-primary" strokeWidth={2.5} />}
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          type={finalType}
          className={cn(
            "h-13 sm:h-14 w-full px-6 rounded-m3 bg-white border border-black/[0.05] text-sav-text-main text-[15px] font-medium focus:border-sav-primary/50 focus:ring-4 focus:ring-sav-primary/10 transition-all outline-none placeholder:text-slate-300 shadow-sm hover:border-black/[0.1]",
            error && "border-sav-error/50 bg-sav-error/5",
            showPasswordToggle && "pr-16"
          )}
          {...props}
        />
        {showPasswordToggle && isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sav-primary transition-colors p-2.5"
          >
            {showPass ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[10px] font-bold text-sav-error uppercase tracking-[0.12em] ml-1.5 animate-in">
          {error}
        </p>
      )}
    </div>
  );
}
