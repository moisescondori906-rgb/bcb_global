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
  Crown,
  Zap,
  Image as ImageIcon
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-sav-bg space-y-6">
          <div className="w-16 h-16 border-4 border-sav-surface border-t-sav-primary rounded-full animate-spin" />
          <p className="text-[11px] font-extrabold text-sav-muted uppercase tracking-[0.3em] animate-pulse">Sincronizando Seguridad</p>
        </div>
      </Layout>
    );
  }

  // --- RENDERS DE SEGURIDAD ---

  if (!securityStatus.tiene_password_fondo) {
    return (
      <Layout>
        <Header title="Seguridad de Fondos" />
        <main className="px-6 py-12 space-y-10 max-w-lg mx-auto animate-in">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 rounded-[2.5rem] bg-sav-primary/10 border border-sav-primary/20 flex items-center justify-center mx-auto text-sav-primary shadow-sm">
              <LockIcon size={48} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-sav-text-main tracking-tight uppercase leading-none">Configura tu PIN</h2>
              <p className="text-sm font-bold text-sav-text-dim/80 leading-relaxed max-w-xs mx-auto">Para proteger tu capital, es obligatorio establecer una contraseña exclusiva para transacciones.</p>
            </div>
          </div>

          <Card variant="premium" className="p-10 space-y-8">
            <form onSubmit={handleFundPasswordSubmit} className="space-y-8">
              <Input 
                label="Nueva Contraseña de Fondos" 
                type="password" 
                placeholder="6-12 caracteres"
                value={fundPass.password_fondo}
                onChange={e => setFundPass({ ...fundPass, password_fondo: e.target.value })}
                icon={LockIcon}
                showPasswordToggle
              />
              <Input 
                label="Confirmar Contraseña" 
                type="password" 
                placeholder="Repite la contraseña"
                value={fundPass.confirm_password_fondo}
                onChange={e => setFundPass({ ...fundPass, confirm_password_fondo: e.target.value })}
                icon={ShieldCheckIcon}
                showPasswordToggle
              />
              {error && <p className="text-xs font-black text-sav-error uppercase tracking-widest text-center">{error}</p>}
              <Button type="submit" loading={loading} variant="primary" className="w-full h-16 shadow-accent-glow uppercase tracking-[0.2em] text-[15px]">GUARDAR PIN DE SEGURIDAD</Button>
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
        <main className="px-6 py-12 space-y-10 max-w-lg mx-auto animate-in">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
              <BuildingIcon size={48} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-sav-text-main tracking-tight uppercase leading-none">Datos de Cobro</h2>
              <p className="text-sm font-bold text-sav-text-dim/80 leading-relaxed max-w-xs mx-auto">Ingresa los datos de la cuenta donde recibirás tus transferencias institucionales.</p>
            </div>
          </div>

          <Card variant="premium" className="p-10">
            <form onSubmit={handleBankAccountSubmit} className="space-y-6">
              <div className="space-y-2.5">
                <label className="text-[11px] font-extrabold text-sav-muted uppercase tracking-[0.2em] ml-1.5">Entidad Bancaria</label>
                <select 
                  className="w-full h-14 px-6 rounded-m3 bg-sav-surface border border-black/[0.03] text-sav-text-main font-bold outline-none focus:border-sav-primary/50 transition-all shadow-sm"
                  value={bankAcc.banco}
                  onChange={e => setBankAcc({ ...bankAcc, banco: e.target.value })}
                >
                  <option value="bnb">BNB - Banco Nacional de Bolivia</option>
                  <option value="union">Banco Unión</option>
                  <option value="mercantil">Banco Mercantil Santa Cruz</option>
                  <option value="bisa">Banco BISA</option>
                  <option value="economico">Banco Económico</option>
                  <option value="ganadero">Banco Ganadero</option>
                  <option value="sol">Banco Sol</option>
                  <option value="fassil">Banco Fassil (En intervención)</option>
                  <option value="otro">Otras Entidades Financieras</option>
                </select>
              </div>

              <Input 
                label="Titular de la Cuenta" 
                placeholder="Nombre completo"
                value={bankAcc.titular}
                onChange={e => setBankAcc({ ...bankAcc, titular: e.target.value })}
                icon={User}
              />

              <Input 
                label="Número de Cuenta" 
                placeholder="000-000000"
                value={bankAcc.numero_cuenta}
                onChange={e => setBankAcc({ ...bankAcc, numero_cuenta: e.target.value })}
                icon={CreditCardIcon}
              />

              <Input 
                label="C.I. / NIT" 
                placeholder="Cédula de Identidad"
                value={bankAcc.ci_nit}
                onChange={e => setBankAcc({ ...bankAcc, ci_nit: e.target.value })}
                icon={ShieldCheckIcon}
              />

              {error && <p className="text-xs font-black text-sav-error uppercase tracking-widest text-center">{error}</p>}
              
              <Button type="submit" loading={loading} variant="primary" className="w-full h-16 shadow-accent-glow uppercase tracking-[0.2em] text-[15px]" icon={CheckCircleIcon}>
                VINCULAR CUENTA AHORA
              </Button>
            </form>
          </Card>
        </main>
      </Layout>
    );
  }

  // --- RENDER PRINCIPAL DE RETIRO ---

  const sched = pc?.horario_retiro ? isScheduleOpen(pc.horario_retiro) : { ok: true };

  return (
    <Layout>
      <div className="bg-sav-bg min-h-screen pb-32">
        <Header title="Solicitud de Retiro" />
        
        <main className="px-6 py-8 space-y-10 max-w-lg mx-auto animate-in">
          {/* Balance Cards */}
          <section className="grid grid-cols-2 gap-5">
            <Card className="p-6 bg-white border-black/[0.03] shadow-m3-1 group overflow-hidden relative">
               <div className="w-10 h-10 rounded-xl bg-sav-primary/10 flex items-center justify-center text-sav-primary mb-3">
                  <WalletIcon size={20} strokeWidth={2.5} />
               </div>
               <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest mb-1">Capital Principal</p>
               <p className="text-xl font-black text-sav-text-main tracking-tight">
                 {Number(user?.saldo_principal || 0).toLocaleString()} <span className="text-xs text-sav-primary">Bs</span>
               </p>
               <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-sav-primary/5 rounded-full blur-xl" />
            </Card>
            <Card className="p-6 bg-white border-black/[0.03] shadow-m3-1 group overflow-hidden relative">
               <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                  <TrendingUpIcon size={20} strokeWidth={2.5} />
               </div>
               <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest mb-1">Ganancias</p>
               <p className="text-xl font-black text-sav-text-main tracking-tight">
                 {Number(user?.saldo_ingresos || 0).toLocaleString()} <span className="text-xs text-emerald-600">Bs</span>
               </p>
               <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl" />
            </Card>
          </section>

          {!sched.ok && (
            <div className="p-5 rounded-3xl bg-rose-50 border border-rose-100 flex items-start gap-4 shadow-sm animate-pulse">
               <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                  <ClockIcon size={20} strokeWidth={2.5} />
               </div>
               <div>
                  <h4 className="text-[12px] font-extrabold text-rose-600 uppercase tracking-widest mb-1">Sistema Fuera de Horario</h4>
                  <p className="text-[11px] text-rose-500/80 font-bold leading-tight uppercase tracking-tight">{sched.message}</p>
               </div>
            </div>
          )}

          {hasWithdrawalToday && (
             <div className="p-5 rounded-3xl bg-amber-50 border border-amber-100 flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                   <AlertCircleIcon size={20} strokeWidth={2.5} />
                </div>
                <div>
                   <h4 className="text-[12px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">Operación Diaria Completa</h4>
                   <p className="text-[11px] text-amber-500/80 font-bold leading-tight uppercase tracking-tight">Ya has realizado un retiro el día de hoy. El sistema permite una transacción cada 24 horas.</p>
                </div>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10 pb-12">
            {/* Amount Selection */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
                <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Monto a Retirar</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {montos.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonto(m)}
                    className={cn(
                      "h-14 rounded-2xl font-black text-[15px] transition-all duration-300 shadow-sm",
                      monto === m 
                        ? "bg-sav-primary text-white shadow-accent-glow -translate-y-1" 
                        : "bg-white text-sav-text-main border border-black/[0.03] hover:bg-sav-surface"
                    )}
                  >
                    {m} Bs
                  </button>
                ))}
              </div>
            </section>

            {/* Wallet Type */}
            <section className="space-y-5">
               <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
                  <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Origen de Fondos</h3>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTipoBilletera('principal')}
                    className={cn(
                      "p-5 rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden group shadow-sm",
                      tipoBilletera === 'principal' ? "bg-white border-sav-primary" : "bg-white border-black/[0.03]"
                    )}
                  >
                    <WalletIcon size={20} className={cn("mb-2 transition-colors", tipoBilletera === 'principal' ? "text-sav-primary" : "text-sav-muted")} strokeWidth={2.5} />
                    <p className="text-[11px] font-extrabold text-sav-text-main uppercase tracking-widest">Capital Principal</p>
                    {tipoBilletera === 'principal' && <div className="absolute top-2 right-2 w-2 h-2 bg-sav-primary rounded-full" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoBilletera('ingresos')}
                    className={cn(
                      "p-5 rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden group shadow-sm",
                      tipoBilletera === 'ingresos' ? "bg-white border-emerald-500" : "bg-white border-black/[0.03]"
                    )}
                  >
                    <TrendingUpIcon size={20} className={cn("mb-2 transition-colors", tipoBilletera === 'ingresos' ? "text-emerald-500" : "text-sav-muted")} strokeWidth={2.5} />
                    <p className="text-[11px] font-extrabold text-sav-text-main uppercase tracking-widest">Billetera Ganancias</p>
                    {tipoBilletera === 'ingresos' && <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />}
                  </button>
               </div>
            </section>

            {/* Account Selection */}
            <section className="space-y-5">
               <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
                  <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Cuenta de Destino</h3>
               </div>
               <div className="space-y-3">
                 {tarjetas.map((t) => (
                   <button
                     key={t.id}
                     type="button"
                     onClick={() => setTarjetaId(t.id)}
                     className={cn(
                       "w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all duration-300 shadow-sm",
                       tarjetaId === t.id ? "bg-white border-sav-primary" : "bg-white border-black/[0.03] hover:bg-sav-surface"
                     )}
                   >
                     <div className="flex items-center gap-4">
                       <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm", tarjetaId === t.id ? "bg-sav-primary text-white" : "bg-sav-surface text-sav-muted")}>
                          <BuildingIcon size={24} strokeWidth={2} />
                       </div>
                       <div className="text-left">
                         <p className="text-[12px] font-black text-sav-text-main uppercase tracking-tight">{t.nombre_banco || 'BANCO VINCULADO'}</p>
                         <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest mt-0.5">****{t.numero_masked}</p>
                       </div>
                     </div>
                     {tarjetaId === t.id && <CheckCircleIcon size={20} className="text-sav-primary" strokeWidth={3} />}
                   </button>
                 ))}
               </div>
            </section>

            {/* Proof Upload */}
            <section className="space-y-5">
               <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
                  <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Comprobante Institucional</h3>
               </div>
               
               <div 
                 onClick={() => fileRef.current?.click()}
                 className={cn(
                   "relative w-full aspect-[2/1] rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500 cursor-pointer overflow-hidden group",
                   comprobantePreview ? "border-sav-primary" : "border-black/[0.05] bg-sav-surface/50 hover:bg-white hover:border-black/[0.1]"
                 )}
               >
                 {comprobantePreview ? (
                   <>
                     <img src={comprobantePreview} className="w-full h-full object-cover" alt="Comprobante" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Cambiar Imagen</p>
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="w-16 h-16 rounded-2xl bg-white shadow-m3-1 flex items-center justify-center text-sav-muted group-hover:text-sav-primary transition-colors mb-4">
                        <ImageIcon size={32} strokeWidth={1.5} />
                     </div>
                     <p className="text-[11px] font-extrabold text-sav-text-main uppercase tracking-widest">Adjuntar Captura</p>
                     <p className="text-[9px] font-bold text-sav-muted uppercase tracking-tight mt-1">Formato JPG, PNG (Máx 2MB)</p>
                   </>
                 )}
                 {isOptimizing && (
                   <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <LoaderIcon className="animate-spin text-sav-primary" size={32} />
                   </div>
                 )}
               </div>
               <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" className="hidden" />
            </section>

            {/* Security PIN */}
            <section className="space-y-5">
               <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-4 bg-sav-primary rounded-full" />
                  <h3 className="text-[13px] font-extrabold text-sav-text-main uppercase tracking-[0.15em]">Validación Final</h3>
               </div>
               <Input 
                 label="PIN de Seguridad de Fondos"
                 type="password"
                 placeholder="Ingresa tu código de 6 dígitos"
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 icon={LockIcon}
                 showPasswordToggle
               />
            </section>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !sched.ok || hasWithdrawalToday || !comprobanteFile}
              loading={loading}
              variant="primary"
              className="w-full h-18 text-[16px] shadow-accent-glow"
              icon={ArrowRightIcon}
            >
              PROCESAR RETIRO AHORA
            </Button>
          </form>
        </main>
      </div>
    </Layout>
  );
}
