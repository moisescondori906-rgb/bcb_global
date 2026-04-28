import logger from '../utils/logger.mjs';
import 'dotenv/config';

let RedisClient; // Renombrado para evitar conflictos con la clase Redis mock/real
let RedlockClient; // Renombrado
let redis;
let queueRedis;
let redlock;
let cluster;

if (process.env.DEMO_MODE === 'true') {
  logger.warn('⚠️ DEMO_MODE activado para Redis. Las conexiones a Redis han sido omitidas.');

  // Mock para la clase Redis de ioredis
  RedisClient = function() {
    this.status = 'ready';
    this.on = (event, handler) => {
      if (event === 'ready' || event === 'connect') {
        process.nextTick(() => handler());
      }
    };
    this.quit = async () => { logger.info('[REDIS-MOCK] quit() llamado.'); return 'OK'; };
    this.get = async (key) => { logger.debug(`[REDIS-MOCK] get(${key}) llamado.`); return null; };
    this.set = async (key, value) => { logger.debug(`[REDIS-MOCK] set(${key}, ${value}) llamado.`); return 'OK'; };
    this.setex = async (key, ttl, value) => { logger.debug(`[REDIS-MOCK] setex(${key}, ${ttl}, ${value}) llamado.`); return 'OK'; };
    this.incr = async (key) => { logger.debug(`[REDIS-MOCK] incr(${key}) llamado.`); return 0; };
    this.expire = async (key, ttl) => { logger.debug(`[REDIS-MOCK] expire(${key}, ${ttl}) llamado.`); return 0; };
    this.del = async (key) => { logger.debug(`[REDIS-MOCK] del(${key}) llamado.`); return 0; };
    this.srem = async (key, member) => { logger.debug(`[REDIS-MOCK] srem(${key}, ${member}) llamado.`); return 0; };
    this.sadd = async (key, member) => { logger.debug(`[REDIS-MOCK] sadd(${key}, ${member}) llamado.`); return 0; };
    this.smembers = async (key) => { logger.debug(`[REDIS-MOCK] smembers(${key}) llamado.`); return []; };
    this.hgetall = async (key) => { logger.debug(`[REDIS-MOCK] hgetall(${key}) llamado.`); return {}; };
    this.hset = async (key, field, value) => { logger.debug(`[REDIS-MOCK] hset(${key}, ${field}, ${value}) llamado.`); return 0; };
    this.hdel = async (key, field) => { logger.debug(`[REDIS-MOCK] hdel(${key}, ${field}) llamado.`); return 0; };
    this.multi = () => ({
        exec: async () => { logger.debug('[REDIS-MOCK] multi().exec() llamado.'); return []; },
        set: (key, value) => { logger.debug(`[REDIS-MOCK] multi().set(${key}, ${value}) llamado.`); return this; },
        expire: (key, ttl) => { logger.debug(`[REDIS-MOCK] multi().expire(${key}, ${ttl}) llamado.`); return this; }
    });
    this.pipeline = () => ({
      exec: async () => { logger.debug('[REDIS-MOCK] pipeline().exec() llamado.'); return []; }
    });
  };
  RedisClient.Cluster = RedisClient; // Mock Cluster también

  // Mock para la clase Redlock
  RedlockClient = function() {
    this.acquire = async (resources, ttl) => { logger.debug(`[REDLOCK-MOCK] acquire(${resources}, ${ttl}) llamado.`); return { release: async () => logger.debug('[REDLOCK-MOCK] release() llamado.') }; };
    // The original mock for Redlock did not have a 'release' method directly on the Redlock instance.
    // It was only on the acquired lock object. Adding a mock for it as per the new RedlockClient mock structure.
  };

  redis = new RedisClient();
  queueRedis = new RedisClient();
  redlock = new RedlockClient();

} else {
  // Usamos import dinámico para evitar ReferenceError si ioredis no está instalado
  const ioredisModule = await import('ioredis');
  RedisClient = ioredisModule.default;
  const redlockModule = await import('redlock');
  RedlockClient = redlockModule.default;

  /**
   * Enterprise Redis Cluster & Separation of Responsibilities.
   * - Cache: Almacenamiento temporal y Feature Flags.
   * - Locks: Redlock para concurrencia.
   * - Queues: BullMQ.
   * - State: Sesiones y Rate Limiting.
   */
  const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: times => Math.min(times * 50, 2000),
    maxRetriesPerRequest: null,
  };

  // 1. Cliente para Cache y Estado (Instancia principal)
  redis = new RedisClient({
    ...redisConfig,
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.slice(0, targetError.length) === targetError) {
        return true; // Reconnect on READONLY error (cluster failover)
      }
      return false;
    }
  });

  // Eventos de Resiliencia v9.0.0
  redis.on('reconnecting', (delay) => logger.warn(`[REDIS-RECONNECT] Reintentando en ${delay}ms...`));
  redis.on('error', (err) => logger.error(`[REDIS-FATAL]: ${err.message}`));
  redis.on('ready', () => logger.info('[REDIS] Sistema listo y operativo.'));

  // 2. Cliente para Colas (Dedicado para evitar bloqueos)
  queueRedis = new RedisClient(redisConfig);

  // 3. Soporte para Cluster Real (Si se define en ENV)
  let cluster = null;
  if (process.env.REDIS_CLUSTER_NODES) {
    const clusterNodes = JSON.parse(process.env.REDIS_CLUSTER_NODES);
    cluster = new RedisClient.Cluster(clusterNodes, {
      redisOptions: { password: process.env.REDIS_PASSWORD }
    });
  }

  // 4. Configuración de Redlock (Quorum)
  // Se pueden usar múltiples clientes si hay varios nodos independientes.
  redlock = new RedlockClient([redis], {
    driftFactor: 0.01,
    retryCount: 20,
    retryDelay: 100,
    retryJitter: 100,
    automaticExtensionThreshold: 2000,
  });

  redis.on('connect', () => logger.info('[REDIS] Cache/State Conectado.'));
  queueRedis.on('connect', () => logger.info('[REDIS] Queue Dedicated Conectado.'));
}

/**
 * Adquiere un Lock Distribuido Enterprise con soporte multi-tenant.
 */
export const acquireLock = async (resource, ttl = 10000, tenantId = null) => {
  const lockKey = tenantId ? `lock:${tenantId}:${resource}` : `lock:${resource}`;
  try {
    return await redlock.acquire([lockKey], ttl);
  } catch (err) {
    return null;
  }
};

export const releaseLock = async (lock) => {
  if (!lock) return;
  try {
    await lock.release();
  } catch (err) {
    // Ya liberado o expirado
  }
};

/**
 * Rate Limit segmentado por Tenant. 
 */
export const checkGlobalRateLimit = async (userId, traceId = 'enterprise', tenantId = null) => {
  const key = tenantId ? `ratelimit:${tenantId}:${userId}` : `ratelimit:${userId}`;
  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, 60);
  return current <= 20; // Umbral aumentado para Enterprise
};

export const checkIdempotencyRedis = async (id, tenantId = null) => {
  const key = tenantId ? `idem:${tenantId}:${id}` : `idem:${id}`;
  const exists = await redis.get(key);
  if (exists) return true;
  await redis.set(key, '1', 'EX', 172800); // 48h
  return false;
};

/**
 * Cierre limpio.
 */
export const closeRedis = async () => {
  logger.info('[REDIS] Cerrando conexiones de cluster...');
  await Promise.all([redis.quit(), queueRedis.quit()]);
  if (cluster) await cluster.quit();
};

export { redis as default, queueRedis, cluster, redlock };