#!/bin/bash

# ==============================================================================
# BCB GLOBAL - SCRIPT DE DESPLIEGUE PROFESIONAL (VPS)
# ==============================================================================

# Colores para la consola
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando despliegue de BCB Global v7.0.1 Stable...${NC}"

# 1. Sincronización con Repositorio
echo -e "${YELLOW}📦 Actualizando código desde GitHub...${NC}"
git pull origin main || { echo -e "${RED}❌ Error al hacer git pull${NC}"; exit 1; }

# 2. Instalación de Dependencias del Backend
echo -e "${YELLOW}⚙️ Instalando dependencias del Backend...${NC}"
cd backend
npm install || { echo -e "${RED}❌ Error en npm install (Backend)${NC}"; exit 1; }

# 3. Instalación y Build del Frontend
echo -e "${YELLOW}🎨 Construyendo el Frontend (Vite)...${NC}"
cd ../frontend
npm install || { echo -e "${RED}❌ Error en npm install (Frontend)${NC}"; exit 1; }
npm run build || { echo -e "${RED}❌ Error al construir el Frontend${NC}"; exit 1; }

# 4. Reinicio de Servicios con PM2
echo -e "${YELLOW}🔄 Reiniciando procesos con PM2 (Cluster Mode)...${NC}"
cd ../backend
# Verificamos si el proceso ya existe
if pm2 show bcb-global-backend > /dev/null 2>&1; then
    pm2 restart ecosystem.config.cjs --env production
else
    pm2 start ecosystem.config.cjs --env production
fi

pm2 save

echo -e "${GREEN}✅ ¡Despliegue completado con éxito! El sistema está online y estable.${NC}"
pm2 status
