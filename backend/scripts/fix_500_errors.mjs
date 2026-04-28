import { query } from '../src/config/db.mjs';
import logger from '../src/utils/logger.mjs';

/**
 * MIGRACIÓN DE EMERGENCIA - SOLUCIÓN A ERRORES 500 EN ADMIN
 * Este script asegura que las tablas 'usuarios' y 'metodos_qr' tengan todas las columnas necesarias.
 */
async function fixDatabase() {
  logger.info('🚀 Iniciando script de reparación de Base de Datos...');

  try {
    // 1. Verificar y reparar tabla 'usuarios'
    logger.info('⏳ Verificando columnas en tabla "usuarios"...');
    const userCols = await query("SHOW COLUMNS FROM usuarios");
    const userColNames = userCols.map(c => c.Field);

    const requiredUserCols = [
      { name: 'hora_inicio_turno', type: "TIME DEFAULT '00:00:00'" },
      { name: 'hora_fin_turno', type: "TIME DEFAULT '23:59:59'" },
      { name: 'dias_semana', type: "VARCHAR(255) DEFAULT '0,1,2,3,4,5,6'" },
      { name: 'activo', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'recibe_notificaciones', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'telegram_user_id', type: 'VARCHAR(100)' },
      { name: 'nivel_desde', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'numero_registro', type: 'VARCHAR(50) UNIQUE AFTER nombre_real' }
    ];

    for (const col of requiredUserCols) {
      if (!userColNames.includes(col.name)) {
        logger.info(`➕ Agregando columna "${col.name}" a "usuarios"...`);
        await query(`ALTER TABLE usuarios ADD COLUMN ${col.name} ${col.type}`);
        logger.info(`✅ Columna "${col.name}" agregada.`);
      }
    }

    // 2. Verificar y reparar tabla 'metodos_qr'
    logger.info('⏳ Verificando columnas en tabla "metodos_qr"...');
    // Asegurar que la tabla existe primero
    await query(`
      CREATE TABLE IF NOT EXISTS metodos_qr (
        id VARCHAR(36) PRIMARY KEY,
        nombre_titular VARCHAR(200) NOT NULL,
        imagen_qr_url TEXT,
        activo TINYINT(1) DEFAULT 1,
        orden INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const qrCols = await query("SHOW COLUMNS FROM metodos_qr");
    const qrColNames = qrCols.map(c => c.Field);

    const requiredQrCols = [
      { name: 'admin_id', type: 'VARCHAR(36) AFTER imagen_qr_url' },
      { name: 'seleccionada', type: 'TINYINT(1) DEFAULT 0 AFTER admin_id' },
      { name: 'dias_semana', type: "VARCHAR(255) DEFAULT '0,1,2,3,4,5,6' AFTER orden" },
      { name: 'hora_inicio', type: "TIME DEFAULT '00:00:00' AFTER dias_semana" },
      { name: 'hora_fin', type: "TIME DEFAULT '23:59:59' AFTER hora_inicio" }
    ];

    for (const col of requiredQrCols) {
      if (!qrColNames.includes(col.name)) {
        logger.info(`➕ Agregando columna "${col.name}" a "metodos_qr"...`);
        await query(`ALTER TABLE metodos_qr ADD COLUMN ${col.name} ${col.type}`);
        logger.info(`✅ Columna "${col.name}" agregada.`);
      }
    }

    // Asegurar que la FK de admin_id existe si se agregó la columna
    if (qrColNames.includes('admin_id') || !qrColNames.includes('admin_id')) {
        try {
            await query("ALTER TABLE metodos_qr ADD CONSTRAINT fk_metodos_qr_admin FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE");
            logger.info('✅ Constraint FK agregada a "metodos_qr".');
        } catch (e) {
            logger.info('ℹ️ El constraint FK ya existe o no pudo ser agregado.');
        }
    }

    // 3. Verificar y reparar tabla 'niveles'
    logger.info('⏳ Verificando columnas en tabla "niveles"...');
    const nivelCols = await query("SHOW COLUMNS FROM niveles");
    const nivelColNames = nivelCols.map(c => c.Field);

    if (!nivelColNames.includes('duracion_dias')) {
        logger.info('➕ Agregando columna "duracion_dias" a "niveles"...');
        await query("ALTER TABLE niveles ADD COLUMN duracion_dias INT DEFAULT 30 AFTER orden");
        logger.info('✅ Columna "duracion_dias" agregada.');
    }

    const requiredNivelCols = [
      { name: 'retiro_horario_habilitado', type: 'TINYINT(1) DEFAULT 1' },
      { name: 'retiro_dia_inicio', type: 'INT DEFAULT 1' },
      { name: 'retiro_dia_fin', type: 'INT DEFAULT 7' }
    ];

    for (const col of requiredNivelCols) {
      if (!nivelColNames.includes(col.name)) {
        logger.info(`➕ Agregando columna "${col.name}" a "niveles"...`);
        await query(`ALTER TABLE niveles ADD COLUMN ${col.name} ${col.type}`);
        logger.info(`✅ Columna "${col.name}" agregada.`);
      }
    }

    // 4. Asegurar tabla banners_carrusel
    logger.info('⏳ Asegurando tabla "banners_carrusel"...');
    await query(`
      CREATE TABLE IF NOT EXISTS banners_carrusel (
        id VARCHAR(36) PRIMARY KEY,
        imagen_url TEXT NOT NULL,
        titulo VARCHAR(255),
        link_url TEXT,
        activo TINYINT(1) DEFAULT 1,
        orden INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 5. Asegurar tabla telegram_operaciones_log
    await query(`
      CREATE TABLE IF NOT EXISTS telegram_operaciones_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id VARCHAR(36),
        tipo_op VARCHAR(50),
        ref_id VARCHAR(100),
        detalles TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('✅ Tabla "telegram_operaciones_log" lista.');

    // 5. Asegurar tabla configuraciones
    logger.info('⏳ Asegurando tabla "configuraciones"...');
    await query(`
      CREATE TABLE IF NOT EXISTS configuraciones (
        clave VARCHAR(100) PRIMARY KEY,
        valor JSON NOT NULL,
        descripcion TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    logger.info('✅ Tabla "configuraciones" lista.');

    // 6. Asegurar que las configuraciones de horarios existan
    logger.info('⏳ Verificando configuraciones de horarios...');
    const configRows = await query("SELECT clave FROM configuraciones WHERE clave IN ('horario_recarga', 'horario_retiro')");
    const existingKeys = configRows.map(r => r.clave);

    if (!existingKeys.includes('horario_recarga')) {
      logger.info('➕ Insertando configuración por defecto para "horario_recarga"...');
      const defaultRecarga = JSON.stringify({ inicio: "10:00", fin: "22:00", dias_semana: [1,2,3,4,5,6,7] });
      await query("INSERT INTO configuraciones (clave, valor) VALUES (?, ?)", ['horario_recarga', defaultRecarga]);
    }

    if (!existingKeys.includes('horario_retiro')) {
      logger.info('➕ Insertando configuración por defecto para "horario_retiro"...');
      const defaultRetiro = JSON.stringify({ inicio: "10:00", fin: "17:00", dias_semana: [1,2,3,4,5,6,7] });
      await query("INSERT INTO configuraciones (clave, valor) VALUES (?, ?)", ['horario_retiro', defaultRetiro]);
    }

    logger.info('✅ Reparación de Base de Datos completada con éxito.');
    process.exit(0);
  } catch (err) {
    logger.error('❌ Error fatal durante la reparación:', err.message);
    process.exit(1);
  }
}

fixDatabase();
