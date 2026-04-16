import { query } from './config/db.js';
import logger from './lib/logger.js';

async function updateSchema() {
  console.log("--- ACTUALIZANDO ESQUEMA DE BASE DE DATOS (RETIROS) ---");
  
  try {
    // 1. estado_operativo
    try {
      await query(`ALTER TABLE retiros ADD COLUMN estado_operativo ENUM('pendiente', 'tomado', 'aprobado', 'rechazado') DEFAULT 'pendiente'`);
      console.log("✅ Columna estado_operativo añadida.");
    } catch (e) {
      console.log("Error en estado_operativo:", e);
      if (e.code === 'ER_DUP_COLUMN_NAME' || (e.message && e.message.includes('Duplicate column name'))) {
        console.log("ℹ️ Columna estado_operativo ya existe.");
      } else {
        throw e;
      }
    }

    // 2. tomado_por
    try {
      await query(`ALTER TABLE retiros ADD COLUMN tomado_por BIGINT NULL`);
      console.log("✅ Columna tomado_por añadida.");
    } catch (e) {
      if (e.code === 'ER_DUP_COLUMN_NAME') {
        console.log("ℹ️ Columna tomado_por ya existe.");
      } else {
        throw e;
      }
    }

    // 3. fecha_toma
    try {
      await query(`ALTER TABLE retiros ADD COLUMN fecha_toma DATETIME NULL`);
      console.log("✅ Columna fecha_toma añadida.");
    } catch (e) {
      if (e.code === 'ER_DUP_COLUMN_NAME') {
        console.log("ℹ️ Columna fecha_toma ya existe.");
      } else {
        throw e;
      }
    }

    // 4. procesado_por
    try {
      await query(`ALTER TABLE retiros ADD COLUMN procesado_por BIGINT NULL`);
      console.log("✅ Columna procesado_por añadida.");
    } catch (e) {
      if (e.code === 'ER_DUP_COLUMN_NAME') {
        console.log("ℹ️ Columna procesado_por ya existe.");
      } else {
        throw e;
      }
    }

    // 5. fecha_procesado
    try {
      await query(`ALTER TABLE retiros ADD COLUMN fecha_procesado DATETIME NULL`);
      console.log("✅ Columna fecha_procesado añadida.");
    } catch (e) {
      if (e.code === 'ER_DUP_COLUMN_NAME') {
        console.log("ℹ️ Columna fecha_procesado ya existe.");
      } else {
        throw e;
      }
    }

    // 6. msg_id_admin
    try {
      await query(`ALTER TABLE retiros ADD COLUMN msg_id_admin BIGINT NULL`);
      console.log("✅ Columna msg_id_admin añadida.");
    } catch (e) {
      if (e.code === 'ER_DUP_COLUMN_NAME' || e.message.includes('Duplicate column name')) {
        console.log("ℹ️ Columna msg_id_admin ya existe.");
      } else {
        throw e;
      }
    }

    // 7. msg_id_retiros
    try {
      await query(`ALTER TABLE retiros ADD COLUMN msg_id_retiros BIGINT NULL`);
      console.log("✅ Columna msg_id_retiros añadida.");
    } catch (e) {
      if (e.code === 'ER_DUP_COLUMN_NAME' || e.message.includes('Duplicate column name')) {
        console.log("ℹ️ Columna msg_id_retiros ya existe.");
      } else {
        throw e;
      }
    }

    // 8. msg_id_secretaria
    try {
      await query(`ALTER TABLE retiros ADD COLUMN msg_id_secretaria BIGINT NULL`);
      console.log("✅ Columna msg_id_secretaria añadida.");
    } catch (e) {
      if (e.code === 'ER_DUP_COLUMN_NAME' || e.message.includes('Duplicate column name')) {
        console.log("ℹ️ Columna msg_id_secretaria ya existe.");
      } else {
        throw e;
      }
    }

    // 9. tomado_por_nombre
    try {
      await query(`ALTER TABLE retiros ADD COLUMN tomado_por_nombre VARCHAR(255) NULL`);
      console.log("✅ Columna tomado_por_nombre añadida.");
    } catch (e) {
      if (e.code === 'ER_DUP_COLUMN_NAME' || e.message.includes('Duplicate column name')) {
        console.log("ℹ️ Columna tomado_por_nombre ya existe.");
      } else {
        throw e;
      }
    }

    console.log("✅ Esquema de base de datos actualizado correctamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al actualizar esquema:", error.message);
    process.exit(1);
  }
}

updateSchema();
