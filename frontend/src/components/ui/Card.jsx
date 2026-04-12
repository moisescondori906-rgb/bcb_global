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
    default: 'glass-card p-6 shadow-2xl',
    flat: 'bg-sav-surface border border-sav-border rounded-3xl p-6',
    outline: 'bg-transparent border border-sav-border rounded-3xl p-6',
    premium: 'glass-card p-6 border-sav-primary/20 shadow-[0_0_40px_rgba(220,38,38,0.1)]'
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
