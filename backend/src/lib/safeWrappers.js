import logger from './logger.js';

/**
 * safeAsync - Wrapper universal para funciones asíncronas de negocio.
 * Garantiza que ninguna excepción no capturada se propague al core.
 * @param {Function} fn - Función asíncrona a ejecutar.
 * @param {string} context - Contexto descriptivo para el log.
 * @returns {Promise<any|null>}
 */
export async function safeAsync(fn, context = 'GeneralAsync') {
  try {
    return await fn();
  } catch (err) {
    logger.error(`[SAFE-ASYNC-ERROR] ${context}: ${err.message}`, { 
      stack: err.stack,
      time: new Date().toISOString()
    });
    return null;
  }
}

/**
 * Alias para compatibilidad con servicios que ya usen safeTelegram u otros.
 */
export const safe = safeAsync;
