import { query, queryOne, transaction } from '../config/db.js';
import logger from '../lib/logger.js';
import redis from './redisService.js';

/**
 * BillingService - Gestión de Planes, Límites y Suspensión Automática.
 */
export const BillingService = {

  /**
   * Verifica si un tenant tiene saldo o días de suscripción activos.
   */
  async checkSubscription(tenantId) {
    try {
      const tenant = await queryOne(
        `SELECT subscription_status, trial_ends_at FROM tenants WHERE id = ?`,
        [tenantId]
      );

      if (!tenant) return false;

      // Si está suspendido, no hay acceso
      if (tenant.subscription_status === 'suspended') return false;

      // Si es trial, verificar fecha
      if (tenant.subscription_status === 'trial') {
        const now = new Date();
        const trialEnd = new Date(tenant.trial_ends_at);
        if (now > trialEnd) {
          await this.suspendTenant(tenantId, 'trial_expired');
          return false;
        }
      }

      return true;
    } catch (err) {
      logger.error(`[BILLING-CHECK] Error for ${tenantId}:`, err.message);
      return true; // Fail-safe (Permitir acceso si falla el check)
    }
  },

  /**
   * Verifica límites de uso (Usuarios, Retiros Diarios).
   */
  async checkLimits(tenantId, metric) {
    try {
      const stats = await queryOne(
        `SELECT t.subscription_status, p.max_users, p.max_withdrawals_daily, u.current_value
         FROM tenants t
         JOIN saas_plans p ON t.plan_id = p.id
         LEFT JOIN tenant_usage u ON t.id = u.tenant_id AND u.metric_name = ?
         WHERE t.id = ?`,
        [metric, tenantId]
      );

      if (!stats) return true;

      const limit = metric === 'users_count' ? stats.max_users : stats.max_withdrawals_daily;
      const current = stats.current_value || 0;

      if (current >= limit) {
        logger.warn(`[BILLING-LIMIT] Tenant ${tenantId} alcanzó límite de ${metric}: ${current}/${limit}`);
        return false;
      }

      return true;
    } catch (err) {
      logger.error('[BILLING-LIMIT] Error:', err.message);
      return true;
    }
  },

  /**
   * Incrementa el uso de una métrica para un tenant.
   */
  async trackUsage(tenantId, metric, increment = 1) {
    try {
      await query(
        `INSERT INTO tenant_usage (tenant_id, metric_name, current_value, last_reset)
         VALUES (?, ?, ?, CURDATE())
         ON DUPLICATE KEY UPDATE 
           current_value = CASE 
             WHEN last_reset < CURDATE() AND metric_name = 'withdrawals_today' THEN VALUES(current_value)
             ELSE current_value + VALUES(current_value)
           END,
           last_reset = CURDATE()`,
        [tenantId, metric, increment]
      );
    } catch (err) {
      logger.error('[BILLING-TRACK] Error:', err.message);
    }
  },

  /**
   * Suspende un tenant por impago o infracción.
   */
  async suspendTenant(tenantId, reason) {
    logger.error(`[SaaS-BILLING] SUSPENDIENDO TENANT ${tenantId}. Razón: ${reason}`);
    await query(
      `UPDATE tenants SET subscription_status = 'suspended', config = JSON_MERGE_PATCH(config, ?) WHERE id = ?`,
      [JSON.stringify({ suspension_reason: reason, suspended_at: new Date() }), tenantId]
    );
    
    // Invalidar cache de flags/contexto para forzar logout
    await redis.del(`tenant_ctx:${tenantId}`);
  }
};
