import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { CONFIG } from '../config';
import { Share2, Copy, Check, Users, Gift, Star, ShieldCheck, Zap, Lock, Info, TrendingUp, AlertCircle, ArrowRight, Trash2, User, Loader2 as LoaderIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { displayLevelCode } from '../lib/displayLevel.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { cn } from '../lib/utils/cn';

const GlobalLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-sav-dark space-y-6">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-white/5 border-t-sav-accent rounded-full animate-spin"></div>
      <div className="absolute inset-0 bg-sav-accent/10 blur-xl rounded-full animate-pulse"></div>
    </div>
    <div className="text-center">
      <p className="text-white font-bold uppercase tracking-[0.4em] text-[10px] animate-pulse">Cargando BCB Global</p>
      <p className="text-sav-muted text-[8px] uppercase tracking-widest mt-2">Institutional Grade Platform</p>
    </div>
  </div>
);

export default function Invite() {
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [punished, setPunished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  const [selectedNivel, setSelectedNivel] = useState('A');
  const [deletingId, setDeletingId] = useState(null);

  const fetchReferrals = async () => {
    if (referrals.length === 0) setReferralsLoading(true);
    try {
      const res = await api.get(`/users/my-referrals?nivel=${selectedNivel}`);
      setReferrals(res.items || []);
    } catch (err) {
      console.error('Error fetching referrals:', err);
    } finally {
      setReferralsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
    const interval = setInterval(fetchReferrals, 5000);
    return () => clearInterval(interval);
  }, [selectedNivel]);

  const handleDeleteReferral = async (referralId) => {
    if (!window.confirm('¿Estás seguro de eliminar a este usuario Pasante? Esta acción no se puede deshacer y liberará un espacio en tu lista de invitados.')) return;
    
    setDeletingId(referralId);
    try {
      await api.delete(`/users/my-referrals/${referralId}`);
      fetchReferrals();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar referido');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  const inviteLink = `${CONFIG.WEB_URL}/register?ref=${user?.codigo_invitacion || ''}`;

  const handleCopyCode = async () => {
    if (!user?.codigo_invitacion) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteLink);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (loading) return <GlobalLoader />;

  if (punished) {
    return (
      <Layout>
        <Header title="Invitación Bloqueada" />
        <div className="p-8 text-center space-y-8 flex flex-col items-center justify-center min-h-[70vh] animate-fade">
          <div className="w-24 h-24 bg-sav-error/10 text-sav-error rounded-[2.5rem] flex items-center justify-center shadow-lg border border-sav-error/20 animate-pulse">
            <AlertCircle size={48} strokeWidth={1.5} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Acceso Restringido</h2>
            <p className="text-sm text-zinc-400 font-medium leading-relaxed max-w-xs mx-auto">
              Tu acceso a invitaciones ha sido <span className="text-sav-error uppercase">bloqueado temporalmente</span> como sanción por incumplimiento.
            </p>
          </div>
          <Card className="p-6 bg-amber-500/5 border-amber-500/20 text-left w-full">
            <div className="flex items-center gap-2 mb-3 text-amber-500">
              <Info size={16} />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Nota Importante</p>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-wider">
              Asegúrate de completar todas tus tareas y cuestionarios diariamente para restaurar tus privilegios.
            </p>
          </Card>
          <Link to="/" className="w-full">
            <Button variant="secondary" className="w-full h-14">VOLVER AL PANEL</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isPasante = user?.nivel_codigo === 'internar';

  return (
    <Layout>
      <Header title="Programa de Referidos" />
      
      <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-32 animate-in">
        {/* Banner Principal Hero - Premium Style */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-sav-accent to-sav-secondary rounded-m3-lg blur opacity-20 transition duration-1000 group-hover:opacity-40"></div>
          <Card className="relative p-10 text-center bg-zinc-950/60 backdrop-blur-3xl border border-white/10 rounded-m3-lg overflow-hidden shadow-m3-3">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-sav-accent/20 rounded-full blur-[60px]" />
            <div className="relative z-10 flex flex-col items-center space-y-6">
              <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-tr from-sav-accent to-sav-secondary flex items-center justify-center text-white shadow-accent-glow">
                <Users size={36} strokeWidth={2} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold uppercase tracking-tight text-white leading-none">¡Invita y Gana!</h2>
                <div className="h-1 w-12 bg-gradient-to-r from-sav-accent to-sav-secondary rounded-full mx-auto" />
                <p className="text-[10px] text-sav-muted font-bold uppercase tracking-[0.4em] mt-3">Construye tu red global</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Card de Información de Invitación - Glassmorphism */}
        <Card className="p-8 space-y-8 bg-white/[0.03] border-white/10 shadow-m3-3 rounded-m3-lg">
          <div className="space-y-8">
            {/* Código de Invitación */}
            <div className="flex flex-col items-center space-y-4">
              <span className="text-[11px] font-bold text-sav-muted uppercase tracking-[0.3em]">Tu Código Institucional</span>
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 bg-white/[0.03] py-5 rounded-2xl border border-white/10 text-center shadow-inner group hover:border-sav-accent/30 transition-all min-w-0">
                  <span className="text-4xl font-bold text-white tracking-[0.3em] truncate block px-2 uppercase">
                    {user?.codigo_invitacion || '------'}
                  </span>
                </div>
                <button 
                  onClick={handleCopyCode}
                  className={cn(
                    "w-16 h-16 rounded-2xl transition-all duration-500 flex items-center justify-center shadow-lg active:scale-90 shrink-0",
                    copiedCode ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-sav-accent text-white shadow-accent-glow"
                  )}
                >
                  {copiedCode ? <Check size={28} /> : <Copy size={28} />}
                </button>
              </div>
            </div>

            <div className="h-px bg-white/5 w-full rounded-full" />

            {/* Enlace de Invitación */}
            <div className="flex flex-col items-center space-y-4">
              <span className="text-[11px] font-bold text-sav-muted uppercase tracking-[0.3em]">Enlace Directo</span>
              <div className="flex items-center gap-3 w-full bg-white/[0.02] p-3 rounded-2xl border border-white/5 shadow-inner min-w-0">
                <div className="flex-1 truncate px-4">
                  <span className="text-[11px] font-bold text-zinc-500 tracking-tight truncate block">
                    {inviteLink}
                  </span>
                </div>
                <button 
                  onClick={handleCopyLink}
                  className={cn(
                    "px-8 h-12 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 shrink-0 shadow-lg",
                    copiedLink ? "bg-emerald-500 text-white" : "bg-sav-accent text-white hover:brightness-110"
                  )}
                >
                  {copiedLink ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
            
            <div className="pt-4">
              <div className="w-full rounded-3xl overflow-hidden border border-white/10 shadow-m3-1 bg-black/40">
                <img src="/imag/referidos.png" alt="Programa de Referidos" className="w-full h-auto object-contain opacity-80" />
              </div>
            </div>
          </div>
        </Card>

        {/* Beneficios - Premium List */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 px-1">
            <Zap size={16} className="text-sav-accent" />
            <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Bonificaciones de Red</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: Gift, title: 'Bono Directo (10%)', desc: 'Comisión inmediata por cada inversión directa.', color: 'text-sav-accent', bg: 'bg-sav-accent/10' },
              { icon: TrendingUp, title: 'Rendimiento de Equipo', desc: 'Hasta 3% por referidos indirectos.', color: 'text-sav-secondary', bg: 'bg-sav-secondary/10' },
              { icon: ShieldCheck, title: 'Estatus Verificado', desc: 'Sistema de liquidación instantánea.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
            ].map((b, i) => (
              <Card key={i} className="flex items-center gap-5 p-5 bg-white/[0.02] border-white/5 group hover:border-white/10 transition-all duration-500 shadow-m3-2 rounded-[2rem]">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-white/5 transition-transform group-hover:scale-110", b.bg, b.color)}>
                  <b.icon size={28} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[12px] font-bold text-white uppercase tracking-wider truncate">{b.title}</h4>
                  <p className="text-[10px] text-sav-muted font-bold leading-relaxed mt-1 uppercase tracking-wide truncate">{b.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {isPasante && (
          <Card className="p-6 bg-sav-accent/10 border-sav-accent/20 shadow-accent-glow rounded-[2rem] animate-pulse">
            <div className="flex items-start gap-4 text-sav-accent">
              <Info size={24} className="shrink-0" />
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold uppercase tracking-widest">Nivel de Usuario: Pasante</h4>
                <p className="text-[10px] font-medium leading-relaxed uppercase tracking-tight">
                  Como Pasante, tus invitaciones son limitadas. Actualiza a un nivel VIP GLOBAL para desbloquear el potencial ilimitado de tu red.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Sección de Referidos */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-sav-accent" />
              <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Mi Equipo de Red</h3>
            </div>
            <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/10">
              {['A', 'B', 'C'].map(n => (
                <button
                  key={n}
                  onClick={() => setSelectedNivel(n)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                    selectedNivel === n ? "bg-sav-accent text-white shadow-lg" : "text-zinc-600 hover:text-white"
                  )}
                >
                  NIVEL {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {referralsLoading ? (
              <div className="py-10 flex flex-col items-center justify-center gap-3">
                <LoaderIcon className="animate-spin text-sav-accent" />
                <p className="text-[9px] font-bold text-sav-muted uppercase tracking-[0.2em]">Sincronizando red...</p>
              </div>
            ) : referrals.length > 0 ? (
              referrals.map((ref) => (
                <Card key={ref.id} className="p-5 flex items-center justify-between bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-sav-accent transition-colors">
                      <User size={24} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-[12px] font-bold text-white uppercase tracking-tight truncate">{ref.nombre_usuario}</h4>
                        <Badge variant="info" className="text-[8px] py-0 px-1.5">{displayLevelCode(ref.nivel_codigo)}</Badge>
                      </div>
                      <p className="text-[10px] font-bold text-sav-muted tracking-widest">{ref.telefono}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div className="hidden sm:block">
                      <p className="text-[9px] font-bold text-sav-muted uppercase tracking-widest mb-0.5">F. Registro</p>
                      <p className="text-[10px] font-bold text-white uppercase">{new Date(ref.created_at).toLocaleDateString()}</p>
                    </div>
                    {ref.nivel_codigo === 'internar' && (
                      <button
                        onClick={() => handleDeleteReferral(ref.id)}
                        disabled={deletingId === ref.id}
                        className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all active:scale-90"
                      >
                        {deletingId === ref.id ? <LoaderIcon className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto text-zinc-800">
                  <Users size={32} />
                </div>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">No tienes socios en el Nivel {selectedNivel}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
