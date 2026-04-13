import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  Eye as EyeIcon, 
  EyeOff as EyeOffIcon, 
  Check as CheckIcon, 
  Upload as UploadIcon, 
  Info as InfoIcon, 
  AlertCircle as AlertCircleIcon, 
  Clock as ClockIcon, 
  Wallet as WalletIcon, 
  Sparkles as SparklesIcon, 
  CheckCircle2 as CheckCircleIcon, 
  ChevronRight as ChevronRightIcon, 
  ArrowUpCircle as ArrowUpCircleIcon, 
  ShieldCheck as ShieldCheckIcon, 
  Loader2 as LoaderIcon, 
  ArrowRight as ArrowRightIcon,
  TrendingUp as TrendingUpIcon, 
  CreditCard as CreditCardIcon, 
  Banknote as BanknoteIcon, 
  QrCode as QrCodeIcon,
  Lock as LockIcon
} from 'lucide-react';
import { isScheduleOpen } from '../lib/schedule';
import imageCompression from 'browser-image-compression';

// UI Components
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Input } from '../components/ui/Input.jsx';
import { cn } from '../lib/utils/cn';

export default function Withdrawal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [montos, setMontos] = useState([25, 100, 500, 1500, 5000, 10000]);
  const [tarjetas, setTarjetas] = useState([]);
  const [tarjetaId, setTarjetaId] = useState('');
  const [tipoBilletera, setTipoBilletera] = useState('principal');
  const [monto, setMonto] = useState(500);
  const [password, setPassword] = useState('');
  const [qrImage, setQrImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pc, setPc] = useState(null);
  const [userLevel, setUserLevel] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [hasWithdrawalToday, setHasWithdrawalToday] = useState(false);
  const [isPunished, setIsPunished] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (user && !user.tiene_password_fondo) {
      navigate('/cambiar-contrasena-fondo');
      return;
    }

    api.get('/users/status-castigo').then(res => {
      if (isMounted) setIsPunished(res.castigado);
    }).catch(() => {});

    api.withdrawals.montos().then(data => {
      if (isMounted) setMontos(data || [25, 100, 500, 1500, 5000, 10000]);
    }).catch(() => {});
    
    api.users.tarjetas().then((list) => {
      if (!isMounted) return;
      setTarjetas(list || []);
      if (list && list.length === 0) {
        navigate('/vincular-tarjeta');
        return;
      }
      if (list && list[0]) setTarjetaId(list[0].id);
    }).catch(() => {
      if (isMounted) setTarjetas([]);
    });

    api.publicContent().then(data => {
      if (isMounted) setPc(data || null);
    }).catch(() => {});

    api.levels.list().then((list) => {
      if (!isMounted) return;
      if (user?.nivel_id && list) {
        const found = list.find(l => l.id === user.nivel_id);
        if (found) setUserLevel(found);
      }
    }).catch(() => {});

    const checkLimit = async () => {
      try {
        const retiros = await api.withdrawals.list();
        if (!isMounted) return;
        const now = new Date();
        const todayStr = new Date(now.toLocaleString('en-US', { timeZone: 'America/La_Paz' })).toISOString().split('T')[0];
        const exists = retiros.some(r => r.estado !== 'rechazado' && r.created_at && r.created_at.split('T')[0] === todayStr);
        setHasWithdrawalToday(exists);
      } catch (err) {}
    };
    checkLimit();

    return () => { isMounted = false; };
  }, [user?.id, navigate]);

  const saldoPrincipal = user?.saldo_principal ?? 0;
  const saldoComisiones = user?.saldo_comisiones ?? 0;
  
  let horarioRet;
  let schedRet = { ok: true };
  
  if (userLevel && userLevel.retiro_horario_habilitado) {
    const diasHabilitados = [];
    let currentDay = userLevel.retiro_dia_inicio;
    const endDay = userLevel.retiro_dia_fin;
    if (currentDay <= endDay) {
      for (let i = currentDay; i <= endDay; i++) diasHabilitados.push(i);
    } else {
      for (let i = currentDay; i <= 6; i++) diasHabilitados.push(i);
      for (let i = 0; i <= endDay; i++) diasHabilitados.push(i);
    }
    horarioRet = {
      enabled: true,
      dias_semana: diasHabilitados,
      hora_inicio: userLevel.retiro_hora_inicio?.substring(0, 5),
      hora_fin: userLevel.retiro_hora_fin?.substring(0, 5)
    };
    schedRet = isScheduleOpen(horarioRet);
  } else if (pc?.horario_retiro) {
    horarioRet = pc.horario_retiro;
    schedRet = isScheduleOpen(horarioRet);
  }

  const fueraHorario = horarioRet?.enabled && !schedRet.ok;
  const msgHorario = !schedRet.ok ? schedRet.message : '';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setIsOptimizing(true);
    try {
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/jpeg', initialQuality: 0.85 };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onload = () => {
        setQrImage(reader.result);
        setIsOptimizing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => { setQrImage(reader.result); setIsOptimizing(false); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) { setError('Ingresa tu contraseña de fondo.'); return; }
    if (!qrImage) { setError('Sube tu código QR.'); return; }
    setLoading(true);
    try {
      await api.withdrawals.create({ monto, tipo_billetera: tipoBilletera, password_fondo: password, qr_retiro: qrImage, tarjeta_id: tarjetaId || undefined });
      navigate('/ganancias');
    } catch (err) {
      setError(err.message || 'Error al solicitar retiro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-sav-dark">
        <Header title="Retiro de Fondos" rightAction={<Link to="/ganancias" className="text-sav-primary text-[9px] font-black uppercase tracking-widest bg-sav-primary/10 px-4 py-2 rounded-xl border border-sav-primary/20">Historial</Link>} />
        
        {/* Background Decor */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-sav-primary/5 to-transparent blur-[120px]" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-sav-accent/5 rounded-full blur-[100px]" />
        </div>

        <main className="px-6 py-8 space-y-10 pb-32 animate-fade">
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="p-5 bg-sav-error/10 border-sav-error/20 flex items-center gap-4 shadow-xl">
                <AlertCircleIcon size={20} className="text-sav-error shrink-0" />
                <p className="text-[10px] text-sav-error font-black uppercase tracking-[0.2em] leading-relaxed">{error}</p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isPunished && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card variant="premium" className="p-8 border-none bg-sav-error/10 flex flex-col items-center gap-4 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-sav-error/20 flex items-center justify-center text-sav-error shadow-inner">
                <AlertCircleIcon size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Retiros Bloqueados</h3>
                <p className="text-[10px] font-bold text-sav-error uppercase tracking-widest leading-relaxed">
                  Sanción activa por cuestionario pendiente.<br/>No puedes retirar hoy.
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {hasWithdrawalToday && (
          <Card className="p-6 border-amber-500/20 bg-amber-500/5 flex items-center gap-4">
            <ClockIcon size={24} className="text-amber-500 shrink-0" />
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-relaxed">
              Ya has realizado un retiro hoy. Intenta de nuevo mañana.
            </p>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Origen de Fondos */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-xl bg-sav-primary/10 flex items-center justify-center text-sav-primary border border-sav-primary/20 shadow-lg">
                <WalletIcon size={16} />
              </div>
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">1. Origen de Fondos</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'principal', label: 'Saldo Principal', val: saldoPrincipal, icon: BanknoteIcon },
                { id: 'comisiones', label: 'Billetera Comisiones', val: saldoComisiones, icon: TrendingUpIcon }
              ].map(b => {
                const Icon = b.icon;
                return (
                  <Card 
                    key={b.id}
                    variant={tipoBilletera === b.id ? 'premium' : 'flat'}
                    className={cn(
                      "p-6 flex items-center justify-between cursor-pointer border transition-all duration-500",
                      tipoBilletera === b.id ? "border-sav-primary/40 bg-sav-primary/10 scale-[1.02] shadow-2xl" : "border-white/5 bg-white/[0.02] hover:bg-white/5"
                    )}
                    onClick={() => setTipoBilletera(b.id)}
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                        tipoBilletera === b.id ? "bg-white/10 text-white" : "bg-sav-primary/5 text-sav-primary"
                      )}>
                        <Icon size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className={cn("text-[9px] font-black uppercase tracking-widest", tipoBilletera === b.id ? "text-white/60" : "text-sav-muted")}>{b.label}</p>
                        <p className="text-2xl font-black text-white tracking-tighter">{b.val.toLocaleString()} <span className="text-[10px] text-white/40 uppercase">BOB</span></p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", 
                      tipoBilletera === b.id ? "border-white bg-white text-sav-primary" : "border-white/10"
                    )}>
                      {tipoBilletera === b.id && <CheckIcon size={14} strokeWidth={4} />}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Monto a Retirar */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sav-accent/10 flex items-center justify-center text-sav-accent border border-sav-accent/20 shadow-lg">
                  <BanknoteIcon size={16} />
                </div>
                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">2. Monto a Retirar</h2>
              </div>
              <Badge variant="info" className="bg-white/5 border-white/10 text-[10px] font-black tracking-widest px-3">BOB</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {montos.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonto(m)}
                  className={cn(
                    "h-16 rounded-[1.5rem] border text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                    monto === m 
                      ? "bg-sav-primary border-sav-primary text-white shadow-[0_15px_30px_rgba(220,38,38,0.2)] scale-[1.05]" 
                      : "bg-white/[0.02] border-white/5 text-sav-muted hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          {/* Verificación QR */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg">
                <QrCodeIcon size={16} />
              </div>
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">3. Verificación QR</h2>
            </div>
            
            <Card 
              variant="outline" 
              className={cn(
                "p-10 border-2 border-dashed flex flex-col items-center justify-center text-center gap-5 relative overflow-hidden group transition-all duration-500 cursor-pointer shadow-2xl",
                qrImage ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10 bg-white/[0.02] hover:border-sav-primary/40 hover:bg-sav-primary/5"
              )}
              onClick={() => fileRef.current?.click()}
            >
              <input type="file" ref={fileRef} className="hidden" onChange={handleFile} accept="image/*" />
              {qrImage ? (
                <>
                  <img src={qrImage} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px]" />
                  <div className="relative z-10 w-24 h-24 rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-2xl">
                    <img src={qrImage} className="w-full h-full object-cover" />
                  </div>
                  <div className="relative z-10 space-y-1">
                    <p className="text-sm font-black text-white uppercase tracking-widest">Código Detectado</p>
                    <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.2em] bg-emerald-500/10 px-4 py-1 rounded-full">Toca para reemplazar</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-sav-muted group-hover:bg-sav-primary group-hover:text-white transition-all duration-500 shadow-inner border border-white/5">
                    {isOptimizing ? <LoaderIcon size={32} className="animate-spin" /> : <UploadIcon size={32} />}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-black text-sav-muted uppercase tracking-[0.2em] group-hover:text-white transition-colors">Sube tu código de cobro</p>
                    <p className="text-[9px] text-white/10 font-bold uppercase tracking-[0.3em]">Soporta Yape, Bancos, QR</p>
                  </div>
                </>
              )}
            </Card>
          </section>

          {/* Seguridad */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg">
                <LockIcon size={16} />
              </div>
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">4. Confirmación Segura</h2>
            </div>
            <Input
              type="password"
              placeholder="Contraseña de retiro"
              value={password}
              onChange={e => setPassword(e.target.value)}
              showPasswordToggle
              icon={ShieldCheckIcon}
              className="h-16 rounded-2xl bg-white/[0.02] border-white/5"
            />
          </section>

          <div className="pt-4">
            <Button 
              type="submit" 
              loading={loading} 
              disabled={fueraHorario || hasWithdrawalToday || isPunished || !qrImage || !password}
              className="h-20 w-full rounded-[2rem] text-sm tracking-[0.3em] shadow-[0_25px_50px_-12px_rgba(220,38,38,0.4)] active:scale-95 transition-all uppercase"
            >
              SOLICITAR RETIRO
            </Button>
          </div>

          <Card className="p-6 bg-sav-primary/5 border-sav-primary/10 rounded-[2rem] flex items-start gap-4">
            <InfoIcon size={20} className="text-sav-primary shrink-0" />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Información de Procesamiento</p>
              <p className="text-[9px] text-sav-muted font-bold uppercase tracking-[0.1em] leading-relaxed">
                Los retiros se procesan de lunes a viernes en un plazo de 2 a 24 horas. 
                Asegúrate de que tu QR sea legible y pertenezca a la cuenta vinculada.
              </p>
            </div>
          </Card>
        </form>
      </main>
    </div>
  </Layout>
);
}
