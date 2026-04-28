import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: '14738941lp'
};

conn.on('ready', () => {
  console.log('✅ Conexión SSH establecida.');
  
  const mysqlCmd = `mysql -u root -p14738941lp -e "
    USE bcb_global;
    
    -- Corregir premios_ruleta
    SET @dbname = 'bcb_global';
    SET @tablename = 'premios_ruleta';
    
    -- Añadir columna color si no existe
    SET @columnname = 'color';
    SET @prequery = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dbname AND table_name = @tablename AND column_name = @columnname);
    SET @sql = IF(@prequery > 0, 'SELECT 1', 'ALTER TABLE premios_ruleta ADD COLUMN color VARCHAR(50) DEFAULT \\'#1a1f36\\' AFTER orden');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- Corregir tipo de probabilidad a DECIMAL
    ALTER TABLE premios_ruleta MODIFY COLUMN probabilidad DECIMAL(12, 2) DEFAULT 10.00;
    
    -- Corregir sorteo_config_personalizada
    SET @tablename = 'sorteo_config_personalizada';
    
    -- Añadir columna updated_at si no existe
    SET @columnname = 'updated_at';
    SET @prequery = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dbname AND table_name = @tablename AND column_name = @columnname);
    SET @sql = IF(@prequery > 0, 'SELECT 1', 'ALTER TABLE sorteo_config_personalizada ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- Asegurar UNIQUE KEY en sorteo_config_personalizada
    SET @prequery = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @dbname AND table_name = @tablename AND index_name = 'idx_target');
    SET @sql = IF(@prequery > 0, 'SELECT 1', 'ALTER TABLE sorteo_config_personalizada ADD UNIQUE KEY idx_target (target_type, target_id)');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- Añadir trace_id a tablas financieras si no existen
    -- compras_nivel
    SET @tablename = 'compras_nivel';
    SET @columnname = 'trace_id';
    SET @prequery = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dbname AND table_name = @tablename AND column_name = @columnname);
    SET @sql = IF(@prequery > 0, 'SELECT 1', 'ALTER TABLE compras_nivel ADD COLUMN trace_id VARCHAR(36) AFTER id');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- retiros
    SET @tablename = 'retiros';
    SET @prequery = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dbname AND table_name = @tablename AND column_name = @columnname);
    SET @sql = IF(@prequery > 0, 'SELECT 1', 'ALTER TABLE retiros ADD COLUMN trace_id VARCHAR(36) AFTER id');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- movimientos_saldo
    SET @tablename = 'movimientos_saldo';
    SET @prequery = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dbname AND table_name = @tablename AND column_name = @columnname);
    SET @sql = IF(@prequery > 0, 'SELECT 1', 'ALTER TABLE movimientos_saldo ADD COLUMN trace_id VARCHAR(36) AFTER id');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- Corregir tenants (añadir subscription_status y trial_ends_at)
    SET @tablename = 'tenants';
    SET @columnname = 'subscription_status';
    SET @prequery = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dbname AND table_name = @tablename AND column_name = @columnname);
    SET @sql = IF(@prequery > 0, 'SELECT 1', 'ALTER TABLE tenants ADD COLUMN subscription_status VARCHAR(20) DEFAULT \\'active\\' AFTER status');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    SET @columnname = 'trial_ends_at';
    SET @prequery = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @dbname AND table_name = @tablename AND column_name = @columnname);
    SET @sql = IF(@prequery > 0, 'SELECT 1', 'ALTER TABLE tenants ADD COLUMN trial_ends_at TIMESTAMP NULL AFTER subscription_status');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    SELECT 'MIGRACION COMPLETADA EXITOSAMENTE' as result;
    DESCRIBE premios_ruleta;
    DESCRIBE sorteo_config_personalizada;
    DESCRIBE tenants;
  "`;

  conn.exec(mysqlCmd, (err, stream) => {
    if (err) {
      console.error('❌ Error:', err);
      conn.end();
      return;
    }

    stream.on('close', (code) => {
      console.log('✅ Migración completada.');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('❌ Error SSH:', err.message);
}).connect(config);
