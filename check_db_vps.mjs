import { Client } from 'ssh2';

const config = {
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: '14738941lp'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH Ready');
  conn.exec('mysql -u root -p14738941lp -e "SELECT codigo, retiro_dia_inicio, retiro_dia_fin FROM bcb_global.niveles;"', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.error(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('❌ Error:', err);
}).connect(config);
