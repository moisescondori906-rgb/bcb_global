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
    SHOW TABLES LIKE 'premios_ruleta';
    SHOW TABLES LIKE 'sorteo_config_personalizada';
    DESCRIBE premios_ruleta;
    DESCRIBE sorteo_config_personalizada;
  "`;

  conn.exec(mysqlCmd, (err, stream) => {
    if (err) {
      console.error('❌ Error:', err);
      conn.end();
      return;
    }

    stream.on('close', (code) => {
      console.log('✅ Verificación completada.');
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
