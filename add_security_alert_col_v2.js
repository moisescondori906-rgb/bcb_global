import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: '14738941lp'
};

const sql = `
USE bcb_global;
ALTER TABLE usuarios ADD COLUMN security_alert VARCHAR(255) DEFAULT NULL;
`;

conn.on('ready', () => {
  conn.exec(`mysql -u root -p14738941lp -e "${sql}"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('SQL Executed Successfully');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect(config);
