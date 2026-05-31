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
    default: 'bg-sav-card border border-black/[0.03] rounded-m3 p-6 sm:p-8 shadow-m3-1 hover:shadow-m3-2 transition-all duration-500',
    flat: 'bg-sav-surface rounded-m3 p-6 sm:p-8',
    outline: 'bg-transparent border border-black/[0.05] rounded-m3 p-6 sm:p-8 hover:bg-sav-card transition-colors',
    premium: 'bg-white rounded-m3-lg p-8 sm:p-10 shadow-m3-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-1.5 before:h-full before:bg-gradient-to-b before:from-sav-primary before:to-sav-accent',
    glass: 'bg-white/60 backdrop-blur-xl border border-white/40 rounded-m3 p-6 sm:p-8 shadow-m3-2'
  };

  const Component = animate ? motion.div : 'div';
  const animProps = animate ? {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
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
