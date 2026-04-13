import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getMetodosQr, getRecargasByUser, createRecarga, updateRecarga, getPublicContent, getLevels, boliviaTime } from '../lib/queries.js';
import { supabase, hasDb } from '../lib/db.js';
import { authenticate } from '../middleware/auth.js';
import { attachRequestUser } from '../middleware/requestContext.js';
import { mergePublicContent } from '../data/publicContentDefaults.js';
import { isScheduleOpen } from '../lib/schedule.js';
import { telegram } from '../lib/telegram.js';
import logger from '../lib/logger.js';

const router = Router();

// In-memory lock to prevent duplicate recharge requests
const rechargeLocks = new Set();

router.get('/metodos', async (req, res) => {
  try {
    const metodos = await getMetodosQr();
    res.json((metodos || []).map(m => ({ 
      id: m.id, 
      nombre_titular: m.nombre_titular, 
      imagen_qr_url: m.imagen_qr_url, 
      imagen_base64: m.imagen_base64 
    })));
  } catch (err) {
    logger.error('[Recharges] Error en get /metodos:', err.message);
    res.status(500).json({ error: 'Error al obtener métodos de pago' });
  }
});

router.get('/', authenticate, attachRequestUser, async (req, res) => {
  try {
    const list = await getRecargasByUser(req.user.id);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tus recargas' });
  }
});

router.post('/', authenticate, attachRequestUser, async (req, res) => {
  try {
    const { monto, metodo_qr_id, comprobante_url, modo } = req.body;
    
    // --- BLOQUEO ANTI-DUPLICADO (Race Condition Prevention) ---
    const lockKey = `recharge:${req.user.id}`;
    if (rechargeLocks.has(lockKey)) {
      logger.warn(`[BLOQUEO] Petición duplicada de recarga detectada para ${lockKey}.`);
      return res.status(429).json({ error: 'Procesando tu solicitud de recarga anterior. Por favor, espera.' });
    }
    
    rechargeLocks.add(lockKey);
    const lockTimeout = setTimeout(() => rechargeLocks.delete(lockKey), 30000);

    try {
      if (!monto || isNaN(parseFloat(monto))) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const config = await getPublicContent();
    const pc = mergePublicContent(config);
    const sched = isScheduleOpen(pc.horario_recarga);
    if (!sched.ok) {
      return res.status(400).json({
        error: `Intento de recargar fuera del horario: ${sched.message}`,
      });
    }
    const user = req.requestUser;
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // --- RESTRICCIÓN DE MÁXIMO 3 RECARGAS AL DÍA ---
    try {
      const userRecargas = await getRecargasByUser(req.user.id);
      const todayStr = boliviaTime.todayStr();
      const recargasHoy = userRecargas.filter(r => boliviaTime.getDateString(r.created_at) === todayStr);
      
      if (recargasHoy.length >= 3) {
        return res.status(429).json({ 
          error: 'Has alcanzado el límite máximo de 3 solicitudes de recarga por día. Por favor, vuelve a intentarlo mañana.',
          limit_reached: true
        });
      }
    } catch (err) {
      logger.error('[Recharge] Error al validar límite diario:', err);
    }

    // Validar requisitos para Global 4/Global 5 (20 subordinados Global 3)
    const niveles = await getLevels();
    const nivelDestino = niveles.find(l => (l.deposito || l.costo) === parseFloat(monto));
    if (nivelDestino && ['Global 4', 'Global 5'].includes(nivelDestino.codigo)) {
      if (hasDb() && pc.require_s3_subordinates !== false) {
        const { data: teamData } = await supabase.from('usuarios').select('nivel_id').eq('invitado_por', user.id);
        const s3Level = niveles.find(l => l.codigo === 'Global 3');
        const s3Count = (teamData || []).filter(u => String(u.nivel_id) === String(s3Level?.id)).length;

        if (s3Count < 20) {
          return res.status(400).json({ error: `Para ascender a ${nivelDestino.nombre} necesitas al menos 20 subordinados de nivel Global 3. Actualmente tienes ${s3Count}.` });
        }
      }
    }

    const recarga = {
      id: uuidv4(),
      usuario_id: req.user.id,
      metodo_qr_id: metodo_qr_id || null,
      monto: parseFloat(monto) || 0,
      comprobante_url: comprobante_url || '',
      modo: modo || 'Compra VIP',
      estado: 'pendiente',
      created_at: boliviaTime.now().toISOString(),
    };
    
    logger.info(`[Recharge] Creating recharge for ${user?.nombre_usuario} - Amount: ${recarga.monto}`);
    const startDb = Date.now();
    await createRecarga(recarga);
    logger.info(`[Recharge] Recharge created in DB in ${Date.now() - startDb}ms: ${recarga.id}`);

    // Responder inmediatamente al cliente para evitar timeouts, 
    // y procesar las notificaciones en segundo plano.
    res.json(recarga);

    // Notificar por Telegram (Bot de Recargas) en segundo plano
    (async () => {
      try {
        const msg = `<b>🔔 NUEVA RECARGA PENDIENTE</b>\n\n` +
          `<b>👤 Usuario:</b> ${user?.nombre_usuario || req.user.id}\n` +
          `<b>📛 Nombre Real:</b> ${user?.nombre_real || 'No especificado'}\n` +
          `<b>📱 Teléfono:</b> ${user?.telefono || 'No disponible'}\n\n` +
          `<b>💰 MONTO:</b> <u>${recarga.monto.toFixed(2)} BOB</u>\n` +
          `<b>🛠 MODO:</b> ${recarga.modo}\n\n` +
          `<b>🕒 Fecha:</b> ${new Date(recarga.created_at).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}`;
        
        let results = [];
        if (recarga.comprobante_url && recarga.comprobante_url.startsWith('data:image')) {
          logger.info(`[Recharge] Sending Telegram with photo for ${recarga.id}`);
          results = await telegram.sendRecargaConFoto(msg, recarga.comprobante_url, recarga.id);
          logger.info(`[Recharge] Telegram with photo sent for ${recarga.id}`);
        } else {
          logger.info(`[Recharge] Sending Telegram text only for ${recarga.id}`);
          results = await telegram.sendRecarga(msg, recarga.id);
          logger.info(`[Recharge] Telegram text sent for ${recarga.id}`);
        }

        if (results && results.length > 0) {
          await updateRecarga(recarga.id, { telegram_metadata: results });
          logger.info(`[Recharge] Metadata stored for ${recarga.id}: ${results.length} messages`);
        }
      } catch (tgErr) {
        logger.error(`[Recharge] Error en notificación de Telegram:`, tgErr);
      }
    })();
    } finally {
      clearTimeout(lockTimeout);
      rechargeLocks.delete(lockKey);
    }
  } catch (err) {
    logger.error('[Recharge] Error fatal en POST /:', err);
    res.status(500).json({ error: 'Error interno al procesar la recarga' });
  }
});

export default router;
