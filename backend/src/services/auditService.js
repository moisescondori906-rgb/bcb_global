import { query } from '../config/db.js';
import logger from '../lib/logger.js';

/**
 * SaaS Audit Service - Logs y Auditoría multi-tenant.
 */
export const AuditService = {
  /**
   * Registra una acción administrativa o de sistema.
   */
  async log(req, action, resource, resourceId, details = {}) {
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
      await query(
        `INSERT INTO saas_audit_logs (tenant_id, user_id, action, resource, resource_id, details, ip_address) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tenantId, userId, action, resource, resourceId, JSON.stringify(details), ip]
      );
    } catch (err) {
      logger.error(`[AUDIT-LOG-ERROR]: ${err.message}`);
    }
  },

  /**
   * Obtiene logs filtrados por tenant (para el panel de la empresa).
   */
  async getTenantLogs(tenantId, limit = 50, offset = 0) {
    return await query(
      `SELECT * FROM saas_audit_logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [tenantId, limit, offset]
    );
  }
};
