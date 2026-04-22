
import { query } from '../src/config/db.mjs';
import logger from '../src/utils/logger.mjs';

async function migrate() {
  logger.info('🚀 Iniciando Migración de Horarios para QRs v11.5.0...');

  try {
    const cols = await query("SHOW COLUMNS FROM metodos_qr");
    const hasStartTime = cols.some(c => c.Field === 'horario_inicio');
    const hasEndTime = cols.some(c => c.Field === 'horario_fin');

    if (!hasStartTime) {
      await query("ALTER TABLE metodos_qr ADD COLUMN horario_inicio TIME DEFAULT '00:00:00' AFTER imagen_qr_url");
      logger.info('✅ Columna horario_inicio agregada.');
    }

    if (!hasEndTime) {
      await query("ALTER TABLE metodos_qr ADD COLUMN horario_fin TIME DEFAULT '23:59:59' AFTER horario_inicio");
      logger.info('✅ Columna horario_fin agregada.');
    }

    logger.info('✨ Migración v11.5.0 completada.');
    process.exit(0);
  } catch (err) {
    logger.error('❌ Error en migración v11.5.0:', err.message);
    process.exit(1);
  }
}

migrate();
