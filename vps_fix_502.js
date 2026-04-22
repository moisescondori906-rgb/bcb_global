
import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: '14738941lp',
  readyTimeout: 120000 // Aumentado a 120s
};

console.log('🔍 Diagnosticando servidor VPS...');

conn.on('ready', () => {
  console.log('✅ Conexión SSH establecida.');
  
  const commands = [
    'pm2 status',
    'lsof -i :4000',
    'tail -n 50 /var/www/bcb_global/backend/logs/out.log || true',
    'tail -n 50 /var/www/bcb_global/backend/logs/err.log || true',
    '# Intentar reiniciar si hay problemas',
    'cd /var/www/bcb_global/backend && pm2 delete bcb-global || true',
    'cd /var/www/bcb_global/backend && pm2 start ecosystem.config.cjs',
    'sleep 5',
    'pm2 status',
    'curl -I http://localhost:4000/api/health'
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
      console.log('✨ Diagnóstico y reinicio completado.');
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
}).connect(config);
