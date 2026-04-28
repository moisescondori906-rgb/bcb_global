
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
  const connectionConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'bcb_global',
  };

  const connection = await mysql.createConnection(connectionConfig);

  try {
    console.log('--- Verificando Tabla niveles ---');
    const [nivelesCols] = await connection.query('SHOW COLUMNS FROM niveles');
    console.log('Columnas en niveles:', nivelesCols.map(c => c.Field).join(', '));

    console.log('\n--- Verificando Tabla usuarios ---');
    const [usuariosCols] = await connection.query('SHOW COLUMNS FROM usuarios');
    console.log('Columnas en usuarios:', usuariosCols.map(c => c.Field).join(', '));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await connection.end();
  }
}

check();
