-- BCB GLOBAL - Multi-Tenant Infrastructure Schema (v19.0.0)
-- Aislamiento de datos y soporte para múltiples empresas.

SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABLA: TENANTS (Empresas/Clientes)
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL, -- Identificador en URL o subdominio
  domain VARCHAR(255),
  api_key VARCHAR(100) UNIQUE,
  status ENUM('active', 'suspended', 'trial') DEFAULT 'active',
  config JSON, -- Configuración específica (colores, logos, límites)
  region VARCHAR(20) DEFAULT 'global',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. MIGRACIÓN DE TABLAS EXISTENTES A MULTI-TENANT
-- Se añade tenant_id a todas las tablas críticas.

ALTER TABLE usuarios ADD COLUMN tenant_id VARCHAR(36) AFTER id;
ALTER TABLE niveles ADD COLUMN tenant_id VARCHAR(36) AFTER id;
ALTER TABLE tareas ADD COLUMN tenant_id VARCHAR(36) AFTER id;
ALTER TABLE recargas ADD COLUMN tenant_id VARCHAR(36) AFTER id;
ALTER TABLE retiros ADD COLUMN tenant_id VARCHAR(36) AFTER id;
ALTER TABLE movimientos_saldo ADD COLUMN tenant_id VARCHAR(36) AFTER id;
ALTER TABLE configuraciones ADD COLUMN tenant_id VARCHAR(36) AFTER clave;
ALTER TABLE feature_flags ADD COLUMN tenant_id VARCHAR(36) AFTER flag_key;
ALTER TABLE sla_metrics ADD COLUMN tenant_id VARCHAR(36) AFTER id;
ALTER TABLE fraud_alerts ADD COLUMN tenant_id VARCHAR(36) AFTER id;
ALTER TABLE tarjetas_bancarias ADD COLUMN tenant_id VARCHAR(36) AFTER id;
ALTER TABLE notificaciones ADD COLUMN tenant_id VARCHAR(36) AFTER id;

-- 3. ACTUALIZACIÓN DE INDEXES (Aislamiento por Tenant)
ALTER TABLE usuarios ADD INDEX idx_tenant_telefono (tenant_id, telefono);
ALTER TABLE retiros ADD INDEX idx_tenant_estado (tenant_id, estado);
ALTER TABLE recargas ADD INDEX idx_tenant_estado (tenant_id, estado);
ALTER TABLE feature_flags ADD INDEX idx_tenant_flag (tenant_id, flag_key);

-- 4. INSERTAR TENANT DEFAULT (Para migración sin downtime)
INSERT IGNORE INTO tenants (id, name, slug, status, config) VALUES 
('default-tenant-uuid', 'BCB Global HQ', 'bcb-global', 'active', '{"theme": "dark", "max_users": 10000}');

-- Actualizar registros existentes al tenant default
UPDATE usuarios SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;
UPDATE niveles SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;
UPDATE tareas SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;
UPDATE recargas SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;
UPDATE retiros SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;
UPDATE movimientos_saldo SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;
UPDATE configuraciones SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;
UPDATE feature_flags SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;
UPDATE sla_metrics SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;
UPDATE fraud_alerts SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;
UPDATE tarjetas_bancarias SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;
UPDATE notificaciones SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;

SET FOREIGN_KEY_CHECKS = 1;
