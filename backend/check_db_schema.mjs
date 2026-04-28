
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

async function checkSchema() {
  let connection;
  try {
    connection = await mysql.createConnection(poolConfig);
    console.log('✅ Conexión exitosa a MySQL');

    // 1. Check usuarios columns
    console.log('\n--- Verificando columnas de la tabla "usuarios" ---');
    const [userCols] = await connection.execute('DESCRIBE usuarios');
    const userColNames = userCols.map(c => c.Field);
    const requiredUserCols = ['hora_inicio_turno', 'hora_fin_turno', 'dias_semana', 'activo', 'recibe_notificaciones', 'telegram_user_id'];
    requiredUserCols.forEach(col => {
      if (userColNames.includes(col)) {
        console.log(`✅ Columna "${col}" existe`);
      } else {
        console.log(`❌ Columna "${col}" NO EXISTE`);
      }
    });

    // 2. Check metodos_qr table
    console.log('\n--- Verificando tabla "metodos_qr" ---');
    try {
      const [qrCols] = await connection.execute('DESCRIBE metodos_qr');
      console.log('✅ Tabla "metodos_qr" existe');
    } catch (err) {
      console.log('❌ Tabla "metodos_qr" NO EXISTE');
    }

    // 3. Check sorteo_config_personalizada table
    console.log('\n--- Verificando tabla "sorteo_config_personalizada" ---');
    try {
      const [sorteoCols] = await connection.execute('DESCRIBE sorteo_config_personalizada');
      console.log('✅ Tabla "sorteo_config_personalizada" existe');
    } catch (err) {
      console.log('❌ Tabla "sorteo_config_personalizada" NO EXISTE');
    }

    // 4. Check premios_ruleta table
    console.log('\n--- Verificando tabla "premios_ruleta" ---');
    try {
      const [premiosCols] = await connection.execute('DESCRIBE premios_ruleta');
      console.log('✅ Tabla "premios_ruleta" existe');
    } catch (err) {
      console.log('❌ Tabla "premios_ruleta" NO EXISTE');
    }

  } catch (err) {
    console.error('❌ Error al conectar o verificar:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkSchema();
