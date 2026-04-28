import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ Conexión SSH establecida.');
  
  // Comandos para verificar el entorno
  const commands = [
    'sudo sed -i "s/location \\/uploads\\/ {/location ^~ \\/uploads\\/ {/" /etc/nginx/sites-enabled/bcb',
    'sudo nginx -t && sudo systemctl reload nginx'
  ];

  const fullCommand = commands.join(' && echo "---" && ');
  
  conn.exec(fullCommand, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: '14738941lp'
});
