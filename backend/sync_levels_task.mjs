import { syncLevels } from './src/services/dbService.mjs';
import logger from './src/utils/logger.mjs';

async function run() {
  try {
    logger.info('Iniciando sincronización de niveles...');
    await syncLevels();
    logger.info('Sincronización completada con éxito.');
    process.exit(0);
  } catch (err) {
    logger.error('Error durante la sincronización:', err);
    process.exit(1);
  }
}

run();
