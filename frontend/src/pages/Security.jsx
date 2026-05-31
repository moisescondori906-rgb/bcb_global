import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { User, Phone, CreditCard, Lock, ChevronRight, Sparkles, ShieldCheck, BadgeCheck, Zap } from 'lucide-react';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { cn } from '../lib/utils/cn';
import { displayLevelCode } from '../lib/displayLevel.js';

export default function Security() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tarjetas, setTarjetas] = useState([]);
  const [componentLoading, setComponentLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null); // Clear previous errors
    try {
      const data = await api.users.tarjetas();
      setTarjetas(data);
    } catch (err) {
      console.error("Error loading tarjetas:", err);
      setError("No se pudieron cargar las cuentas bancarias. Intenta de nuevo más tarde.");
      setTarjetas([]); // Ensure tarjetas is empty on error
    } finally {
      setComponentLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      load();
    } else {
      setComponentLoading(false);
    }
  }, [user]);

  if (!user || componentLoading) {
    return (
      <Layout>
        <Header title="Seguridad Premium" />
        <main className="p-5 space-y-6 pb-32 animate-fade flex items-center justify-center min-h-[70vh]">
          <div className="w-16 h-16 border-4 border-white/5 border-t-sav-accent rounded-full animate-spin" />
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Seguridad Premium" />
      <main className="p-5 space-y-8 pb-32 animate-in">
        {error && (
          <div className="bg-red-500/5 border border-red-500/10 text-red-400 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center" role="alert">
            {error}
          </div>
        )}
        
        {/* User Identity Card - Ultra Modern */}
        <section>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-sav-accent to-sav-secondary rounded-m3-lg blur opacity-20 transition duration-1000 group-hover:opacity-40"></div>
            <Card className="relative p-8 bg-zinc-950/60 backdrop-blur-3xl border border-white/10 rounded-m3-lg overflow-hidden shadow-m3-3">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-sav-accent/20 rounded-full blur-[60px]" />
              
              <div className="flex flex-col items-center relative z-10 text-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-tr from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center shadow-xl">
                    <User size={40} className="text-white" strokeWidth={2} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-sav-accent rounded-xl border-4 border-zinc-950 flex items-center justify-center shadow-accent-glow">
                    <ShieldCheck size={16} className="text-white" strokeWidth={3} />
                  </div>
                </div>
                
                <div className="space-y-1.5 min-w-0">
                  <h2 className="text-2xl font-bold tracking-tight truncate text-white uppercase">{user?.nombre_usuario}</h2>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="info" className="py-0.5 px-2">
                      {displayLevelCode(user?.nivel_codigo || 'internar')}
                    </Badge>
                    <span className="text-[10px] font-bold text-sav-muted uppercase tracking-widest">ID: {user?.id?.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Data Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={16} className="text-sav-accent" />
            <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Datos de Identidad</h3>
          </div>
          
          <div className="grid gap-3">
            <Card className="p-5 flex items-center justify-between group bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <Phone size={22} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mb-0.5">Línea Móvil</p>
                  <p className="text-sm font-bold text-white tracking-tight">{user?.telefono || '—'}</p>
                </div>
              </div>
              <Badge variant="success" className="text-[8px] py-0.5">VERIFICADO</Badge>
            </Card>

            <Card className="p-5 flex items-center justify-between group bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sav-secondary/10 flex items-center justify-center text-sav-secondary border border-sav-secondary/20">
                  <User size={22} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mb-0.5">Nombre Institucional</p>
                  <p className="text-sm font-bold text-white tracking-tight">{user?.nombre_real || 'No configurado'}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
            </Card>
          </div>
        </section>

        {/* Financial Accounts */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-sav-accent" />
              <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Cuentas de Retiro</h3>
            </div>
            <Link to="/vincular-tarjeta" className="text-[10px] font-bold text-sav-accent uppercase tracking-widest flex items-center gap-1 hover:brightness-125 transition-all">
              + Vincular <ChevronRight size={14} />
            </Link>
          </div>

          {tarjetas.length === 0 ? (
            <Card className="p-10 text-center border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center gap-4 group hover:border-white/20 transition-all">
              <CreditCard size={32} className="text-zinc-700 group-hover:text-sav-accent transition-colors" />
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">No tienes cuentas vinculadas para retiros.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {tarjetas.map((t) => (
                <Card key={t.id} className="p-5 flex items-center justify-between bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                      <BuildingIcon size={22} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest mb-0.5">
                        {t.tipo === 'qr' ? 'BANCO / QR' : (t.nombre_banco || 'BANCO')}
                      </p>
                      <p className="text-sm font-bold text-white tracking-[0.1em]">****{t.numero_masked}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-[8px] py-0.5">ACTIVA</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Security Management */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Lock size={16} className="text-sav-accent" />
            <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Gestión de Seguridad</h3>
          </div>

          <div className="bg-white/[0.02] rounded-m3-lg border border-white/10 overflow-hidden divide-y divide-white/5">
            <Link to="/cambiar-contrasena" className="flex items-center justify-between p-5 hover:bg-white/[0.05] transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-sav-accent/10 flex items-center justify-center text-sav-accent border border-sav-accent/20 transition-all group-hover:scale-110">
                  <Lock size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white uppercase tracking-widest mb-0.5">Acceso al Sistema</p>
                  <p className="text-[9px] font-medium text-sav-muted uppercase tracking-widest">Actualizar contraseña login</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
            </Link>

            <Link to="/cambiar-contrasena-fondo" className="flex items-center justify-between p-5 hover:bg-white/[0.05] transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 transition-all group-hover:scale-110">
                  <Zap size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white uppercase tracking-widest mb-0.5">PIN de Transacciones</p>
                  <p className="text-[9px] font-medium text-sav-muted uppercase tracking-widest">
                    {user?.tiene_password_fondo ? 'Actualizar código PIN' : 'Configurar por primera vez'}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </section>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full h-14 rounded-m3 bg-red-500/5 border border-red-500/10 text-red-500 flex items-center justify-center gap-3 hover:bg-red-500/10 transition-all shadow-m3-1 active:scale-[0.98] group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[12px] font-bold uppercase tracking-[0.2em]">Finalizar Conexión</span>
        </button>
      </main>
    </Layout>
  );

      </main>
    </Layout>
  );
}
