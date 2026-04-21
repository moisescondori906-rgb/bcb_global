import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: '14738941lp',
  readyTimeout: 90000
};

conn.on('ready', () => {
  const cmd = "mysql -u root -p14738941lp -e 'DESCRIBE bcb_global.tareas; SELECT COUNT(*) FROM bcb_global.tareas; SELECT id, nombre, activa FROM bcb_global.tareas LIMIT 5;'";
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
          .on('data', data => process.stdout.write(data))
          .stderr.on('data', data => process.stderr.write(data));
  });
}).on('error', e => console.log(e.message)).connect(config);
