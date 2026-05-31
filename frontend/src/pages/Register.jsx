import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, User, Lock, ArrowRight, ChevronRight, UserPlus, Phone } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { PhoneInputWithCountry } from '../components/ui/PhoneInputWithCountry.jsx';
import { Card } from '../components/ui/Card.jsx';
import { cn } from '../lib/utils/cn';

export default function Register() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    telefono: '',
    password: '',
    confirm_password: '',
    codigo_invitacion: searchParams.get('ref') || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    
    if (formData.password !== formData.confirm_password) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-sav-bg relative overflow-hidden py-12">
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
            REGISTRO <span className="text-sav-primary">GLOBAL</span>
          </h1>
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-2 h-2 bg-sav-accent rounded-full animate-pulse shadow-accent-glow" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sav-muted">AFILIACIÓN INSTITUCIONAL</p>
          </div>
        </div>

        <Card variant="premium" className="p-10 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="space-y-5">
              <Input
                label="Nombre de Socio"
                value={formData.nombre_usuario}
                onChange={(e) => setFormData({ ...formData, nombre_usuario: e.target.value })}
                placeholder="Ej: Juan Perez"
                icon={User}
                required
              />

              <div className="space-y-2">
                 <label className="text-[11px] font-black text-sav-muted uppercase tracking-widest ml-1">Línea Móvil</label>
                 <PhoneInputWithCountry
                   value={formData.telefono}
                   onChange={(tel) => setFormData({ ...formData, telefono: tel })}
                   error={error}
                   placeholder="Número de celular"
                 />
              </div>

              <Input
                label="Contraseña de Acceso"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Crea una clave"
                icon={Lock}
                showPasswordToggle
                required
              />

              <Input
                label="Confirmar Clave"
                type="password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                placeholder="Repite la clave"
                icon={ShieldCheck}
                showPasswordToggle
                required
              />

              <Input
                label="Código de Invitación"
                value={formData.codigo_invitacion}
                onChange={(e) => setFormData({ ...formData, codigo_invitacion: e.target.value })}
                placeholder="ID de Invitado"
                icon={UserPlus}
                required
              />
            </div>

            <Button 
              type="submit" 
              loading={loading}
              className="w-full h-16 shadow-accent-glow uppercase tracking-[0.2em] text-[15px] mt-4"
              icon={ArrowRight}
            >
              CREAR CUENTA AHORA
            </Button>
          </form>
        </Card>

        <div className="mt-12 text-center space-y-5">
          <p className="text-[10px] font-black text-sav-muted uppercase tracking-[0.4em]">
            ¿YA TIENES CUENTA?
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2.5 py-4 px-8 rounded-2xl bg-white border border-black/[0.03] text-sav-primary font-black uppercase tracking-[0.2em] text-[11px] shadow-sm hover:shadow-m3-1 transition-all group active:scale-95"
          >
            INICIAR SESIÓN
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
