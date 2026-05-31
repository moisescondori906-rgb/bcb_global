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
  Lock as LockIcon,
  Plus as PlusIcon,
  Building2 as BuildingIcon,
  User,
  Crown
} from 'lucide-react';
import { isScheduleOpen, getperuNow as getBoliviaNow } from '../lib/schedule';
import imageCompression from 'browser-image-compression';

// UI Components
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Input } from '../components/ui/Input.jsx';
import { cn } from '../lib/utils/cn';

export default function Withdrawal() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [montos, setMontos] = useState([25, 100, 500, 1500, 5000, 10000]);
  const [tarjetas, setTarjetas] = useState([]);
  const [tarjetaId, setTarjetaId] = useState('');
  const [tipoBilletera, setTipoBilletera] = useState('principal');
  const [monto, setMonto] = useState(500);
  const [password, setPassword] = useState('');
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pc, setPc] = useState(null);
  const [userLevel, setUserLevel] = useState(null);
  const [niveles, setNiveles] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [hasWithdrawalToday, setHasWithdrawalToday] = useState(false);
  
  // Security Status State
  const [securityStatus, setSecurityStatus] = useState({
    tiene_password_fondo: true,
    tiene_cuenta_bancaria: true,
    loading: true
  });

  // Fund Password Setup State
  const [fundPass, setFundPass] = useState({ password_fondo: '', confirm_password_fondo: '' });
  
  // Bank Account Setup State
  const [bankAcc, setBankAcc] = useState({ banco: 'bnb', titular: '', numero_cuenta: '', tipo_cuenta: 'Caja de ahorro', ci_nit: '' });

  const fetchSecurityStatus = async () => {
    try {
      const status = await api.users.securityStatus();
      setSecurityStatus({ ...status, loading: false });
      return status;
    } catch (err) {
      console.error('Error fetching security status:', err);
      setSecurityStatus(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const status = await fetchSecurityStatus();
      
      if (status?.tiene_password_fondo && status?.tiene_cuenta_bancaria) {
        api.withdrawals.montos().then(data => {
          if (isMounted) setMontos(data || [25, 100, 500, 1500, 5000, 10000]);
        }).catch(() => {});
        
        api.users.getBankAccounts().then((list) => {
          if (!isMounted) return;
          setTarjetas(list || []);
          if (list && list[0]) setTarjetaId(list[0].id);
        }).catch(() => {
          if (isMounted) setTarjetas([]);
        });

        const withdrawalsRes = await api.withdrawals.list().catch(() => []);
        if (isMounted) {
          const boliviaNow = getBoliviaNow();
          const todayStr = boliviaNow.getFullYear() + '-' + String(boliviaNow.getMonth() + 1).padStart(2, '0') + '-' + String(boliviaNow.getDate()).padStart(2, '0');
          const alreadyDone = Array.isArray(withdrawalsRes) && withdrawalsRes.some(w => w.estado !== 'rechazado' && w.created_at && w.created_at.split('T')[0] === todayStr);
          setHasWithdrawalToday(alreadyDone);
        }
      }
    };

    api.publicContent().then(data => {
      if (isMounted) setPc(data || null);
    }).catch(() => {});

    api.levels.list().then((list) => {
      if (!isMounted) return;
      setNiveles(list || []);
      if (user?.nivel_id && list) {
        const found = list.find(l => String(l.id) === String(user.nivel_id));
        if (found) setUserLevel(found);
      }
    }).catch(() => {});

    init();

    return () => { isMounted = false; };
  }, [user?.id]);

  const handleFundPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.users.setFundPassword(fundPass);
      await refreshUser();
      await fetchSecurityStatus();
    } catch (err) {
      setError(err.message || 'Error al configurar contraseña de fondos');
    } finally {
      setLoading(false);
    }
  };

  const handleBankAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.users.createBankAccount(bankAcc);
      await fetchSecurityStatus();
      const list = await api.users.getBankAccounts();
      setTarjetas(list || []);
      if (list && list[0]) setTarjetaId(list[0].id);
    } catch (err) {
      setError(err.message || 'Error al registrar cuenta bancaria');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setIsOptimizing(true);
    try {
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/jpeg', initialQuality: 0.85 };
      const compressedFile = await imageCompression(file, options);
      setComprobanteFile(compressedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setComprobantePreview(reader.result);
        setIsOptimizing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      setComprobanteFile(file);
      const reader = new FileReader();
      reader.onload = () => { setComprobantePreview(reader.result); setIsOptimizing(false); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) { setError('Ingresa tu contraseña de fondos.'); return; }
    if (!comprobanteFile) { setError('Debes subir una imagen o comprobante.'); return; }
    
    setLoading(true);
    setError('');
    try {
      const idempotencyKey = `withdraw_${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const formData = new FormData();
      formData.append('monto', monto);
      formData.append('tipo_billetera', tipoBilletera);
      formData.append('password_fondo', password);
      formData.append('tarjeta_id', tarjetaId);
      formData.append('comprobante', comprobanteFile);
      formData.append('idempotency_key', idempotencyKey);

      await api.withdrawals.create(formData);
      navigate('/ganancias');
    } catch (err) {
      setError(err.message || 'Error al solicitar retiro');
    } finally {
      setLoading(false);
    }
  };

  if (securityStatus.loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoaderIcon className="text-sav-accent animate-spin" size={40} />
        </div>
      </Layout>
    );
  }

  // --- RENDERS DE SEGURIDAD ---

  if (!securityStatus.tiene_password_fondo) {
    return (
      <Layout>
        <Header title="Seguridad de Fondos" />
        <main className="px-6 py-10 space-y-8 animate-in">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-[2rem] bg-sav-accent/10 border border-sav-accent/20 flex items-center justify-center mx-auto text-sav-accent shadow-accent-glow">
              <LockIcon size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Configura tu PIN</h2>
              <p className="text-sm font-medium text-zinc-400 leading-relaxed px-4">Para proteger tu capital, es obligatorio establecer una contraseña exclusiva para retiros.</p>
            </div>
          </div>

          <Card className="p-8 bg-zinc-950/60 backdrop-blur-3xl border border-white/10 space-y-6">
            <form onSubmit={handleFundPasswordSubmit} className="space-y-6">
              <Input 
                label="Nueva Contraseña de Fondos" 
                type="password" 
                placeholder="6-12 caracteres"
                value={fundPass.password_fondo}
                onChange={e => setFundPass({ ...fundPass, password_fondo: e.target.value })}
                icon={LockIcon}
              />
              <Input 
                label="Confirmar Contraseña" 
                type="password" 
                placeholder="Repite la contraseña"
                value={fundPass.confirm_password_fondo}
                onChange={e => setFundPass({ ...fundPass, confirm_password_fondo: e.target.value })}
                icon={ShieldCheckIcon}
              />
              {error && <p className="text-xs font-bold text-red-400 uppercase tracking-widest text-center">{error}</p>}
              <Button type="submit" loading={loading} variant="primary" className="w-full h-14 shadow-accent-glow uppercase tracking-widest">GUARDAR SEGURIDAD</Button>
            </form>
          </Card>
        </main>
      </Layout>
    );
  }

  if (!securityStatus.tiene_cuenta_bancaria) {
    return (
      <Layout>
        <Header title="Vinculación Bancaria" />
        <main className="px-6 py-8 space-y-8 animate-in">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <BuildingIcon size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Datos de Cobro</h2>
              <p className="text-sm font-medium text-zinc-400 leading-relaxed px-4">Ingresa los datos de la cuenta donde recibirás tus transferencias institucionales.</p>
            </div>
          </div>

          <Card className="p-8 bg-zinc-950/60 backdrop-blur-3xl border border-white/10 space-y-6">
            <form onSubmit={handleBankAccountSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-sav-muted uppercase tracking-[0.15em] ml-1">Entidad Bancaria</label>
                <select 
                  className="w-full h-13 px-5 rounded-m3 bg-white/[0.03] border border-white/[0.08] text-white outline-none focus:border-sav-accent/50 transition-all"
                  value={bankAcc.banco}
                  onChange={e => setBankAcc({ ...bankAcc, banco: e.target.value })}
                >
                  <option value="bnb">BNB - Banco Nacional de Bolivia</option>
                  <option value="union">Banco Unión</option>
                  <option value="mercantil">Banco Mercantil Santa Cruz</option>
                  <option value="bisa">Banco BISA</option>
                  <option value="economico">Banco Económico</option>
                  <option value="ganadero">Banco Ganadero</option>
                  <option value="fassil">Banco Fassil (Intervención)</option>
                  <option value="bcp">Banco BCP de Bolivia</option>
                  <option value="fie">Banco FIE</option>
                  <option value="sol">Banco Sol</option>
                  <option value="comunidad">Banco Comunidad</option>
                  <option value="prodem">Banco Prodem</option>
                  <option value="otro">Otras Entidades / Cooperativas</option>
                </select>
              </div>

              <Input label="Titular de la Cuenta" value={bankAcc.titular} onChange={e => setBankAcc({ ...bankAcc, titular: e.target.value })} icon={User} />
              <Input label="Número de Cuenta" value={bankAcc.numero_cuenta} onChange={e => setBankAcc({ ...bankAcc, numero_cuenta: e.target.value })} icon={CreditCardIcon} />
              <Input label="CI / NIT" value={bankAcc.ci_nit} onChange={e => setBankAcc({ ...bankAcc, ci_nit: e.target.value })} icon={ShieldCheckIcon} />

              {error && <p className="text-xs font-bold text-red-400 uppercase tracking-widest text-center">{error}</p>}
              <Button type="submit" loading={loading} variant="primary" className="w-full h-14 shadow-accent-glow uppercase tracking-widest">VINCULAR CUENTA</Button>
            </form>
          </Card>
        </main>
      </Layout>
    );
  }

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

  const isInternar = userLevel?.codigo === 'internar' || userLevel?.codigo === 'pasantia';

  return (
    <Layout>
      <div className="min-h-screen pb-32">
        <Header 
          title="Retiro de Capital" 
          rightAction={
            <Link to="/ganancias" className="text-[9px] font-bold text-white uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/10 shadow-m3-1">
              Historial
            </Link>
          } 
        />
        
        <main className="px-5 py-6 space-y-8 animate-in">
          {/* Wallet Selector - Premium Tabs */}
          <div className="flex p-1.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl gap-2">
            <button 
              onClick={() => setTipoBilletera('principal')}
              className={cn(
                "flex-1 flex flex-col items-center py-4 rounded-xl transition-all duration-300 gap-1",
                tipoBilletera === 'principal' ? "bg-white/[0.07] border border-white/10 shadow-lg" : "opacity-40"
              )}
            >
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Saldo Principal</p>
              <p className={cn("text-xl font-bold tracking-tight", tipoBilletera === 'principal' ? "text-white" : "text-zinc-500")}>
                {saldoPrincipal.toLocaleString()} <span className="text-[10px] text-sav-accent">Bs</span>
              </p>
            </button>
            <button 
              onClick={() => setTipoBilletera('comisiones')}
              className={cn(
                "flex-1 flex flex-col items-center py-4 rounded-xl transition-all duration-300 gap-1",
                tipoBilletera === 'comisiones' ? "bg-white/[0.07] border border-white/10 shadow-lg" : "opacity-40"
              )}
            >
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Comisiones</p>
              <p className={cn("text-xl font-bold tracking-tight", tipoBilletera === 'comisiones' ? "text-white" : "text-zinc-500")}>
                {saldoComisiones.toLocaleString()} <span className="text-[10px] text-sav-accent">Bs</span>
              </p>
            </button>
          </div>

          {!schedRet.ok && (
            <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-start gap-4 shadow-m3-1">
              <ClockIcon size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-widest mb-1">Fuera de Horario</h4>
                <p className="text-sm font-medium text-zinc-400 leading-relaxed">{schedRet.message}</p>
              </div>
            </div>
          )}

          {hasWithdrawalToday && (
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-4 shadow-m3-1">
              <AlertCircleIcon size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1">Límite Diario</h4>
                <p className="text-sm font-medium text-zinc-400 leading-relaxed">Has realizado una solicitud de retiro hoy. Debes esperar a mañana para procesar una nueva solicitud.</p>
              </div>
            </div>
          )}

          <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <TrendingUpIcon size={16} className="text-sav-accent" />
              <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Importe del Retiro</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {montos.map((m) => (
                <button
                  key={m}
                  onClick={() => setMonto(m)}
                  className={cn(
                    "h-14 rounded-xl border font-bold transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-1",
                    monto === m 
                      ? "bg-sav-accent text-white border-sav-accent shadow-accent-glow" 
                      : "bg-white/[0.02] border-white/10 text-zinc-400 hover:border-white/20"
                  )}
                >
                  <span className="text-lg">{m}</span>
                  <span className="text-[9px] opacity-60">Bs</span>
                </button>
              ))}
            </div>

            <Card className="p-8 bg-zinc-950/60 backdrop-blur-3xl border border-white/10 space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-sav-muted uppercase tracking-[0.15em] ml-1">Cuenta de Destino</label>
                  <div className="relative">
                    <select 
                      className="w-full h-14 px-5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white outline-none focus:border-sav-accent/50 transition-all appearance-none"
                      value={tarjetaId}
                      onChange={e => setTarjetaId(e.target.value)}
                    >
                      {tarjetas.map(t => (
                        <option key={t.id} value={t.id}>{t.banco.toUpperCase()} - {t.numero_cuenta}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                      <ChevronRightIcon size={18} className="rotate-90" />
                    </div>
                  </div>
                </div>

                <Input 
                  label="Contraseña de Fondos" 
                  type="password" 
                  placeholder="Tu PIN de seguridad"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  icon={LockIcon}
                  showPasswordToggle
                />

                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-sav-muted uppercase tracking-[0.15em] ml-1">Respaldo Digital (Requerido)</label>
                  <div 
                    onClick={() => fileRef.current.click()}
                    className={cn(
                      "relative aspect-[2/1] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 group overflow-hidden",
                      comprobantePreview ? "border-emerald-500/40" : "hover:border-sav-accent/40 hover:bg-white/[0.02]"
                    )}
                  >
                    {comprobantePreview ? (
                      <>
                        <img src={comprobantePreview} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] font-bold text-white uppercase tracking-widest">Cambiar Imagen</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-sav-accent transition-colors">
                          {isOptimizing ? <LoaderIcon className="animate-spin" /> : <UploadIcon size={28} />}
                        </div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Subir comprobante o firma</p>
                      </>
                    )}
                    <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" className="hidden" />
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest">{error}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  loading={loading || isOptimizing} 
                  disabled={!schedRet.ok || hasWithdrawalToday || isInternar}
                  variant="primary" 
                  className="w-full h-16 shadow-accent-glow uppercase tracking-[0.15em] text-sm"
                  icon={ArrowRightIcon}
                >
                  {isInternar ? 'NIVEL INSUFICIENTE' : 'ENVIAR SOLICITUD'}
                </Button>
              </form>
            </Card>
            
            <div className="rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/50 p-2">
              <img src="/imag/retiros.webp" alt="Info Retiros" className="w-full h-auto object-contain rounded-xl opacity-80" />
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}