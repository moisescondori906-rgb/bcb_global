import { query, queryOne } from '../config/db.js';
import logger from '../lib/logger.js';
import crypto from 'crypto';

/**
 * SaaS Audit Service - Logs inmutables con Hash Chaining.
 */
export const AuditService = {
  /**
   * Registra una acción administrativa con encadenamiento de hash para inmutabilidad.
   */
  async log(req, action, resource, resourceId, details = {}) {
    const tenantId = req.tenantId;
    const userId = req.user?.id || req.requestUser?.id;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
      // 1. Obtener el hash del último log para el tenant (Encadenamiento)
      const lastLog = await queryOne(
        `SELECT hash_chain FROM saas_audit_logs WHERE tenant_id = ? ORDER BY id DESC LIMIT 1`,
        [tenantId]
      );
      const lastHash = lastLog?.hash_chain || 'genesis-block';

      // 2. Calcular nuevo hash (Inmutabilidad verificable)
      const payload = JSON.stringify({ tenantId, userId, action, resource, resourceId, details, lastHash });
      const currentHash = crypto.createHash('sha256').update(payload).digest('hex');

      await query(
        `INSERT INTO saas_audit_logs (tenant_id, user_id, action, resource, resource_id, details, ip_address, hash_chain) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [tenantId, userId, action, resource, resourceId, JSON.stringify(details), ip, currentHash]
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
