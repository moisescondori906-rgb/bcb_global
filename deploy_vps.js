
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
    'cd /var/www/bcb_global && git pull origin main',
    'pm2 delete bcb-global || true',
    'fuser -k 4000/tcp || true',
    'sleep 2',
    'cd /var/www/bcb_global/backend && pm2 start src/index.js --name bcb-global -i max --update-env',
    'cat <<EOF > /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 2048;
    multi_accept on;
    use epoll;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF',
    'nginx -t && systemctl restart nginx',
    'pm2 status'
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
  password: 'PASSWORD_HERE'
});
