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
    default: 'bg-white border border-sav-border rounded-m3 p-5 sm:p-7 shadow-m3-1 hover:shadow-m3-2 transition-shadow duration-300',
    flat: 'bg-sav-surface border border-sav-border/50 rounded-m3 p-5 sm:p-7',
    outline: 'bg-transparent border border-sav-border rounded-m3 p-5 sm:p-7',
    premium: 'bg-white border border-sav-border rounded-m3 p-5 sm:p-7 shadow-m3-2 relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-sav-primary'
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
