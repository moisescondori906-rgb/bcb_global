-- SCRIPT DE MIGRACIÓN v1.0.0
-- Este script agrega las columnas faltantes a las tablas existentes para resolver los errores 500.

USE bcb_global;

-- 1. Actualizar tabla USUARIOS
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS hora_inicio_turno TIME DEFAULT '00:00:00',
ADD COLUMN IF NOT EXISTS hora_fin_turno TIME DEFAULT '23:59:59',
ADD COLUMN IF NOT EXISTS dias_semana TEXT,
ADD COLUMN IF NOT EXISTS activo TINYINT(1) DEFAULT 1,
ADD COLUMN IF NOT EXISTS recibe_notificaciones TINYINT(1) DEFAULT 1,
ADD COLUMN IF NOT EXISTS telegram_user_id VARCHAR(100);

-- 2. Actualizar tabla NIVELES
ALTER TABLE niveles
ADD COLUMN IF NOT EXISTS retiro_horario_habilitado TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS retiro_dia_inicio INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS retiro_dia_fin INT DEFAULT 5;

-- 3. Asegurar que las tablas críticas existan
CREATE TABLE IF NOT EXISTS metodos_qr (
  id VARCHAR(36) PRIMARY KEY,
  admin_id VARCHAR(36) NOT NULL,
  nombre_banco VARCHAR(100) NOT NULL,
  titular VARCHAR(100) NOT NULL,
  qr_image_url TEXT NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  orden INT DEFAULT 0,
  hora_inicio TIME DEFAULT '00:00:00',
  hora_fin TIME DEFAULT '23:59:59',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_metodos_qr_admin (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS premios_ruleta (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  tipo ENUM('saldo', 'comision', 'tickets', 'nada') NOT NULL DEFAULT 'comision',
  valor DECIMAL(20, 2) DEFAULT 0.00,
  probabilidad DECIMAL(12, 2) DEFAULT 10.00,
  activo TINYINT(1) DEFAULT 1,
  orden INT DEFAULT 0,
  color VARCHAR(50) DEFAULT '#1a1f36',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_premios_ruleta_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sorteo_config_personalizada (
  id VARCHAR(36) PRIMARY KEY,
  target_type ENUM('usuario', 'nivel') NOT NULL,
  target_id VARCHAR(36) NOT NULL,
  premio_id_forzado VARCHAR(36),
  activa TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_target (target_type, target_id),
  FOREIGN KEY (premio_id_forzado) REFERENCES premios_ruleta(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Crear vistas para RLS (Row Level Security) - Requerido por secureQuery
CREATE VIEW IF NOT EXISTS v_usuarios AS SELECT * FROM usuarios;
CREATE VIEW IF NOT EXISTS v_retiros AS SELECT * FROM retiros;
CREATE VIEW IF NOT EXISTS v_movimientos_saldo AS SELECT * FROM movimientos_saldo;

-- Finalizado
SELECT 'Migración completada con éxito' as status;
