import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { 
  getPublicContent, boliviaTime, findUserWithAuthSecrets,
  canWithdraw, requestWithdrawal
} from '../lib/queries.js';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { attachRequestUser } from '../middleware/requestContext.js';
import { 
  sendToRetiros, 
  sendToAdmin, 
  sendToSecretaria, 
  formatRetiroMessage 
} from '../services/telegramBot.js';
import logger from '../lib/logger.js';
import redis from '../services/redisService.js';

const router = Router();

// Rate Limit Config: 2 intentos de retiro por minuto
const WITHDRAW_RATE_LIMIT = 2;
const RATE_LIMIT_WINDOW = 60;

const withdrawRateLimit = async (req, res, next) => {
  const userId = req.requestUser?.id;
  if (!userId) return next();
  const key = `ratelimit:withdraw:${userId}`;
  try {
    const current = await redis.incr(key);
    if (current === 1) await redis.expire(key, RATE_LIMIT_WINDOW);
    if (current > WITHDRAW_RATE_LIMIT) {
      return res.status(429).json({ error: 'Demasiados intentos. Espera un minuto.' });
    }
    next();
  } catch (err) { next(); }
};

router.use(authenticate);
router.use(attachRequestUser);

const MONTOS_PERMITIDOS = [25, 100, 500, 1500, 5000, 10000];

router.get('/montos', (req, res) => {
  res.json(MONTOS_PERMITIDOS);
});

router.get('/', async (req, res) => {
  try {
    const list = await query(`SELECT * FROM retiros WHERE usuario_id = ? ORDER BY created_at DESC`, [req.user.id]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tus retiros' });
  }
});

router.post('/', withdrawRateLimit, async (req, res) => {
  try {
    const { monto, tipo_billetera, password_fondo, tarjeta_id, idempotency_key } = req.body;
    const user = req.requestUser;

    const iKey = idempotency_key || req.headers['x-idempotency-key'];
    if (!iKey) return res.status(400).json({ error: 'Falta clave de idempotencia' });

    const m = parseFloat(monto);
    if (!MONTOS_PERMITIDOS.includes(m)) return res.status(400).json({ error: 'Monto no permitido' });

    // 1. Verificar contraseña de fondo
    const userAuth = await findUserWithAuthSecrets(user.id);
    if (!userAuth.password_fondo_hash) return res.status(400).json({ error: 'Configura tu contraseña de fondo primero.' });
    const passOk = await bcrypt.compare(password_fondo, userAuth.password_fondo_hash);
    if (!passOk) return res.status(401).json({ error: 'Contraseña de fondo incorrecta.' });

    // 2. VALIDACIÓN CENTRALIZADA (CALENDARIO, DÍAS POR NIVEL)
    const opStatus = await canWithdraw(user.id);
    if (!opStatus.ok) return res.status(403).json({ error: opStatus.message });

    // 3. Ejecución Blindada en Service (ACID + 1 Retiro/Día + SELECT FOR UPDATE)
    const result = await requestWithdrawal(user.id, { 
      monto: m, 
      tipo_billetera, 
      tarjeta_id, 
      idempotencyKey: iKey 
    });

    // 4. Alerta de Telegram (Fuera de la transacción para no bloquear DB)
    try {
      const config = await getPublicContent();
      const message = formatRetiroMessage({
        telefono: user.nombre_usuario,
        nivel: 'Usuario', // Simplificado para la alerta
        monto: m,
        hora: boliviaTime.getTimeString()
      });
      
      const inline_keyboard = {
        reply_markup: {
          inline_keyboard: [[{ text: '🟢 Tomar Retiro', callback_data: `tomar_${result.retiroId}` }]]
        }
      };

      const [sentRetiros, sentAdmin, sentSecretaria] = await Promise.allSettled([
        sendToRetiros(message),
        sendToAdmin(message, inline_keyboard),
        sendToSecretaria(message)
      ]);

      const msgIds = {
        retiros: sentRetiros.status === 'fulfilled' ? sentRetiros.value?.message_id : null,
        admin: sentAdmin.status === 'fulfilled' ? sentAdmin.value?.message_id : null,
        secretaria: sentSecretaria.status === 'fulfilled' ? sentSecretaria.value?.message_id : null
      };

      await query(
        `UPDATE retiros SET msg_id_admin=?, msg_id_retiros=?, msg_id_secretaria=? WHERE id=?`,
        [msgIds.admin, msgIds.retiros, msgIds.secretaria, result.retiroId]
      );
    } catch (e) {
      logger.error(`[Telegram Alert Error]: ${e.message}`);
    }

    res.json({ id: result.retiroId, ok: true, trace_id: result.traceId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
