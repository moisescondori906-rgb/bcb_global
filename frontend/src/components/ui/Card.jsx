import { cn } from '../../lib/utils/cn';
import { motion } from 'framer-motion';

export function Card({ 
  children, 
  className, 
  variant = 'default', 
  animate = true, 
  delay = 0,
  ...props 
}) {
  const variants = {
    default: 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-m3 p-5 sm:p-7 shadow-m3-2 hover:border-white/[0.15] transition-all duration-300',
    flat: 'bg-sav-surface/50 border border-white/[0.05] rounded-m3 p-5 sm:p-7',
    outline: 'bg-transparent border border-white/[0.1] rounded-m3 p-5 sm:p-7',
    premium: 'bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-2xl border border-white/[0.1] rounded-m3 p-5 sm:p-7 shadow-m3-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-gradient-to-r before:from-sav-accent before:to-sav-secondary'
  };

  const Component = animate ? motion.div : 'div';
  const animProps = animate ? {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.4 }
  } : {};

  return (
    <Component
      className={cn(variants[variant], className)}
      {...animProps}
      {...props}
    >
      {children}
    </Component>
  );
}
