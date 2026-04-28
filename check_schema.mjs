
import { query } from './backend/src/config/db.mjs';

async function checkSchema() {
  try {
    const columns = await query('DESCRIBE retiros');
    console.log('Columns in retiros:');
    columns.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));
    
    const hasEstadoOperativo = columns.some(col => col.Field === 'estado_operativo');
    console.log('\nHas estado_operativo:', hasEstadoOperativo);
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking schema:', err.message);
    process.exit(1);
  }
}

checkSchema();
