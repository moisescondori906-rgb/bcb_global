import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { 
  getUsers, getLevels, findUserById, updateUser, 
  getPublicContent, approveRecarga, rejectRetiro,
  boliviaTime, distributeInvestmentCommissions, refreshPublicContent, 
  invalidateLevelsCache, preloadLevels,
  getMensajesGlobales, createMensajeGlobal, deleteMensajeGlobal
} from '../lib/queries.js';
import { query, queryOne } from '../config/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import logger from '../lib/logger.js';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

function sanitizeUser(u, levels) {
  const level = levels.find(l => String(l.id) === String(u.nivel_id));
  return {
    id: u.id,
    telefono: u.telefono,
    nombre_usuario: u.nombre_usuario,
    nombre_real: u.nombre_real,
    codigo_invitacion: u.codigo_invitacion,
    nivel: level?.nombre || 'Pasante',
    nivel_id: u.nivel_id,
    nivel_codigo: level?.codigo || 'pasante',
    saldo_principal: u.saldo_principal || 0,
    saldo_comisiones: u.saldo_comisiones || 0,
    rol: u.rol,
    bloqueado: u.bloqueado,
    tickets_ruleta: Number(u.tickets_ruleta) || 0,
    created_at: u.created_at,
  };
}

router.get('/dashboard', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'usuario') as total_usuarios,
        (SELECT COALESCE(SUM(monto), 0) FROM recargas WHERE estado = 'aprobada') as total_recargas,
        (SELECT COALESCE(SUM(monto), 0) FROM retiros WHERE estado = 'pagado') as total_retiros,
        (SELECT COUNT(*) FROM retiros WHERE estado = 'pendiente') as pendientes_retiro,
        (SELECT COUNT(*) FROM recargas WHERE estado = 'pendiente') as pendientes_recarga
    `);
    res.json(stats[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/usuarios', async (req, res) => {
  try {
    const users = await query(`SELECT * FROM usuarios`);
    const levels = await getLevels();
    const filtered = users.map(u => sanitizeUser(u, levels));
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recargas/:id/aprobar', async (req, res) => {
  try {
    const result = await approveRecarga(req.params.id, req.user.id);
    const recarga = await queryOne(`SELECT * FROM recargas WHERE id = ?`, [req.params.id]);
    if (recarga) {
      await distributeInvestmentCommissions(recarga.usuario_id, recarga.monto);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/retiros/:id/rechazar', async (req, res) => {
  try {
    await rejectRetiro(req.params.id, req.user.id, req.body.motivo);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/config', async (req, res) => {
  try {
    const updates = req.body;
    for (const [clave, valor] of Object.entries(updates)) {
      await query(`INSERT INTO configuraciones (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?`, 
        [clave, JSON.stringify(valor), JSON.stringify(valor)]);
    }
    await refreshPublicContent();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/mensajes', async (req, res) => {
  try {
    const mensajes = await getMensajesGlobales();
    res.json(mensajes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/mensajes', async (req, res) => {
  try {
    const { titulo, contenido, imagen_url } = req.body;
    if (!titulo || !contenido) return res.status(400).json({ error: 'Título y contenido requeridos' });
    const nuevo = await createMensajeGlobal({ titulo, contenido, imagen_url });
    res.json(nuevo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/mensajes/:id', async (req, res) => {
  try {
    await deleteMensajeGlobal(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
