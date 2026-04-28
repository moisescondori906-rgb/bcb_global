import { query } from './src/config/db.mjs';

async function check() {
  try {
    const tables = await query('SHOW TABLES');
    console.log('Tables:', tables);
    
    const columns = await query('DESCRIBE metodos_qr');
    console.log('Columns in metodos_qr:', columns);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

check();
