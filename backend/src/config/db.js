import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Pool de conexiones (Reemplaza a supabase-js)
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'sav_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true
});

export const db = pool;

export const checkDbConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('[MySQL] Conexión establecida exitosamente.');
        connection.release();
        return true;
    } catch (error) {
        console.error('[MySQL Error] No se pudo conectar a la base de datos:', error.message);
        return false;
    }
};
