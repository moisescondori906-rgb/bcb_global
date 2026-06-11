
import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '173.249.55.143',
  port: 22,
  username: 'root',
  password: '14738941lp'
};

console.log('🚀 Iniciando despliegue remoto en VPS...');

conn.on('ready', () => {
  console.log('✅ Conexión SSH establecida.');
  
  // Combine all commands into one script
  const deployScript = `
    cd /var/www/bcb_global
    echo "📥 Actualizando código desde GitHub..."
    git pull origin main
    echo "�️ Ejecutando migraciones de base de datos..."
    cd backend
    node scripts/add-one-use-per-user-column.mjs || true
    node scripts/fix-schema-safe.mjs || true
    echo "📦 Configurando Backend..."
    npm install
    echo "🔄 Reiniciando proceso PM2..."
    pm2 restart bcb-global-backend || pm2 start ecosystem.config.cjs --name bcb-global-backend
    pm2 save
    echo "🎨 Configurando Frontend..."
    cd ../frontend
    npm install
    npm run build
    echo "🌐 Verificando Nginx..."
    sudo nginx -t && sudo systemctl restart nginx || true
    echo "🩺 Verificando salud del sistema..."
    sleep 5
    pm2 status
    curl -s http://localhost:4000/api/health
  `;

  console.log('\n🏃 Ejecutando script de despliegue...');
  
  conn.exec(deployScript, (err, stream) => {
    if (err) {
      console.error('❌ Error al ejecutar el script:', err);
      conn.end();
      return;
    }

    stream.on('close', (code, signal) => {
      if (code === 0) {
        console.log('\n✨ Despliegue completado con éxito.');
      } else {
        console.warn(`\n⚠️ El script terminó con código ${code}`);
      }
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('❌ Error de conexión SSH:', err.message);
}).connect(config);
