
import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: '14738941lp',
  readyTimeout: 120000
};

const ecosystemContent = `
module.exports = {
  apps: [
    {
      name: 'bcb-global-backend',
      script: 'src/index.mjs',
      cwd: '/var/www/bcb_global/backend',
      instances: 1, // Reducido a 1 para debug inicial
      exec_mode: 'fork', // Cambiado a fork para ver errores directos
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      max_memory_restart: '1G',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false
    }
  ]
};
`;

console.log('🚀 Aplicando corrección de emergencia 502...');

conn.on('ready', () => {
  console.log('✅ Conexión SSH establecida.');
  
  const commands = [
    'pm2 delete all || true',
    'fuser -k 4000/tcp || true',
    `echo "${ecosystemContent.replace(/"/g, '\\"')}" > /var/www/bcb_global/backend/ecosystem.config.cjs`,
    'cd /var/www/bcb_global/backend && npm install',
    'cd /var/www/bcb_global/backend && pm2 start ecosystem.config.cjs',
    'sleep 10',
    'pm2 status',
    'curl -v http://localhost:4000/api/health'
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
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
