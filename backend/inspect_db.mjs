
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  try {
    const [columns] = await connection.query('SHOW COLUMNS FROM retiros');
    console.log('Columns in retiros:');
    columns.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));
    
    const [rows] = await connection.query('SELECT * FROM retiros LIMIT 1');
    console.log('\nSample row:', rows[0]);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

check();
