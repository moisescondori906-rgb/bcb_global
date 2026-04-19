#!/bin/bash

# BCB Global - Production Deployment Script v7.0.5
# Senior Fullstack Architect Standard

set -e

echo "🚀 Iniciando despliegue de BCB Global..."

# 1. Sincronización de código
echo "📥 Trayendo cambios de GitHub..."
git pull origin main

# 2. Backend - Dependencias y Reinicio
echo "📦 Instalando dependencias del Backend..."
cd backend
npm install --production
cd ..

# 3. Frontend - Build
echo "🏗️ Construyendo el Frontend..."
cd frontend
npm install
npm run build
echo "🧹 Limpiando directorio public del backend..."
rm -rf ../backend/public/*
echo "🚚 Moviendo build al servidor estático del backend..."
cp -r dist/* ../backend/public/
cd ..

# 4. Base de Datos - Migraciones (Si existen)
# echo "🗄️ Ejecutando migraciones..."
# node backend/src/data/migrate.js

# 5. Reinicio de Procesos con PM2
echo "🔄 Reiniciando procesos PM2..."
pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs --env production

# 6. Verificación Automática
echo "🔍 Verificando estado del sistema..."
sleep 5
HEALTH_CHECK=$(curl -s http://localhost:4000/health)

if [[ $HEALTH_CHECK == *"\"status\":\"ok\""* ]]; then
  echo "✅ Despliegue COMPLETADO con éxito."
  echo "📊 Salud del sistema: $HEALTH_CHECK"
else
  echo "❌ ERROR: El sistema no responde correctamente tras el despliegue."
  echo "Logs de error de PM2:"
  pm2 logs --lines 20 --no-colors
  exit 1
fi

echo "🚀 BCB Global está en línea."
