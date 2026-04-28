import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  const connectionConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'bcb_global',
  };

  const connection = await mysql.createConnection(connectionConfig);

  try {
    console.log('⏳ Actualizando tablas...');
    await connection.query(`
      ALTER TABLE niveles 
      ADD COLUMN IF NOT EXISTS duracion_dias INT DEFAULT NULL;
    `);
    await connection.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS nivel_desde TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('✅ Tablas actualizadas.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

migrate();
