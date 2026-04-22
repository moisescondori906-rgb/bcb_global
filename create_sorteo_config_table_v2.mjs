
import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: '14738941lp'
};

conn.on('ready', () => {
  console.log('✅ SSH Ready');
  const sql = `
    DROP TABLE IF EXISTS sorteo_config_personalizada;
    CREATE TABLE sorteo_config_personalizada (
      id VARCHAR(36) PRIMARY KEY,
      target_type ENUM('usuario', 'nivel') NOT NULL,
      target_id VARCHAR(36) NOT NULL,
      premio_id_forzado VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      activa TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_target (target_type, target_id)
    ) ENGINE=InnoDB;
  `;
  conn.exec(`mysql -u root -p14738941lp bcb_global -e "${sql}"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('✅ Table sorteo_config_personalizada created successfully (Simple version)');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect(config);
