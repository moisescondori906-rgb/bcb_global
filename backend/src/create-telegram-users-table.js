import { query } from './config/db.js';

async function createTelegramUsersTable() {
  console.log("--- CREANDO TABLA usuarios_telegram ---");
  
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS usuarios_telegram (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'retiro', 'secretaria') NOT NULL DEFAULT 'secretaria',
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log("✅ Tabla usuarios_telegram creada o ya existente.");
    process.exit(0);
  } catch (error) {
      console.error("❌ Error al crear la tabla usuarios_telegram:", error);
      process.exit(1);
    }
}

createTelegramUsersTable();
