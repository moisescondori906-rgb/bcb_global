import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { Smartphone, User, Lock, Key, ArrowRight, ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { PhoneInputWithCountry } from '../components/ui/PhoneInputWithCountry.jsx';
import { Card } from '../components/ui/Card.jsx';

export default function Register() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');

  const [data, setData] = useState({
    telefono: '',
    nombre_usuario: '',
    password: '',
    repeat_password: '',
    codigo_invitacion: refCode || '',
  });

  useEffect(() => {
    if (refCode) {
      setData(prev => ({ ...prev, codigo_invitacion: refCode }));
    }
  }, [refCode]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (data.password !== data.repeat_password) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const inviteCode = String(data.codigo_invitacion || '').trim().toUpperCase();
      await register({
        telefono: data.telefono.trim(),
        nombre_usuario: data.nombre_usuario,
        password: data.password,
        codigo_invitacion: inviteCode,
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al registrarse');
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
        className="w-full max-w-sm relative z-10 py-10"
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
            REGISTRO <span className="text-gradient">GLOBAL</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-sav-accent rounded-full animate-pulse shadow-accent-glow" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-sav-muted">Nueva Cuenta Institucional</p>
          </div>
        </div>

        <Card className="p-8 bg-zinc-950/60 backdrop-blur-3xl border border-white/10 shadow-m3-3">
          <form onSubmit={handleSubmit} className="space-y-5">
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
              value={data.telefono}
              onChange={(telefono) => handleChange('telefono', telefono)}
              error={error}
              placeholder="Número de celular"
            />

            <Input
              value={data.nombre_usuario}
              onChange={(e) => handleChange('nombre_usuario', e.target.value)}
              placeholder="Nombre de Usuario"
              icon={User}
              required
            />

            <Input
              type="password"
              value={data.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Contraseña"
              icon={Lock}
              showPasswordToggle
              required
            />

            <Input
              type="password"
              value={data.repeat_password}
              onChange={(e) => handleChange('repeat_password', e.target.value)}
              placeholder="Confirmar Contraseña"
              icon={ShieldCheck}
              required
            />

            <Input
              value={data.codigo_invitacion}
              onChange={(e) => handleChange('codigo_invitacion', e.target.value)}
              placeholder="Código de Invitación"
              icon={Key}
              readOnly={!!refCode}
              required
            />

            <Button 
              type="submit" 
              loading={loading}
              className="w-full h-14 shadow-accent-glow uppercase tracking-[0.2em] mt-2"
              icon={ArrowRight}
            >
              REGISTRARME AHORA
            </Button>
          </form>
        </Card>

        <div className="mt-10 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-widest text-[10px] hover:text-sav-accent transition-all group"
          >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Ya tengo una cuenta activa
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
