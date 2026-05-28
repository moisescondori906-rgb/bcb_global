
import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: process.env.SSH_PASSWORD || 'PASSWORD_HERE'
};

console.log('🚀 Iniciando despliegue remoto en VPS...');

conn.on('ready', () => {
  console.log('✅ Conexión SSH establecida.');
  
  const commands = [
    'pm2 delete bcb-global || true',
    'fuser -k 4000/tcp || true',
    'lsof -ti:4000 | xargs kill -9 || true',
    'sleep 2',
    'cd /var/www/bcb_global/backend && pm2 start src/index.js --name bcb-global',
    'sleep 5',
    'pm2 status',
    'curl -s http://localhost:4000/api/health'
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
      console.log('✨ Despliegue completado con éxito.');
      conn.end();
      return;
    }

    const cmd = commands[index];
    console.log(`\n🏃 Ejecutando: ${cmd}`);
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error(`❌ Error al ejecutar "${cmd}":`, err);
        conn.end();
        return;
      }

      stream.on('close', (code, signal) => {
        if (code !== 0) {
          console.warn(`⚠️ El comando "${cmd}" terminó con código ${code}`);
        }
        executeNext(index + 1);
      }).on('data', (data) => {
        process.stdout.write(data.toString());
      }).stderr.on('data', (data) => {
        process.stderr.write(data.toString());
      });
    });
  };

  executeNext(0);
}).on('error', (err) => {
  console.error('❌ Error de conexión SSH:', err.message);
}).connect({
  ...config,
  password: '14738941lp'
});
