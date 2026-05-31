import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, Lock, ArrowRight, ChevronRight, Check } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { PhoneInputWithCountry } from '../components/ui/PhoneInputWithCountry.jsx';
import { Card } from '../components/ui/Card.jsx';
import { cn } from '../lib/utils/cn';

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-sav-bg relative overflow-hidden">
      {/* Flutter Ambient Background - Light & Fresh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-sav-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sav-accent/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block mb-8 p-1 rounded-[2.5rem] bg-gradient-to-tr from-sav-primary to-sav-accent shadow-accent-glow"
          >
            <div className="bg-white p-5 rounded-[2.2rem] border border-white/20">
              <img src="/imag/logo.webp" alt="Logo" className="w-20 h-20" />
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-black tracking-tighter text-sav-text-main mb-2 uppercase">
            BCB <span className="text-sav-primary">GLOBAL</span>
          </h1>
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sav-muted">SISTEMA INSTITUCIONAL</p>
          </div>
        </div>

        <Card variant="premium" className="p-10 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <AnimatePresence mode='wait'>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[11px] font-black text-sav-muted uppercase tracking-widest ml-1">Línea Móvil</label>
                 <PhoneInputWithCountry
                   value={numero}
                   onChange={(telefono) => setNumero(telefono)}
                   error={error}
                   placeholder="Número de celular"
                 />
              </div>

              <Input
                label="Contraseña de Acceso"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu clave"
                icon={Lock}
                showPasswordToggle
                required
              />
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="hidden" 
                />
                <div className={cn(
                  "w-6 h-6 rounded-xl border-2 transition-all flex items-center justify-center shadow-sm",
                  rememberMe ? 'bg-sav-primary border-sav-primary' : 'bg-sav-surface border-black/[0.05]'
                )}>
                  {rememberMe && <Check size={14} className="text-white" strokeWidth={4} />}
                </div>
                <span className="text-[11px] font-black text-sav-muted uppercase tracking-widest group-hover:text-sav-text-main transition-colors">Recordarme</span>
              </label>
              <button type="button" className="text-[11px] font-black text-sav-primary uppercase tracking-widest hover:brightness-110 transition-all">Soporte</button>
            </div>

            <Button 
              type="submit" 
              loading={loading}
              className="w-full h-16 shadow-accent-glow uppercase tracking-[0.2em] text-[15px]"
              icon={ArrowRight}
            >
              ACCEDER AL PANEL
            </Button>
          </form>
        </Card>

        <div className="mt-12 text-center space-y-5">
          <p className="text-[10px] font-black text-sav-muted uppercase tracking-[0.4em]">
            ¿NUEVO EN EL SISTEMA?
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2.5 py-4 px-8 rounded-2xl bg-white border border-black/[0.03] text-sav-primary font-black uppercase tracking-[0.2em] text-[11px] shadow-sm hover:shadow-m3-1 transition-all group active:scale-95"
          >
            CREAR CUENTA PREMIUM
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
