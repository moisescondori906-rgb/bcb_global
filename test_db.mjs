
import { query } from './backend/src/config/db.mjs';

async function check() {
  try {
    const columns = await query("SHOW COLUMNS FROM retiros;");
    console.log("COLUMNS IN retiros:");
    console.log(JSON.stringify(columns, null, 2));
    
    const lastRetiros = await query("SELECT * FROM retiros ORDER BY created_at DESC LIMIT 1;");
    console.log("\nLAST RETIRO:");
    console.log(JSON.stringify(lastRetiros, null, 2));

  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    process.exit(0);
  }
}

check();
