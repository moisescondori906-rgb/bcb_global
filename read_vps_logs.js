
import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: '14738941lp'
};

conn.on('ready', () => {
  console.log('✅ Conexión SSH establecida para lectura de logs.');

  const command = 'tail -n 100 /var/www/bcb_global/backend/logs/app.log';
  
  conn.exec(command, (err, stream) => {
    if (err) {
      console.error('❌ Error ejecutando comando:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code, signal) => {
      console.log('-------------------------------------------');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect(config);
