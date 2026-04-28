
import { query } from './backend/src/config/db.mjs';

async function check() {
  try {
    const rows = await query('SHOW COLUMNS FROM retiros');
    console.log('Columns in retiros table:');
    rows.forEach(row => {
      console.log(`${row.Field}: ${row.Type} (Default: ${row.Default})`);
    });
    
    const count = await query('SELECT COUNT(*) as total FROM retiros WHERE estado = "pendiente"');
    console.log('\nPendientes count:', count[0].total);
    
    const sample = await query('SELECT * FROM retiros ORDER BY created_at DESC LIMIT 1');
    if (sample.length > 0) {
      console.log('\nLatest withdrawal:', JSON.stringify(sample[0], null, 2));
    } else {
      console.log('\nNo withdrawals found.');
    }
  } catch (err) {
    console.error('Error FULL:', err);
  } finally {
    process.exit();
  }
}

check();
