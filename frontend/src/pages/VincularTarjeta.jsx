import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  ShieldCheck as ShieldCheckIcon, 
  User as UserIcon, 
  Building2 as BuildingIcon, 
  Hash as HashIcon, 
  AlertCircle as AlertCircleIcon, 
  Info as InfoIcon 
} from 'lucide-react';
import { cn } from '../lib/utils/cn';

export default function VincularTarjeta() {
  const navigate = useNavigate();
  const [nombreBanco, setNombreBanco] = useState('');
  const [tipo, setTipo] = useState('yape');
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (numero.length < 4) return setError('El número debe tener al menos 4 dígitos');
    
    setError('');
    setLoading(true);
    try {
      await api.users.addTarjeta({
        nombre_banco: nombreBanco,
        tipo,
        numero_cuenta: numero,
      });
      navigate('/seguridad');
    } catch (err) {
      setError(err.message || 'Error al guardar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Header title="Vincular Cuenta" />
      <div className="p-6 space-y-8 animate-fade">
        <div className="flex flex-col items-center text-center space-y-4 mb-2">
          <div className="w-16 h-16 rounded-3xl bg-sav-primary/10 flex items-center justify-center text-sav-primary border border-sav-primary/20 shadow-xl">
            <ShieldCheckIcon size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Seguridad de Cobro</h2>
            <p className="text-[10px] text-sav-muted font-bold uppercase tracking-widest mt-1">Configura tu método de retiro preferido</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Card className="p-6 space-y-6 bg-white/[0.02] border-white/5 shadow-2xl">
            {error && (
              <div className="p-4 rounded-2xl bg-sav-error/10 border border-sav-error/20 flex items-center gap-3 animate-shake">
                <AlertCircleIcon size={18} className="text-sav-error shrink-0" />
                <p className="text-[10px] text-sav-error font-black uppercase tracking-widest leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                <UserIcon size={12} /> Propietario de la Cuenta
              </label>
              <input
                value={nombreBanco}
                onChange={(e) => setNombreBanco(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold text-sm focus:border-sav-primary/30 focus:bg-white/10 transition-all outline-none placeholder:text-white/10"
                required
                placeholder="Nombre completo"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                <BuildingIcon size={12} /> Banco o Plataforma
              </label>
              <select 
                value={tipo} 
                onChange={(e) => setTipo(e.target.value)} 
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold text-sm focus:border-sav-primary/30 focus:bg-white/10 transition-all outline-none appearance-none"
              >
                <option value="yape" className="bg-sav-dark">Yape / Celular</option>
                <option value="banco_union" className="bg-sav-dark">Banco Unión</option>
                <option value="yasta" className="bg-sav-dark">Yasta</option>
                <option value="yolopago" className="bg-sav-dark">Yolopago</option>
                <option value="banco_mercantil" className="bg-sav-dark">Banco Mercantil</option>
                <option value="otro" className="bg-sav-dark">Otro Banco</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                <HashIcon size={12} /> Número de Cuenta / Celular
              </label>
              <input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold text-sm focus:border-sav-primary/30 focus:bg-white/10 transition-all outline-none placeholder:text-white/10"
                required
                placeholder="Mínimo 4 dígitos"
              />
              <div className="flex items-start gap-2 mt-2 px-1">
                <InfoIcon size={12} className="text-sav-muted mt-0.5" />
                <p className="text-[9px] text-sav-muted font-bold uppercase tracking-widest leading-relaxed">
                  Por seguridad, solo guardamos los últimos 4 dígitos para visualización.
                </p>
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            loading={loading}
            className="w-full h-16 rounded-3xl text-xs font-black tracking-[0.2em] shadow-2xl shadow-sav-primary/20 active:scale-95 transition-all"
          >
            GUARDAR CONFIGURACIÓN
          </Button>
        </form>

        <Card className="p-6 bg-sav-primary/5 border-sav-primary/10 rounded-[2rem]">
          <p className="text-[10px] text-sav-muted font-bold leading-relaxed uppercase tracking-widest text-center">
            Asegúrate de que los datos sean correctos. BCB Global no se hace responsable por transferencias a cuentas configuradas erróneamente.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
