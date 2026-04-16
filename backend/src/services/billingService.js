import { query, queryOne, transaction } from '../config/db.js';
import logger from '../lib/logger.js';
import redis from './redisService.js';
import { Queue, Worker } from 'bullmq';
import { queueRedis } from './redisService.js';

// Cola para procesamiento de pagos y suscripciones
const billingQueue = new Queue('saas-billing', {
  connection: queueRedis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 10000 },
  }
});

/**
 * BillingService - Gestión de Planes, Límites y Suspensión Automática.
 */
export const BillingService = {

  /**
   * Procesa la renovación automática de un tenant.
   */
  async processRenewal(tenantId) {
    try {
      const tenant = await queryOne(
        `SELECT t.*, p.price_monthly FROM tenants t JOIN saas_plans p ON t.plan_id = p.id WHERE t.id = ?`,
        [tenantId]
      );

      // 1. Simular integración con Pasarela de Pago (Stripe/Crypto/etc)
      const paymentSuccess = await this.chargePayment(tenant.id, tenant.price_monthly);

      if (paymentSuccess) {
        await query(
          `UPDATE tenants SET subscription_status = 'active', trial_ends_at = NULL WHERE id = ?`,
          [tenantId]
        );
        await AuditService.log({ tenantId }, 'RENEWAL_SUCCESS', 'tenant', tenantId, { amount: tenant.price_monthly });
      } else {
        await this.handlePaymentFailure(tenantId);
      }
    } catch (err) {
      logger.error(`[BILLING-RENEWAL] Error for ${tenantId}:`, err.message);
    }
  },

  async chargePayment(tenantId, amount) {
    // Mock de integración de pago real
    logger.info(`[BILLING-PAYMENT] Cobrando ${amount} al tenant ${tenantId}`);
    return true; 
  },

  async handlePaymentFailure(tenantId) {
    await query(
      `UPDATE tenants SET subscription_status = 'past_due' WHERE id = ?`,
      [tenantId]
    );
    // Notificar al dueño del tenant...
  },

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
          // En lugar de suspender inmediatamente, pasar a modo degradado
          await this.enterDegradedMode(tenantId, 'trial_expired');
          return true; // Sigue activo pero en modo degradado (manejado por middleware)
        }
      }

      return true;
    } catch (err) {
      logger.error(`[BILLING-CHECK] Error for ${tenantId}:`, err.message);
      return true; // Fail-safe (Permitir acceso si falla el check)
    }
  },

  async enterDegradedMode(tenantId, reason) {
    logger.warn(`[SaaS-BILLING] Tenant ${tenantId} entrando en MODO DEGRADADO. Razón: ${reason}`);
    await query(
      `UPDATE tenants SET subscription_status = 'past_due', config = JSON_MERGE_PATCH(config, ?) WHERE id = ?`,
      [JSON.stringify({ degraded_mode: true, degraded_reason: reason }), tenantId]
    );
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
  }
};

// Worker para procesar renovaciones y cobros automáticos
const billingWorker = new Worker('saas-billing', async (job) => {
  const { tenantId, action } = job.data;
  if (action === 'renew_subscription') {
    await BillingService.processRenewal(tenantId);
  }
}, { connection: queueRedis });

export default billingQueue;
