import { query, queryOne } from '../config/db.js';
import redis from './redisService.js';
import logger from '../lib/logger.js';

/**
 * SupportService - Herramientas de Soporte y Debugging SaaS.
 * Reservado para Global Admins.
 */
export const SupportService = {
  
  /**
   * Obtiene el estado técnico completo de un tenant.
   */
  async getTenantHealth(tenantId) {
    try {
      const [dbStats, redisStats, logs] = await Promise.all([
        queryOne(`SELECT COUNT(*) as users, subscription_status, trial_ends_at FROM tenants t JOIN usuarios u ON t.id = u.tenant_id WHERE t.id = ?`, [tenantId]),
        redis.get(`ratelimit:${tenantId}:*`), // Ejemplo: conteo de rate limits activos
        query(`SELECT * FROM saas_audit_logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10`, [tenantId])
      ]);

      return {
        tenantId,
        database: dbStats,
        active_rate_limits: redisStats,
        recent_logs: logs,
        timestamp: new Date()
      };
    } catch (err) {
      logger.error(`[SUPPORT-HEALTH-ERROR]: ${err.message}`);
      throw err;
    }
  },

  /**
   * Resetea límites de un tenant manualmente (Cortesía o Debug).
   */
  async resetTenantUsage(tenantId, metric) {
    await query(
      `UPDATE tenant_usage SET current_value = 0 WHERE tenant_id = ? AND metric_name = ?`,
      [tenantId, metric]
    );
    logger.info(`[SUPPORT] Uso de ${metric} reseteado para ${tenantId}`);
  }
};
