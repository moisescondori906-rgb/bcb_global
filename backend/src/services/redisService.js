import Redis from 'ioredis';
import Redlock from 'redlock';
import logger from '../lib/logger.js';
import 'dotenv/config';

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
  maxRetriesPerRequest: null,
};

const redis = new Redis(redisConfig);

// Configuración de Redlock para Locks Distribuidos Seguros
const redlock = new Redlock([redis], {
  driftFactor: 0.01,
  retryCount: 10,
  retryDelay: 200,
  retryJitter: 200,
  automaticExtensionThreshold: 500,
});

redlock.on('error', (err) => logger.error('[REDLOCK] Error:', err));

redis.on('connect', () => logger.info('[REDIS] Conectado exitosamente.'));
redis.on('error', (err) => logger.error('[REDIS] Error:', err));

/**
 * Adquiere un Lock seguro con Redlock.
 * @param {string} resource - Nombre del recurso a bloquear.
 * @param {number} ttl - Tiempo de vida en ms.
 * @returns {Promise<Object|null>} - Instancia del lock o null si falla.
 */
export const acquireLock = async (resource, ttl = 5000) => {
  try {
    return await redlock.acquire([`lock:${resource}`], ttl);
  } catch (err) {
    return null;
  }
};

/**
 * Libera un Lock de Redlock.
 */
export const releaseLock = async (lock) => {
  if (!lock) return;
  try {
    await lock.release();
  } catch (err) {
    logger.error('[REDLOCK] Error liberando lock:', err.message);
  }
};

/**
 * Rate Limit Global en Redis con Trazabilidad.
 */
export const checkGlobalRateLimit = async (userId, traceId = 'system') => {
  const key = `ratelimit:${userId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 60);
  }
  
  if (current > 10) {
    logger.warn(`[RATE-LIMIT] Bloqueado usuario ${userId}`, { traceId });
    return false;
  }
  return true;
};

/**
 * Idempotencia persistente en Redis (Cache Rápido).
 */
export const checkIdempotencyRedis = async (id) => {
  const key = `idem:${id}`;
  const exists = await redis.get(key);
  if (exists) return true;
  await redis.set(key, '1', 'EX', 86400); // 24h
  return false;
};

export default redis;
