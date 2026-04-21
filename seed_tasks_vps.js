import { Client } from 'ssh2';
import { v4 as uuidv4 } from 'uuid';

const conn = new Client();

const config = {
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: '14738941lp',
  readyTimeout: 60000
};

const tasks = [
  { id: uuidv4(), nombre: 'Adidas Global', video_url: '/video/adidas1.mp4', descripcion: 'Nueva campaña Adidas 2026', pregunta: '¿Qué marca viste?', respuesta_correcta: 'ADIDAS', opciones: JSON.stringify(['ADIDAS', 'NIKE', 'PUMA', 'REEBOK']), orden: 0 },
  { id: uuidv4(), nombre: 'Coca-Cola Summer', video_url: '/video/cocacola1.mp4', descripcion: 'Refrescante sabor Coca-Cola', pregunta: '¿Qué marca viste?', respuesta_correcta: 'COCACOLA', opciones: JSON.stringify(['COCACOLA', 'PEPSI', 'SPRITE', 'FANTA']), orden: 1 },
  { id: uuidv4(), nombre: 'Chanel Classic', video_url: '/video/chanel1.mp4', descripcion: 'Elegancia atemporal Chanel', pregunta: '¿Qué marca viste?', respuesta_correcta: 'CHANEL', opciones: JSON.stringify(['CHANEL', 'DIOR', 'GUCCI', 'PRADA']), orden: 2 },
  { id: uuidv4(), nombre: 'Dior Fashion', video_url: '/video/dior1.mp4', descripcion: 'Alta costura con Dior', pregunta: '¿Qué marca viste?', respuesta_correcta: 'DIOR', opciones: JSON.stringify(['DIOR', 'CHANEL', 'HERMES', 'PRADA']), orden: 3 },
  { id: uuidv4(), nombre: 'Nike Air Max', video_url: '/video/nike1.mp4', descripcion: 'Innovación en cada paso', pregunta: '¿Qué marca viste?', respuesta_correcta: 'NIKE', opciones: JSON.stringify(['NIKE', 'ADIDAS', 'PUMA', 'REEBOK']), orden: 4 },
  { id: uuidv4(), nombre: 'Puma Speed', video_url: '/video/puma1.mp4', descripcion: 'Diseño y velocidad Puma', pregunta: '¿Qué marca viste?', respuesta_correcta: 'PUMA', opciones: JSON.stringify(['PUMA', 'NIKE', 'ADIDAS', 'REEBOK']), orden: 5 },
  { id: uuidv4(), nombre: 'Rolex Luxury', video_url: '/video/rolex1.mp4', descripcion: 'Precisión y prestigio Rolex', pregunta: '¿Qué marca viste?', respuesta_correcta: 'ROLEX', opciones: JSON.stringify(['ROLEX', 'OMEGA', 'CASIO', 'CARTIER']), orden: 6 },
  { id: uuidv4(), nombre: 'Lamborghini F8', video_url: '/video/lamborghini1.mp4', descripcion: 'Potencia pura en pista', pregunta: '¿Qué marca viste?', respuesta_correcta: 'LAMBORGHINI', opciones: JSON.stringify(['LAMBORGHINI', 'FERRARI', 'PORSCHE', 'MCLAREN']), orden: 7 },
];

console.log('🚀 Sembrando tareas en el VPS vía archivo SQL...');

conn.on('ready', () => {
  console.log('✅ Conexión SSH establecida.');
  
  let sql = 'DELETE FROM bcb_global.tareas; INSERT INTO bcb_global.tareas (id, nombre, video_url, descripcion, pregunta, respuesta_correcta, opciones, orden, activa) VALUES ';
  const values = tasks.map(t => 
    `('${t.id}', '${t.nombre}', '${t.video_url}', '${t.descripcion}', '${t.pregunta}', '${t.respuesta_correcta}', '${t.opciones.replace(/'/g, "''")}', ${t.orden}, 1)`
  ).join(', ');
  sql += values + ';';

  conn.exec(`echo "${sql.replace(/"/g, '\\"')}" > /tmp/seed_tasks.sql`, (err, stream) => {
    if (err) {
      console.error('❌ Error al crear archivo SQL:', err);
      conn.end();
      return;
    }
    
    stream.on('close', () => {
      console.log('📂 Archivo SQL creado en /tmp/seed_tasks.sql');
      
      const cmd = `mysql -u root -p14738941lp < /tmp/seed_tasks.sql`;
      conn.exec(cmd, (err, stream) => {
        if (err) {
          console.error('❌ Error al ejecutar mysql:', err);
          conn.end();
          return;
        }
        
        stream.on('close', (code) => {
          console.log(`✅ Siembra completada (Código: ${code}).`);
          conn.end();
        }).on('data', (data) => process.stdout.write(data.toString()))
          .stderr.on('data', (data) => process.stderr.write(data.toString()));
      });
    }).on('data', (data) => console.log(data.toString()))
      .stderr.on('data', (data) => console.error(data.toString()));
  });
}).on('error', (err) => {
  console.error('❌ Error de conexión SSH:', err.message);
}).connect(config);
