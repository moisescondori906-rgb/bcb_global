import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils/cn';

export default function ActionGrid({ items }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemAnim = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-3 gap-4"
    >
      {items.map((item, idx) => {
        const { to, icon: Icon, label, badge } = item;
        return (
          <motion.div key={idx} variants={itemAnim}>
            <Link
              to={to}
              className="group flex flex-col items-center gap-3 p-4 rounded-m3 border border-white/[0.05] bg-white/[0.02] transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1] active:scale-95"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-white/5 to-white/[0.01] border border-white/5 flex items-center justify-center text-sav-accent transition-all duration-300 group-hover:scale-110 group-hover:text-white group-hover:shadow-accent-glow">
                <Icon size={24} strokeWidth={2} />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors text-center leading-tight">
                  {label}
                </span>
                {badge}
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
