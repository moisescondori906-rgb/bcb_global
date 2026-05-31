import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, Lock, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { PhoneInputWithCountry } from '../components/ui/PhoneInputWithCountry.jsx';
import { Card } from '../components/ui/Card.jsx';
import { APP_DISPLAY_NAME } from '../theme/branding.js';

export default function Login() {
  const [numero, setNumero] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.rol === 'admin' ? '/admin' : '/', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const telefono = numero.trim();
      const user = await login(telefono, password);
      navigate(user?.rol === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-sav-dark relative overflow-hidden">
      {/* Premium Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-sav-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sav-secondary/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block mb-6 p-1 rounded-2xl bg-gradient-to-tr from-sav-accent to-sav-secondary shadow-accent-glow"
          >
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
              <img src="/imag/logo.webp" alt="Logo" className="w-16 h-16" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 uppercase">
            BCB <span className="text-gradient">GLOBAL</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-sav-accent rounded-full animate-pulse shadow-accent-glow" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-sav-muted">Portal de Inversión 2026</p>
          </div>
        </div>

        <Card className="p-8 space-y-6 bg-zinc-950/60 backdrop-blur-3xl border border-white/10 shadow-m3-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode='wait'>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <PhoneInputWithCountry
              value={numero}
              onChange={(telefono) => setNumero(telefono)}
              error={error}
              placeholder="Número de celular"
            />

            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              icon={Lock}
              showPasswordToggle
              required
            />

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="hidden" 
                />
                <div className={cn(
                  "w-5 h-5 rounded-lg border transition-all flex items-center justify-center shadow-m3-1",
                  rememberMe ? 'bg-sav-accent border-sav-accent' : 'bg-white/5 border-white/10'
                )}>
                  {rememberMe && <CheckIcon size={12} className="text-white" strokeWidth={4} />}
                </div>
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">Recordarme</span>
              </label>
              <button type="button" className="text-[11px] font-bold text-sav-accent uppercase tracking-widest hover:brightness-125 transition-all">Soporte</button>
            </div>

            <Button 
              type="submit" 
              loading={loading}
              className="w-full h-14 shadow-accent-glow uppercase tracking-[0.2em]"
              icon={ArrowRight}
            >
              ACCEDER AHORA
            </Button>
          </form>
        </Card>

        <div className="mt-10 text-center space-y-4">
          <p className="text-[10px] font-bold text-sav-muted uppercase tracking-[0.3em]">
            ¿NUEVO EN EL SISTEMA?
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 text-sav-accent font-bold uppercase tracking-[0.15em] text-xs hover:brightness-125 transition-all group"
          >
            CREAR CUENTA PREMIUM
            <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
