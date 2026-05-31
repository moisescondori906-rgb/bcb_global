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
  Building2 as BuildingIcon
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
  const [hasSignature, setHasSignature] = useState(true); // Ya viene por defecto
  
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
        // Cargar datos necesarios para el retiro solo si ya tiene seguridad configurada
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
      // Recargar tarjetas para el selector de retiro
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
        <div className="min-h-screen bg-sav-dark flex items-center justify-center">
          <LoaderIcon className="text-sav-primary animate-spin" size={40} />
        </div>
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

  const fueraHorario = horarioRet?.enabled && !schedRet.ok;
  const msgHorario = !schedRet.ok ? schedRet.message : '';

  // --- VALIDACIÓN DE DÍAS (Sincronizado con Backend v12.0.0) ---
  const boliviaNow = getBoliviaNow();
  const today = boliviaNow.getDay(); // 0=Dom, 1=Lun, 2=Mar... 6=Sab
  
  // Reglas Globales desde Configuración (Lunes a Viernes: 1, 2, 3, 4, 5)
  const globalSchedule = pc?.horario_retiro || { enabled: true, dias_semana: [1, 2, 3, 4, 5] };
  const globalAllowedDays = Array.isArray(globalSchedule.dias_semana) ? globalSchedule.dias_semana : [1, 2, 3, 4, 5];

  // Si el nivel tiene horario específico configurado, usamos ese rango
  let isAllowedDay = false;
  if (userLevel?.retiro_horario_habilitado) {
    const start = Number(userLevel.retiro_dia_inicio);
    const end = Number(userLevel.retiro_dia_fin);
    if (start <= end) isAllowedDay = today >= start && today <= end;
    else isAllowedDay = today >= start || today <= end;
  } else {
    // Usar la regla general (Martes a Jueves por defecto)
    isAllowedDay = globalAllowedDays.includes(today);
  }

  const isInternar = userLevel?.codigo === 'internar' || userLevel?.codigo === 'pasantia';
  const canWithdrawToday = isAllowedDay && !isInternar;

  const DAY_NAMES = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
  const globalAllowedNames = globalAllowedDays.map(d => DAY_NAMES[d]).join(', ');

  return (
    <Layout>
      <div className="min-h-screen pb-32">
        <Header 
          title="Retiro" 
          rightAction={
            <Link to="/ganancias" className="text-sav-primary text-[9px] font-black uppercase tracking-widest bg-sav-surface px-4 py-2 rounded-m3 border border-sav-border shadow-m3-1">
              Historial
            </Link>
          } 
        />
        
        <main className="px-4 sm:px-6 py-6 space-y-6 animate-in">
          {/* Balance Card - Flutter Style */}
          <Card className="p-6 bg-sav-primary border-none shadow-m3-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10 space-y-1">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Capital Disponible</p>
              <div className="flex items-baseline gap-2 overflow-hidden">
                <h2 className="text-3xl font-black text-white tracking-tighter truncate">
                  {(tipoBilletera === 'principal' ? saldoPrincipal : saldoComisiones).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h2>
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Bs</span>
              </div>
            </div>
          </Card>

          <AnimatePresence mode='wait'>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="p-4 rounded-m3 bg-sav-error/5 border border-sav-error/20 flex items-center gap-3">
                  <AlertCircleIcon size={18} className="text-sav-error shrink-0" />
                  <p className="text-[10px] text-sav-error font-bold uppercase tracking-tight">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!securityStatus.tiene_password_fondo ? (
            /* PASO 1: CONTRASEÑA DE FONDOS */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="p-6 bg-white border-sav-border shadow-m3-2 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-m3 bg-sav-surface flex items-center justify-center text-sav-primary border border-sav-border shadow-m3-1">
                    <ShieldCheckIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-sav-primary uppercase tracking-tight">Seguridad de Fondos</h3>
                    <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest">Paso 1 de 2</p>
                  </div>
                </div>
                <p className="text-[11px] text-sav-muted font-medium leading-relaxed">Configura una contraseña de 6 dígitos para autorizar tus retiros.</p>
              </Card>

              <form onSubmit={handleFundPasswordSubmit} className="space-y-6">
                <Card className="p-8 space-y-5 bg-white border-sav-border shadow-m3-3">
                  <Input
                    type="password"
                    label="Nueva Contraseña"
                    value={fundPass.password_fondo}
                    onChange={(e) => setFundPass({ ...fundPass, password_fondo: e.target.value })}
                    required
                    maxLength={6}
                    placeholder="6 dígitos"
                    icon={LockIcon}
                    showPasswordToggle
                  />
                  <Input
                    type="password"
                    label="Confirmar Contraseña"
                    value={fundPass.confirm_password_fondo}
                    onChange={(e) => setFundPass({ ...fundPass, confirm_password_fondo: e.target.value })}
                    required
                    maxLength={6}
                    placeholder="Repite los 6 dígitos"
                    icon={LockIcon}
                    showPasswordToggle
                  />
                  <Button type="submit" loading={loading} className="h-13 shadow-m3-2">GUARDAR SEGURIDAD</Button>
                </Card>
              </form>
            </motion.div>
          ) : !securityStatus.tiene_cuenta_bancaria ? (
            /* PASO 2: CUENTA BANCARIA */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
               <Card className="p-6 bg-white border-sav-border shadow-m3-2 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-m3 bg-sav-surface flex items-center justify-center text-sav-primary border border-sav-border shadow-m3-1">
                    <BuildingIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-sav-primary uppercase tracking-tight">Cuenta de Destino</h3>
                    <p className="text-[10px] font-bold text-sav-muted uppercase tracking-widest">Paso 2 de 2</p>
                  </div>
                </div>
                <p className="text-[11px] text-sav-muted font-medium leading-relaxed">Vincula la cuenta donde recibirás tus transferencias.</p>
              </Card>

              <form onSubmit={handleBankAccountSubmit} className="space-y-6">
                <Card className="p-8 space-y-5 bg-white border-sav-border shadow-m3-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-sav-primary uppercase tracking-widest ml-1">Banco / Plataforma</label>
                    <select 
                      value={bankAcc.banco}
                      onChange={(e) => setBankAcc({ ...bankAcc, banco: e.target.value })}
                      className="w-full bg-sav-surface border border-sav-border rounded-m3 h-12 px-4 text-sm font-bold text-slate-900 outline-none focus:border-sav-primary transition-all"
                    >
                      <option value="bnb">BNB - Banco Nacional</option>
                      <option value="union">Banco Unión</option>
                      <option value="mercantil">Banco Mercantil</option>
                      <option value="ganadero">Banco Ganadero</option>
                      <option value="economico">Banco Económico</option>
                      <option value="bisa">Banco BISA</option>
                      <option value="otro">Otro Banco / QR</option>
                    </select>
                  </div>

                  <Input label="Titular" value={bankAcc.titular} onChange={(e) => setBankAcc({ ...bankAcc, titular: e.target.value })} placeholder="Nombre completo" icon={ShieldCheckIcon} required />
                  <Input label="Nro Cuenta / Celular" value={bankAcc.numero_cuenta} onChange={(e) => setBankAcc({ ...bankAcc, numero_cuenta: e.target.value })} placeholder="Nro de cuenta o celular" icon={CreditCardIcon} required />
                  <Input label="CI / NIT" value={bankAcc.ci_nit} onChange={(e) => setBankAcc({ ...bankAcc, ci_nit: e.target.value })} placeholder="Cédula de identidad" icon={ShieldCheckIcon} required />
                  
                  <Button type="submit" loading={loading} className="h-13 shadow-m3-2">VINCULAR CUENTA</Button>
                </Card>
              </form>
            </motion.div>
          ) : (
            /* PASO 3: FORMULARIO DE RETIRO */
            <div className="space-y-6">
              {/* Wallet Selector */}
              <div className="flex bg-white p-1.5 rounded-m3 border border-sav-border shadow-m3-1">
                <button onClick={() => setTipoBilletera('principal')} className={cn("flex-1 py-3 rounded-m3 text-[10px] font-black uppercase tracking-widest transition-all", tipoBilletera === 'principal' ? "bg-sav-primary text-white shadow-m3-2" : "text-sav-muted")}>Capital</button>
                <button onClick={() => setTipoBilletera('comisiones')} className={cn("flex-1 py-3 rounded-m3 text-[10px] font-black uppercase tracking-widest transition-all", tipoBilletera === 'comisiones' ? "bg-sav-primary text-white shadow-m3-2" : "text-sav-muted")}>Comisiones</button>
              </div>

              {/* Schedule Info */}
              {!schedRet.ok && (
                <div className="p-4 rounded-m3 bg-sav-error/5 border border-sav-error/20 flex items-start gap-3 shadow-m3-1">
                  <ClockIcon size={18} className="text-sav-error shrink-0 mt-0.5" />
                  <p className="text-[10px] text-sav-error font-bold uppercase tracking-tight leading-relaxed">{schedRet.message}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-[11px] font-black text-sav-primary uppercase tracking-[0.2em] px-1">Selecciona Monto</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {montos.map(m => (
                      <button 
                        key={m} 
                        type="button" 
                        onClick={() => setMonto(m)}
                        className={cn(
                          "py-3.5 rounded-m3 border text-sm font-black transition-all shadow-m3-1",
                          monto === m ? "bg-sav-surface border-sav-primary text-sav-primary ring-1 ring-sav-primary/30" : "bg-white border-sav-border text-sav-muted"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                   <h3 className="text-[11px] font-black text-sav-primary uppercase tracking-[0.2em] px-1">Validación y Envío</h3>
                   <Card className="p-8 space-y-6 bg-white border-sav-border shadow-m3-3">
                     <Input 
                        type="password" 
                        label="Pin de Seguridad"
                        placeholder="6 dígitos de fondos" 
                        maxLength={6} 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        icon={LockIcon}
                        required 
                      />

                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-sav-primary uppercase tracking-widest px-1">Comprobante / Selfie</p>
                        <button 
                          type="button" 
                          onClick={() => fileRef.current?.click()}
                          className={cn(
                            "w-full aspect-video rounded-m3 border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden",
                            comprobantePreview ? "border-sav-primary bg-sav-surface/50" : "border-sav-border bg-sav-surface hover:bg-sav-surface/80"
                          )}
                        >
                          {comprobantePreview ? (
                            <img src={comprobantePreview} className="w-full h-full object-cover" alt="Preview" />
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-sav-primary shadow-m3-1">
                                {isOptimizing ? <LoaderIcon className="animate-spin" /> : <UploadIcon size={20} />}
                              </div>
                              <p className="text-[9px] font-black text-sav-muted uppercase tracking-widest">Capturar imagen</p>
                            </>
                          )}
                          <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" className="hidden" />
                        </button>
                      </div>

                      <Button 
                        type="submit" 
                        loading={loading || isOptimizing} 
                        disabled={!schedRet.ok || hasWithdrawalToday || isInternar}
                        className="h-14 shadow-m3-3"
                        icon={ArrowRightIcon}
                      >
                        {isInternar ? 'NIVEL INSUFICIENTE' : 'ENVIAR SOLICITUD'}
                      </Button>
                   </Card>
              </form>

              {/* Info Image */}
              <div className="rounded-m3-lg overflow-hidden border border-sav-border shadow-m3-2 bg-white p-2">
                <img src="/imag/retiros.webp" alt="Info Retiros" className="w-full h-auto object-contain rounded-m3" />
              </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
                    <h2 className="text-[10px] sm:text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] sm:tracking-[0.3em]">5. Confirmación</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Contraseña de fondos"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      showPasswordToggle
                      icon={ShieldCheckIcon}
                      className="h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-white border-black/5 shadow-sm"
                    />

                    <div className="px-1 flex items-start gap-3 group cursor-pointer" onClick={() => setHasSignature(!hasSignature)}>
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 shrink-0",
                        hasSignature ? "bg-sav-primary border-sav-primary text-white" : "border-black/10 bg-white"
                      )}>
                        {hasSignature && <CheckIcon size={12} strokeWidth={4} />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] sm:text-[10px] font-black text-gray-900 uppercase tracking-widest group-hover:text-sav-primary transition-colors">Autorización de Transacción</p>
                        <p className="text-[7px] sm:text-[8px] text-sav-muted font-medium uppercase tracking-widest leading-relaxed">Confirmo que los datos son correctos y autorizo el procesamiento.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="pt-2 sm:pt-4">
                  <Button 
                    type="submit" 
                    loading={loading} 
                    disabled={!canWithdrawToday || fueraHorario || hasWithdrawalToday || !comprobanteFile || !password || !hasSignature}
                    className="h-16 sm:h-20 w-full rounded-2xl sm:rounded-[2rem] text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] shadow-xl active:scale-95 transition-all uppercase font-black"
                  >
                    {!canWithdrawToday 
                      ? 'FUERA DE DÍA ASIGNADO' 
                      : 'SOLICITAR RETIRO'
                    }
                  </Button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
