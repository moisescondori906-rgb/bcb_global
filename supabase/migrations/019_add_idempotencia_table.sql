-- Migración para crear la tabla de idempotencia (Blindaje Senior)
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS idempotencia (
  idempotency_key VARCHAR(100) PRIMARY KEY,
  response_body JSONB NOT NULL,
  status_code INT DEFAULT 200,
  operacion VARCHAR(50), -- TASK, WITHDRAWAL, LEVEL_UPGRADE, etc.
  usuario_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_idempotencia_user ON idempotencia(usuario_id);
CREATE INDEX IF NOT EXISTS idx_idempotencia_fecha ON idempotencia(created_at);
