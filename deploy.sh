#!/bin/bash
# Script de despliegue para NelaGlow en VPS
# Uso: ./deploy.sh
# Primera vez: ./deploy.sh --setup

set -e   # salir en cualquier error

APP_NAME="nelaglow"
APP_DIR="/var/www/nelaglow"
DB_NAME="nelaglow_db"
DB_USER="postgres"

# ──────────────────────────────────────────────────────────────────────────────
# SETUP INICIAL (solo correr una vez con: ./deploy.sh --setup)
# ──────────────────────────────────────────────────────────────────────────────
if [ "$1" == "--setup" ]; then
  echo "⚙️  SETUP INICIAL..."

  # Crear directorio
  mkdir -p "$APP_DIR"
  mkdir -p "$APP_DIR/logs"
  mkdir -p "$APP_DIR/uploads"

  # Crear base de datos
  echo "🗄️  Creando base de datos $DB_NAME..."
  sudo -u $DB_USER psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "La BD ya existe, continuando..."

  echo ""
  echo "✅ Setup base listo."
  echo ""
  echo "📋 PASOS SIGUIENTES:"
  echo "   1. Copia el código: scp -r . root@212.85.12.168:$APP_DIR"
  echo "      O clona el repo: git clone <URL> $APP_DIR"
  echo "   2. Configura el .env: cp .env.production.example .env && nano .env"
  echo "   3. Ejecuta el deploy: ./deploy.sh"
  exit 0
fi

# ──────────────────────────────────────────────────────────────────────────────
# DEPLOY NORMAL
# ──────────────────────────────────────────────────────────────────────────────
echo "🚀 Iniciando deploy de $APP_NAME..."

cd "$APP_DIR"

# Verificar .env
if [ ! -f ".env" ]; then
  echo "❌ No existe .env. Crea uno desde .env.production.example"
  exit 1
fi

# Crear directorios necesarios
mkdir -p logs uploads

# Detener app si está corriendo
echo "⏸️  Deteniendo app..."
pm2 stop "$APP_NAME" 2>/dev/null || true

# Backup de BD antes de migrar
echo "💾 Backup de base de datos..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p backups
sudo -u $DB_USER pg_dump "$DB_NAME" > "backups/db_backup_$TIMESTAMP.sql" 2>/dev/null || echo "⚠️  Backup falló (BD vacía?), continuando..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --production=false

# Generar cliente Prisma
echo "🔧 Generando cliente Prisma..."
npx prisma generate

# Aplicar migraciones / sincronizar schema
echo "🗄️  Sincronizando schema de BD..."
npx prisma db push --accept-data-loss

# Build
echo "🏗️  Construyendo aplicación..."
npm run build

# Reiniciar con PM2
echo "▶️  Iniciando app con PM2..."
pm2 start ecosystem.config.js --env production 2>/dev/null || pm2 restart "$APP_NAME"

# Guardar configuración PM2 (persiste entre reinicios del VPS)
pm2 save

# Estado final
echo ""
echo "✅ Deploy completado!"
echo ""
pm2 status
echo ""
echo "📝 Ver logs: pm2 logs $APP_NAME"
echo "🌐 App corriendo en: http://212.85.12.168:3001"
