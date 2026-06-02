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
    default: 'bg-white border-2 border-slate-200 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 shadow-xl shadow-slate-200/60',
    flat: 'bg-slate-50 border-2 border-slate-300 rounded-[1.2rem] sm:rounded-[2rem] p-4 sm:p-6',
    outline: 'bg-transparent border-2 border-slate-300 rounded-[1.2rem] sm:rounded-[2rem] p-4 sm:p-6',
    premium: 'bg-white border-2 border-slate-200 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 shadow-xl shadow-slate-200/60 border-t-bcb-primary/80'
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

