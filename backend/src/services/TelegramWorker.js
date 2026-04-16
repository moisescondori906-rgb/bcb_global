import logger from '../lib/logger.js';

/**
 * TelegramWorker - Sistema de Cola y Reintentos para Notificaciones Críticas.
 * Separa la lógica de negocio del envío físico de mensajes a Telegram.
 */
class TelegramWorker {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 segundos entre reintentos
  }

  /**
   * Añade un mensaje a la cola de envío.
   * @param {Object} bot - Instancia del bot (Admin, Retiros o Secretaria).
   * @param {string} chatId - ID del chat destino.
   * @param {string} message - Contenido del mensaje.
   * @param {Object} options - Opciones adicionales (parse_mode, reply_markup, etc).
   */
  async addToQueue(bot, chatId, message, options = {}) {
    if (!bot || !chatId) return false;

    const job = {
      bot,
      chatId,
      message,
      options: { parse_mode: 'HTML', ...options },
      retries: 0,
      timestamp: Date.now()
    };

    this.queue.push(job);
    logger.info(`[WORKER] Nuevo mensaje en cola para ${chatId}. Total en cola: ${this.queue.length}`);

    if (!this.isProcessing) {
      this.processQueue();
    }
    return true;
  }

  /**
   * Procesa la cola de forma secuencial.
   */
  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift();

    try {
      await job.bot.sendMessage(job.chatId, job.message, job.options);
      logger.info(`[WORKER] Mensaje enviado con éxito a ${job.chatId}`);
    } catch (err) {
      job.retries++;
      logger.error(`[WORKER] Error enviando mensaje a ${job.chatId} (Intento ${job.retries}/${this.maxRetries}): ${err.message}`);

      if (job.retries < this.maxRetries) {
        // Re-encolar para reintento después de un delay
        setTimeout(() => {
          this.queue.push(job);
          if (!this.isProcessing) this.processQueue();
        }, this.retryDelay);
      } else {
        logger.error(`[WORKER] Fallo crítico: Mensaje descartado tras ${this.maxRetries} reintentos.`);
      }
    }

    // Procesar siguiente mensaje con un pequeño delay para evitar rate limits
    setTimeout(() => this.processQueue(), 500);
  }

  /**
   * Helper para generar alertas críticas formateadas.
   */
  async sendCriticalAlert(bot, chatId, title, details) {
    const alertMsg = `🚨 <b>ALERTA CRÍTICA</b>\n\n` +
      `📌 <b>Origen:</b> ${title}\n` +
      `⚠️ <b>Detalles:</b> ${details}\n` +
      `🕒 <b>Hora:</b> ${new Date().toLocaleTimeString('es-BO')}`;
    
    return this.addToQueue(bot, chatId, alertMsg);
  }
}

// Exportar instancia única (Singleton)
const worker = new TelegramWorker();
export default worker;
