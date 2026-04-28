
import { query } from './backend/src/config/db.mjs';

async function verify() {
  try {
    console.log('--- Verificando conexión a la base de datos ---');
    const tables = await query('SHOW TABLES;');
    console.log('Tablas encontradas:', tables.map(t => Object.values(t)[0]));

    console.log('\n--- Verificando estructura de la tabla "retiros" ---');
    const columns = await query('SHOW COLUMNS FROM retiros;');
    console.log('Columnas de "retiros":', JSON.stringify(columns, null, 2));

    const pending = await query('SELECT id, estado, estado_operativo FROM retiros WHERE estado = "pendiente" LIMIT 5;');
    console.log('\nÚltimos 5 retiros pendientes:', JSON.stringify(pending, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error fatal:', err.message);
    if (err.code) console.error('Código de error:', err.code);
    process.exit(1);
  }
}

verify();
