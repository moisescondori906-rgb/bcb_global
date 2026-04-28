import { query, redis, CACHE_KEYS } from '../src/services/dbService.mjs';
import logger from '../src/utils/logger.mjs';

async function run() {
  try {
    logger.info('Iniciando sincronización de configuración global...');
    
    const horario_retiro = {
      enabled: true,
      hora_inicio: '10:00',
      hora_fin: '17:00',
      dias_semana: [1, 2, 3, 4, 5]
    };

    const valStr = JSON.stringify(horario_retiro);
    
    await query(`
      INSERT INTO configuraciones (clave, valor) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE valor = ?
    `, ['horario_retiro', valStr, valStr]);

    await redis.del(CACHE_KEYS.CONFIG);
    
    logger.info('Configuración global de horario de retiro actualizada a 10:00-17:00, Lunes-Viernes.');
    process.exit(0);
  } catch (err) {
    logger.error('Error durante la sincronización de config:', err);
    process.exit(1);
  }
}

run();
