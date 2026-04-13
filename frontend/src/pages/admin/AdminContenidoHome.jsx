import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Save, Clock, Calendar, Info, ShieldCheck, Gift, Bell, Play, MessageCircle, Users, Compass, Trash2, Plus, Image as ImageIcon } from 'lucide-react';

function defaultHorario() {
  return {
    enabled: false,
    dias_semana: [1, 2, 3, 4, 5, 6, 0],
    hora_inicio: '09:00',
    hora_fin: '18:00',
  };
}

function HorarioEditor({ label, value, onChange }) {
  const days = [
    { v: 0, l: 'Do' },
    { v: 1, l: 'Lu' },
    { v: 2, l: 'Ma' },
    { v: 3, l: 'Mi' },
    { v: 4, l: 'Ju' },
    { v: 5, l: 'Vi' },
    { v: 6, l: 'Sá' },
  ];
  const toggle = (v) => {
    const cur = new Set(value?.dias_semana || []);
    if (cur.has(v)) cur.delete(v);
    else cur.add(v);
    onChange({ ...(value || defaultHorario()), dias_semana: [...cur].sort((a, b) => a - b) });
  };
  const v = value || defaultHorario();
  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!v.enabled}
          onChange={(e) => onChange({ ...v, enabled: e.target.checked })}
        />
        <span className="font-medium text-gray-800">{label}</span>
      </label>
      <p className="text-xs text-gray-600">
        Si está desactivado, no hay restricción de horario para esta operación.
      </p>
      <div className="flex flex-wrap gap-2">
        {days.map((d) => (
          <button
            key={d.v}
            type="button"
            onClick={() => toggle(d.v)}
            className={`px-2 py-1 rounded-lg text-sm border ${
              (v.dias_semana || []).includes(d.v)
                ? 'bg-sav-primary text-white border-sav-primary'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {d.l}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Desde (hora local)</label>
          <input
            type="time"
            value={v.hora_inicio || '09:00'}
            onChange={(e) => onChange({ ...v, hora_inicio: e.target.value })}
            className="rounded-lg border border-gray-300 px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Hasta</label>
          <input
            type="time"
            value={v.hora_fin || '18:00'}
            onChange={(e) => onChange({ ...v, hora_fin: e.target.value })}
            className="rounded-lg border border-gray-300 px-2 py-1"
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminContenidoHome() {
  const [form, setForm] = useState({
    home_guide: '',
    popup_title: '',
    popup_message: '',
    popup_enabled: true,
    conferencia_title: '',
    conferencia_noticias: '',
    horario_recarga: defaultHorario(),
    horario_retiro: defaultHorario(),
    comision_retiro: 12,
    require_s3_subordinates: true,
    recompensas_visibles: true,
    recompensa_amigos_activa: true,
    recompensa_amigos_cantidad: 10,
    recompensa_amigos_nivel_minimo: 'Global1',
    telegram_recargas_token: '',
    telegram_recargas_chat_id: '',
    telegram_recargas_enabled: true,
    telegram_retiros_token: '',
    telegram_retiros_chat_id: '',
    telegram_retiros_enabled: true,
    telegram_global_enabled: true,
    soporte_gerente_url: '',
    soporte_canal_url: '',
    ruleta_activa: true,
  });
  const [saving, setSaving] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState({ titulo: '', contenido: '', imagen_url: '' });

  useEffect(() => {
    api.admin.publicContent().then(setForm).catch(() => {});
    fetchMensajes();
  }, []);

  const fetchMensajes = async () => {
    try {
      const data = await api.admin.mensajes();
      setMensajes(data || []);
    } catch (e) {}
  };

  const handleCreateMensaje = async () => {
    if (!nuevoMensaje.titulo || !nuevoMensaje.contenido) return alert('Título y contenido son obligatorios');
    try {
      await api.admin.crearMensaje(nuevoMensaje);
      setNuevoMensaje({ titulo: '', contenido: '', imagen_url: '' });
      fetchMensajes();
      alert('Mensaje creado');
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteMensaje = async (id) => {
    if (!confirm('¿Eliminar este comunicado?')) return;
    try {
      await api.admin.eliminarMensaje(id);
      fetchMensajes();
    } catch (e) {
      alert(e.message);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.admin.updatePublicContent(form);
      setForm(updated);
      alert('Contenido actualizado');
    } catch (e) {
      alert(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-sav-primary uppercase tracking-tighter">CV Global — Configuración</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Control Global de Contenido</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm p-6 md:p-8 space-y-8 border border-gray-100">
        <div className="space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Guía y Notificaciones</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Guía (bloque azul en Home)</label>
              <textarea
                rows={3}
                value={form.home_guide || ''}
                onChange={(e) => setForm((f) => ({ ...f, home_guide: e.target.value }))}
                className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
                placeholder="Texto de guia para principiantes"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Título de notificación</label>
                <input
                  type="text"
                  value={form.popup_title || ''}
                  onChange={(e) => setForm((f) => ({ ...f, popup_title: e.target.value }))}
                  className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Estado</label>
                <label className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!form.popup_enabled}
                    onChange={(e) => setForm((f) => ({ ...f, popup_enabled: e.target.checked }))}
                    className="w-5 h-5 rounded-lg border-2 border-gray-300 text-sav-primary focus:ring-0 transition-all"
                  />
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors">Mostrar al entrar</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Mensaje de notificación</label>
              <textarea
                rows={3}
                value={form.popup_message || ''}
                onChange={(e) => setForm((f) => ({ ...f, popup_message: e.target.value }))}
                className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Configuración de Retiros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Comisión de Retiro (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.comision_retiro || 12}
                  onChange={(e) => setForm((f) => ({ ...f, comision_retiro: parseFloat(e.target.value) }))}
                  className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
                  placeholder="Ej: 12"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">%</span>
              </div>
              <p className="text-[10px] text-gray-400 italic ml-2 font-medium">Este porcentaje se aplicará a todos los retiros realizados por los usuarios.</p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Restricciones de Niveles</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Requisito para Global4/Global5</label>
              <label className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!form.require_s3_subordinates}
                  onChange={(e) => setForm((f) => ({ ...f, require_s3_subordinates: e.target.checked }))}
                  className="w-5 h-5 rounded-lg border-2 border-gray-300 text-sav-primary focus:ring-0 transition-all"
                />
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors">
                  Exigir 20 subordinados Global3 para subir a Global4/Global5
                </span>
              </label>
              <p className="text-[10px] text-gray-400 italic ml-2 font-medium">
                Si está activado, el sistema verificará automáticamente que el usuario tenga 20 subordinados de nivel Global3 antes de permitirle solicitar el ascenso a Global4 o Global5.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Configuración de Recompensas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Visibilidad Global</label>
              <label className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!form.recompensas_visibles}
                  onChange={(e) => setForm((f) => ({ ...f, recompensas_visibles: e.target.checked }))}
                  className="w-5 h-5 rounded-lg border-2 border-gray-300 text-sav-primary focus:ring-0 transition-all"
                />
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors">
                  Mostrar sección de recompensas
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Reto de Amigos (Global1+)</label>
              <label className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!form.recompensa_amigos_activa}
                  onChange={(e) => setForm((f) => ({ ...f, recompensa_amigos_activa: e.target.checked }))}
                  className="w-5 h-5 rounded-lg border-2 border-gray-300 text-sav-primary focus:ring-0 transition-all"
                />
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors">
                  Activar reto de 10 amigos
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Notificaciones de Telegram</h2>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!form.telegram_global_enabled}
                onChange={(e) => setForm((f) => ({ ...f, telegram_global_enabled: e.target.checked }))}
                className="w-4 h-4 rounded text-sav-primary focus:ring-0"
              />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-sav-primary transition-colors">Sistema Activo</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bot de Recargas */}
            <div className={`p-6 rounded-3xl border-2 transition-all ${form.telegram_recargas_enabled ? 'bg-emerald-50/30 border-emerald-500/10' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${form.telegram_recargas_enabled ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <Bell size={18} />
                  </div>
                  <span className="text-xs font-black text-gray-700 uppercase tracking-widest">Bot de Recargas</span>
                </div>
                <input
                  type="checkbox"
                  checked={!!form.telegram_recargas_enabled}
                  onChange={(e) => setForm((f) => ({ ...f, telegram_recargas_enabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Token del Bot</label>
                  <input
                    type="password"
                    value={form.telegram_recargas_token || ''}
                    onChange={(e) => setForm((f) => ({ ...f, telegram_recargas_token: e.target.value }))}
                    placeholder="8732160195:AA..."
                    className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-xs font-bold focus:border-emerald-500/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Chat IDs (Separados por coma)</label>
                  <input
                    type="text"
                    value={form.telegram_recargas_chat_id || ''}
                    onChange={(e) => setForm((f) => ({ ...f, telegram_recargas_chat_id: e.target.value }))}
                    placeholder="-1001234567, 987654321"
                    className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-xs font-bold focus:border-emerald-500/50 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Bot de Retiros */}
            <div className={`p-6 rounded-3xl border-2 transition-all ${form.telegram_retiros_enabled ? 'bg-blue-50/30 border-blue-500/10' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${form.telegram_retiros_enabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <Bell size={18} />
                  </div>
                  <span className="text-xs font-black text-gray-700 uppercase tracking-widest">Bot de Retiros</span>
                </div>
                <input
                  type="checkbox"
                  checked={!!form.telegram_retiros_enabled}
                  onChange={(e) => setForm((f) => ({ ...f, telegram_retiros_enabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-500 focus:ring-0"
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Token del Bot</label>
                  <input
                    type="password"
                    value={form.telegram_retiros_token || ''}
                    onChange={(e) => setForm((f) => ({ ...f, telegram_retiros_token: e.target.value }))}
                    placeholder="8715456427:AA..."
                    className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-xs font-bold focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Chat IDs (Separados por coma)</label>
                  <input
                    type="text"
                    value={form.telegram_retiros_chat_id || ''}
                    onChange={(e) => setForm((f) => ({ ...f, telegram_retiros_chat_id: e.target.value }))}
                    placeholder="-1001234567, 987654321"
                    className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-xs font-bold focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Horarios de Operación</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HorarioEditor
              label="Restringir recargas"
              value={form.horario_recarga}
              onChange={(h) => setForm((f) => ({ ...f, horario_recarga: h }))}
            />
            <HorarioEditor
              label="Restringir retiros"
              value={form.horario_retiro}
              onChange={(h) => setForm((f) => ({ ...f, horario_retiro: h }))}
            />
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Noticias de conferencia</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Título de sección</label>
              <input
                type="text"
                value={form.conferencia_title || ''}
                onChange={(e) => setForm((f) => ({ ...f, conferencia_title: e.target.value }))}
                className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Contenido de la reunión</label>
              <textarea
                rows={6}
                value={form.conferencia_noticias || ''}
                onChange={(e) => setForm((f) => ({ ...f, conferencia_noticias: e.target.value }))}
                className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none font-mono"
                placeholder={'• Reunión sábado 10:00\n• Tema: niveles\n• Enlace Zoom: ...'}
              />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Comunicados Globales (Sección Mensajes)</h2>
            <div className="bg-sav-primary/10 text-sav-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {mensajes.length} Publicados
            </div>
          </div>

          <div className="space-y-6">
            {/* Formulario Nuevo Mensaje */}
            <div className="bg-gray-50/50 rounded-3xl p-6 border-2 border-dashed border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Título del Comunicado</label>
                  <input
                    type="text"
                    value={nuevoMensaje.titulo}
                    onChange={(e) => setNuevoMensaje({...nuevoMensaje, titulo: e.target.value})}
                    placeholder="Ej: Mantenimiento Programado"
                    className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-xs font-bold focus:border-sav-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">URL de Imagen (Opcional)</label>
                  <div className="relative">
                    <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={nuevoMensaje.imagen_url}
                      onChange={(e) => setNuevoMensaje({...nuevoMensaje, imagen_url: e.target.value})}
                      placeholder="https://..."
                      className="w-full rounded-xl bg-white border border-gray-200 pl-10 pr-4 py-3 text-xs font-bold focus:border-sav-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Contenido del Mensaje</label>
                <textarea
                  rows={3}
                  value={nuevoMensaje.contenido}
                  onChange={(e) => setNuevoMensaje({...nuevoMensaje, contenido: e.target.value})}
                  placeholder="Escribe el cuerpo del mensaje aquí..."
                  className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-xs font-bold focus:border-sav-primary outline-none transition-all"
                />
              </div>
              <button
                onClick={handleCreateMensaje}
                className="w-full flex items-center justify-center gap-2 bg-sav-primary hover:bg-sav-primary/90 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]"
              >
                <Plus size={16} /> Publicar Nuevo Comunicado
              </button>
            </div>

            {/* Lista de Mensajes */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {mensajes.map((m) => (
                <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-sav-primary/20 transition-all group">
                  {m.imagen_url && (
                    <img src={m.imagen_url} className="w-12 h-12 rounded-lg object-cover bg-gray-100" alt="" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-gray-800 uppercase truncate">{m.titulo}</h4>
                    <p className="text-[10px] text-gray-400 truncate">{m.contenido}</p>
                    <p className="text-[8px] font-bold text-gray-300 uppercase mt-0.5">
                      {new Date(m.fecha).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteMensaje(m.id)}
                    className="p-2 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Soporte y Funciones Especiales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                <MessageCircle size={12} /> WhatsApp Gerente (URL)
              </label>
              <input
                type="text"
                value={form.soporte_gerente_url || ''}
                onChange={(e) => setForm((f) => ({ ...f, soporte_gerente_url: e.target.value }))}
                className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
                placeholder="https://wa.me/..."
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                <Users size={12} /> Canal de WhatsApp (URL)
              </label>
              <input
                type="text"
                value={form.soporte_canal_url || ''}
                onChange={(e) => setForm((f) => ({ ...f, soporte_canal_url: e.target.value }))}
                className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
                placeholder="https://whatsapp.com/channel/..."
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                <Compass size={12} /> Sistema de Ruleta
              </label>
              <label className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!form.ruleta_activa}
                  onChange={(e) => setForm((f) => ({ ...f, ruleta_activa: e.target.checked }))}
                  className="w-5 h-5 rounded-lg border-2 border-gray-300 text-sav-primary focus:ring-0 transition-all"
                />
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors">
                  Activar botón de ruleta en Home
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-10 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-3 bg-sav-primary hover:bg-sav-primary/90 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-sav-glow active:scale-95 transition-all disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
