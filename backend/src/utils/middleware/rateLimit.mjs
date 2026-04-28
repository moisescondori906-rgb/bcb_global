import redis from '../../services/redisService.mjs';
import logger from '../logger.mjs';

/**
 * Genera un middleware de Rate Limit basado en Redis
 * @param {string} prefix - Prefijo para la clave de Redis (ej: 'auth', 'sorteo')
 * @param {number} limit - Número máximo de peticiones
 * @param {number} window - Ventana de tiempo en segundos
 */
export const createRateLimiter = (prefix, limit, window) => {
  return async (req, res, next) => {
    const identifier = req.user?.id || req.ip; // Usar ID de usuario o IP
    const key = `ratelimit:${prefix}:${identifier}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, window);
      }

      if (current > limit) {
        logger.warn(`[RATE-LIMIT] ${prefix} excedido para ${identifier}: ${current}/${limit}`);
        return res.status(429).json({
          error: 'Demasiadas peticiones. Por favor, espera un momento.',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }
      next();
    } catch (err) {
      logger.error(`[RATE-LIMIT-ERROR] ${prefix}: ${err.message}`);
      next(); // Fallback: permitir si Redis falla
    }
  };
};
