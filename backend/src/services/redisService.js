import Redis from 'ioredis';
import Redlock from 'redlock';
import logger from '../lib/logger.js';
import 'dotenv/config';

/**
 * Enterprise Redis Cluster Configuration.
 * Soporta múltiples nodos para quorum en Redlock.
 */
const nodes = [
  { host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT || 6379 }
  // Agregar más nodos en producción:
  // { host: process.env.REDIS_HOST_2, port: 6379 },
  // { host: process.env.REDIS_HOST_3, port: 6379 }
];

const redisClients = nodes.map(node => new Redis({
  ...node,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: times => Math.min(times * 50, 2000),
  maxRetriesPerRequest: null,
}));

// Cliente principal para BullMQ y Cache
const redis = redisClients[0];

// Configuración de Redlock Enterprise (Quorum distribuido)
const redlock = new Redlock(redisClients, {
  driftFactor: 0.01,
  retryCount: 15,
  retryDelay: 150,
  retryJitter: 100,
  automaticExtensionThreshold: 1000, // Extensión automática para jobs largos
});

redlock.on('error', (err) => {
  if (err instanceof Redlock.ExecutionError) return; // Ignorar fallos de adquisición esperados
  logger.error('[REDLOCK] Error Crítico:', err);
});

redis.on('connect', () => logger.info('[REDIS] Nodo Principal Conectado.'));

/**
 * Adquiere un Lock Distribuido Enterprise.
 */
export const acquireLock = async (resource, ttl = 10000) => {
  try {
    return await redlock.acquire([`lock:${resource}`], ttl);
  } catch (err) {
    return null;
  }
};

export const releaseLock = async (lock) => {
  if (!lock) return;
  try {
    await lock.release();
  } catch (err) {
    // Lock ya expirado o liberado
  }
};

export const checkGlobalRateLimit = async (userId, traceId = 'enterprise') => {
  const key = `ratelimit:${userId}`;
  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, 60);
  return current <= 10;
};

export const checkIdempotencyRedis = async (id) => {
  const key = `idem:${id}`;
  const exists = await redis.get(key);
  if (exists) return true;
  await redis.set(key, '1', 'EX', 172800); // 48h para nivel Enterprise
  return false;
};

/**
 * Cierre limpio para Graceful Shutdown.
 */
export const closeRedis = async () => {
  logger.info('[REDIS] Cerrando conexiones de cluster...');
  await Promise.all(redisClients.map(client => client.quit()));
};

export default redis;
