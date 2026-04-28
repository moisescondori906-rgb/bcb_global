import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, './backend/.env') });

async function test() {
  console.log('Testing connection with:');
  console.log('Host:', process.env.MYSQL_HOST);
  console.log('User:', process.env.MYSQL_USER);
  console.log('Database:', process.env.MYSQL_DATABASE);

  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    console.log('✅ Connection successful!');
    await connection.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

test();
