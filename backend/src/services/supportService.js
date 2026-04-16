import { query, queryOne, secureQuery } from '../config/db.js';
import redis from './redisService.js';
import logger from '../lib/logger.js';
import { AuditService } from './auditService.js';

/**
 * SupportService - Herramientas de Soporte y Debugging SaaS.
 * Reservado para Global Admins y Soporte por Nivel.
 */
export const SupportService = {
  
  /**
   * Obtiene el estado técnico completo de un tenant con control de acceso por nivel.
   */
  async getTenantHealth(req, tenantId) {
    const adminRole = req.requestUser?.rol; // 'admin', 'support_l1', 'support_l2'
    
    try {
      // 1. Auditoría de acceso a datos sensibles de soporte
      await AuditService.log(req, 'SUPPORT_VIEW_HEALTH', 'tenant', tenantId, { adminRole });

      // 2. Control de Acceso por Nivel
      const [dbStats, redisStats] = await Promise.all([
        queryOne(`SELECT COUNT(*) as users, subscription_status, trial_ends_at FROM tenants t JOIN usuarios u ON t.id = u.tenant_id WHERE t.id = ?`, [tenantId]),
        redis.get(`ratelimit:${tenantId}:*`)
      ]);

      // Si es L1, no mostrar logs de auditoría detallados (Privacidad)
      let logs = [];
      if (adminRole !== 'support_l1') {
        logs = await query(`SELECT * FROM saas_audit_logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10`, [tenantId]);
      }

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
  async resetTenantUsage(req, tenantId, metric) {
    // Solo admins nivel Global o Soporte L2 pueden resetear uso
    if (req.requestUser?.rol === 'support_l1') {
      throw new Error('Acceso insuficiente para resetear métricas de uso.');
    }

    await query(
      `UPDATE tenant_usage SET current_value = 0 WHERE tenant_id = ? AND metric_name = ?`,
      [tenantId, metric]
    );
    
    await AuditService.log(req, 'SUPPORT_RESET_USAGE', 'tenant', tenantId, { metric });
    logger.info(`[SUPPORT] Uso de ${metric} reseteado para ${tenantId} por ${req.requestUser?.id}`);
  }
};
