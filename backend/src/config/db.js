import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../lib/logger.js';

dotenv.config();

// Configuración del Pool de Conexiones optimizado para Contabo y alta concurrencia
const poolConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 50, // Ajustar según capacidad del servidor Contabo
  maxIdle: 10, // Conexiones inactivas máximas
  idleTimeout: 60000, // 60 segundos
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Tipos de datos: Asegurar que DECIMAL se trate como string para precisión total en JS si es necesario, 
  // o usar un parser específico. mysql2 por defecto devuelve DECIMAL como string.
};

const pool = mysql.createPool(poolConfig);

/**
 * Helper centralizado para ejecutar consultas
 * @param {string} sql - Consulta SQL con placeholders (?)
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise<any>} - Resultado de la consulta
 */
export async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (err) {
    logger.error(`[DB Query Error]: ${err.message} | SQL: ${sql}`);
    throw err;
  }
}

/**
 * Helper para transacciones SQL (Atomicidad)
 * @param {Function} callback - Función que recibe la conexión y ejecuta las queries
 * @returns {Promise<any>} - Resultado del callback
 */
export async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    logger.error(`[DB Transaction Error]: ${err.message}`);
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Helper para obtener una sola fila
 */
export async function queryOne(sql, params) {
  const results = await query(sql, params);
  return results[0] || null;
}

/**
 * SECURE QUERY (RLS Nativo MySQL 8.0)
 * Enforces tenant_id isolation at the database level using session variables.
 */
export async function secureQuery(sql, params, tenantId) {
  if (!tenantId) {
    logger.warn(`[RLS-VIOLATION] Query sin tenantId detectada: ${sql}`);
    throw new Error('Tenant isolation error: tenantId is required for this operation');
  }

  const connection = await pool.getConnection();
  try {
    // 1. Establecer el contexto del tenant en la sesión de MySQL (RLS Nativo)
    await connection.execute('SET @current_tenant_id = ?', [tenantId]);
    
    // 2. Ejecutar la query usando la vista protegida o la tabla original
    // Si la query usa la tabla original, el RLS se puede aplicar mediante un trigger o middleware de SQL.
    // Para máxima seguridad, redirigimos las consultas a las vistas v_
    let rlsSql = sql;
    const tablesToProtect = ['usuarios', 'retiros', 'movimientos_saldo'];
    tablesToProtect.forEach(table => {
      const regex = new RegExp(`\\b${table}\\b`, 'gi');
      rlsSql = rlsSql.replace(regex, `v_${table}`);
    });

    const [results] = await connection.execute(rlsSql, params);
    return results;
  } catch (err) {
    logger.error(`[SECURE-QUERY-ERROR]: ${err.message} | SQL: ${sql}`);
    throw err;
  } finally {
    connection.release();
  }
}

export default pool;
