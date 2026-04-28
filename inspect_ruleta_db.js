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
    SHOW TABLES;
    DESCRIBE premios_ruleta;
    DESCRIBE sorteo_config_personalizada;
    SELECT * FROM premios_ruleta LIMIT 1;
    SELECT * FROM sorteo_config_personalizada LIMIT 1;
  "`;

  conn.exec(mysqlCmd, (err, stream) => {
    if (err) {
      console.error('❌ Error:', err);
      conn.end();
      return;
    }

    stream.on('close', (code) => {
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
