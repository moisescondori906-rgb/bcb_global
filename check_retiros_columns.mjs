import { query } from './backend/src/config/db.mjs';

async function check() {
  try {
    const columns = await query("SHOW COLUMNS FROM retiros;");
    console.log(JSON.stringify(columns, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
