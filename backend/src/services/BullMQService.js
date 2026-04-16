import { Queue, Worker, QueueEvents } from 'bullmq';
import redis from './redisService.js';
import logger from '../lib/logger.js';
import 'dotenv/config';

// 1. Configuración de Cola Principal para Telegram
const telegramQueue = new Queue('telegram-notifications', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: { age: 7 * 24 * 3600 }, // Guardar fallos por 7 días (Auditoría)
  },
});

// 2. Circuit Breaker - Monitoreo de salud de la API de Telegram
let isTelegramPaused = false;
let consecutiveFailures = 0;
const FAILURE_THRESHOLD = 15; // Aumentado para mayor tolerancia

/**
 * Worker con Dead Letter Queue implícito y Circuit Breaker Robusto.
 */
const telegramWorker = new Worker('telegram-notifications', async (job) => {
  if (isTelegramPaused) {
    logger.warn(`[CIRCUIT-BREAKER] Omitiendo job ${job.id} - Telegram en pausa.`);
    throw new Error('Telegram API pausada temporalmente por fallos críticos.');
  }

  const { botToken, chatId, message, options, traceId } = job.data;
  
  try {
    const { default: TelegramBot } = await import('node-telegram-bot-api');
    const bot = new TelegramBot(botToken);
    const res = await bot.sendMessage(chatId, message, options);
    
    // Éxito: Resetear Circuit Breaker gradualmente
    if (consecutiveFailures > 0) consecutiveFailures--;
    return res;
  } catch (err) {
    consecutiveFailures++;
    logger.error(`[BULLMQ] Error en envío (${chatId}): ${err.message}`, { traceId });

    // Activar Circuit Breaker si se supera el umbral crítico
    if (consecutiveFailures >= FAILURE_THRESHOLD && !isTelegramPaused) {
      isTelegramPaused = true;
      logger.error(`[CIRCUIT-BREAKER] ACTIVADO tras ${consecutiveFailures} fallos. Pausando envíos por 2 min.`);
      
      setTimeout(() => {
        isTelegramPaused = false;
        consecutiveFailures = Math.floor(FAILURE_THRESHOLD / 2); // Reanudar en modo "Half-Open"
        logger.info('[CIRCUIT-BREAKER] Reintentando comunicación con Telegram (Modo Half-Open).');
      }, 2 * 60 * 1000);
    }

    throw err;
  }
}, { 
  connection: redis,
  concurrency: 20, // Mayor capacidad de procesamiento paralelo
  limiter: {
    max: 25, // Un poco más conservador por segundo
    duration: 1000,
  }
});

telegramWorker.on('failed', (job, err) => {
  logger.error(`[BULLMQ] Job ${job.id} falló permanentemente. Enviado a DLQ (Fallidos).`, { 
    error: err.message,
    traceId: job.data.traceId 
  });
});

export const enqueueTelegramMessage = async (botToken, chatId, message, options = {}, traceId = 'system') => {
  return await telegramQueue.add('send-message', {
    botToken,
    chatId,
    message,
    options: { parse_mode: 'HTML', ...options },
    traceId
  });
};

export default telegramQueue;
