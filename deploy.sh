#!/bin/bash

# BCB Global - Indestructible Deployment Script v9.5.0
# Senior Architect Standard - High Stability & Fault Tolerance

set -e

# Configuración
PROJECT_DIR="$(pwd)"
APP_NAME="bcb"
HEALTH_URL="http://localhost:3000/health"

echo "🚀 Iniciando despliegue profesional v9.5.0 de BCB Global..."

# 1. Validación de Entorno Pre-vuelo
if [ ! -f "backend/.env" ]; then
    echo "❌ ERROR: Archivo backend/.env no encontrado. Abortando."
    exit 1
fi

# 2. Sincronización de código
echo "📥 Sincronizando con GitHub..."
git pull origin main || exit 1

# 3. Instalación de dependencias
echo "📦 Instalando dependencias..."
npm install || exit 1

# 4. Frontend - Build de Producción
echo "🏗️ Construyendo el Frontend..."
cd frontend || exit 1
npm install || exit 1

# Validación Pre-Build: Eliminar artefactos de IA o código inválido
echo "🔍 Validando código fuente del Frontend..."
grep -r "```" src && { echo "❌ ERROR: Se detectaron artefactos de Markdown (```) en el código. Limpiando..."; find src -type f -name "*.jsx" -exec sed -i 's/```//g' {} +; } || echo "✅ Código limpio."

if ! npm run build; then
  echo "❌ ERROR: El build del frontend ha fallado."
  exit 1
fi
cd ..

# 5. Reinicio de Procesos con PM2
echo "🔄 Reiniciando procesos PM2..."
pm2 reload $APP_NAME || pm2 start backend/src/index.js --name $APP_NAME || exit 1

# 6. Verificación de Salud Post-Vuelo
echo "🔍 Verificando salud del sistema..."
sleep 3
if curl -f $HEALTH_URL; then
  echo "✅ DESPLIEGUE COMPLETADO EXITOSAMENTE."
else
  echo "❌ FALLO CRÍTICO: El servidor no respondió correctamente tras el despliegue."
  exit 1
fi

echo "✅ Deploy OK"
