import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: '14738941lp',
  readyTimeout: 120000
};

conn.on('ready', () => {
  // Simular una petición a /api/tasks (necesitamos un token válido de un usuario real)
  // Como no tengo un token, simplemente voy a verificar si el endpoint responde 401 (lo cual es bueno, significa que existe)
  // O mejor, voy a ver los logs de PM2 mientras hago la petición.
  
  const cmd = "curl -v http://127.0.0.1:4000/api/tasks";
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
          .on('data', data => process.stdout.write(data))
          .stderr.on('data', data => process.stderr.write(data));
  });
}).on('error', e => console.log(e.message)).connect(config);
