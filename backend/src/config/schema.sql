-- SAV - Schema de MySQL (Traducción Completa Automática)

CREATE TABLE niveles (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(50) NOT NULL,
  deposito DECIMAL(12,2) DEFAULT 0,
  ingreso_diario DECIMAL(12,2) DEFAULT 0,
  num_tareas_diarias INT DEFAULT 4,
  comision_por_tarea DECIMAL(12,2) DEFAULT 1.80,
  ingreso_mensual DECIMAL(12,2),
  ingreso_anual DECIMAL(12,2),
  orden INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  telefono VARCHAR(20) UNIQUE NOT NULL,
  nombre_usuario VARCHAR(100) NOT NULL,
  nombre_real VARCHAR(200),
  password_hash TEXT NOT NULL,
  password_fondo_hash TEXT,
  codigo_invitacion VARCHAR(20) UNIQUE NOT NULL,
  invitado_por VARCHAR(36),
  nivel_id VARCHAR(36),
  avatar_url TEXT,
  saldo_principal DECIMAL(12,2) DEFAULT 0,
  saldo_comisiones DECIMAL(12,2) DEFAULT 0,
  rol VARCHAR(20) DEFAULT 'usuario',
  bloqueado TINYINT(1) DEFAULT 0,
  oportunidades_sorteo INT DEFAULT 0,
  last_device_id TEXT,
  intentos_login INT DEFAULT 0,
  bloqueado_hasta DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invitado_por) REFERENCES usuarios(id),
  FOREIGN KEY (nivel_id) REFERENCES niveles(id)
);

CREATE TABLE tarjetas_bancarias (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  usuario_id VARCHAR(36),
  tipo VARCHAR(50) NOT NULL,
  numero_masked VARCHAR(50),
  nombre_banco VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE metodos_qr (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nombre_titular VARCHAR(200) NOT NULL,
  imagen_qr_url TEXT,
  activo TINYINT(1) DEFAULT 1,
  orden INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tareas (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nivel_id VARCHAR(36),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  recompensa DECIMAL(12,2) DEFAULT 1.80,
  activa TINYINT(1) DEFAULT 1,
  orden INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (nivel_id) REFERENCES niveles(id)
);

CREATE TABLE videos (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tarea_id VARCHAR(36),
  nivel_id VARCHAR(36),
  url TEXT NOT NULL,
  titulo VARCHAR(200),
  duracion_segundos INT,
  orden INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tarea_id) REFERENCES tareas(id),
  FOREIGN KEY (nivel_id) REFERENCES niveles(id)
);

CREATE TABLE recargas (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  usuario_id VARCHAR(36),
  metodo_qr_id VARCHAR(36),
  monto DECIMAL(12,2) NOT NULL,
  comprobante_url TEXT,
  modo VARCHAR(50),
  estado VARCHAR(20) DEFAULT 'pendiente',
  admin_notas TEXT,
  procesado_por VARCHAR(36),
  procesado_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (metodo_qr_id) REFERENCES metodos_qr(id),
  FOREIGN KEY (procesado_por) REFERENCES usuarios(id)
);

CREATE TABLE retiros (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  usuario_id VARCHAR(36),
  tarjeta_id VARCHAR(36),
  monto DECIMAL(12,2) NOT NULL,
  tipo_billetera VARCHAR(20),
  estado VARCHAR(20) DEFAULT 'pendiente',
  admin_notas TEXT,
  procesado_por VARCHAR(36),
  procesado_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (tarjeta_id) REFERENCES tarjetas_bancarias(id),
  FOREIGN KEY (procesado_por) REFERENCES usuarios(id)
);

CREATE TABLE transacciones (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  usuario_id VARCHAR(36),
  tipo VARCHAR(50) NOT NULL,
  concepto VARCHAR(200),
  monto DECIMAL(12,2) NOT NULL,
  referencia_id VARCHAR(36),
  referencia_tipo VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  accion VARCHAR(100) NOT NULL,
  usuario_id VARCHAR(36),
  detalle JSON,
  ip VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
