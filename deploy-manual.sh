#!/bin/bash

# Este script automatiza el despliegue MANUAL de la aplicación usando NVM y PM2.
# Se detendrá inmediatamente si cualquier comando falla para evitar errores parciales.
set -e

# --- Inicio del Script ---
echo "🚀 Iniciando el script de despliegue manual (PM2)..."

# --- 1. Verificación de Prerrequisitos ---
echo "▶️ Verificando que las herramientas necesarias (git, curl) estén instaladas..."

# Verifica si el comando 'git' existe.
if ! command -v git &> /dev/null; then
    echo "❌ ERROR: 'git' no está instalado. Por favor, ejecute 'sudo apt install git' y vuelva a intentarlo."
    exit 1
fi

# Verifica si el comando 'curl' existe.
if ! command -v curl &> /dev/null; then
    echo "❌ ERROR: 'curl' no está instalado. Por favor, ejecute 'sudo apt install curl' y vuelva a intentarlo."
    exit 1
fi

echo "✅ Herramientas base verificadas."

# --- 2. Configuración del Entorno de Node.js ---
echo "▶️ Configurando el entorno de Node.js (NVM, Node, PNPM, PM2)..."

# Instala NVM (Node Version Manager) solo si no existe.
if [ ! -d "$HOME/.nvm" ]; then
  echo "NVM no encontrado. Instalando NVM..."
  # Descarga y ejecuta el script de instalación de NVM.
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

# Carga NVM en la sesión actual del script para poder usar sus comandos.
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Instala la última versión LTS (Long-Term Support) de Node.js y la establece como la versión a usar.
nvm install --lts
nvm use --lts

# Instala/Actualiza pnpm y pm2 globalmente usando npm.
npm install -g pm2 pnpm

# --- 3. Despliegue de la Aplicación ---
echo "▶️ Deteniendo y eliminando cualquier proceso PM2 antiguo para un inicio limpio..."
# El '|| true' evita que el script falle si no hay procesos que detener/eliminar.
pm2 stop all || true
pm2 delete all || true

echo "▶️ Desplegando el Backend..."
cd backend
pnpm install
pnpm run build
pm2 start dist/index.js --name "backend-prod"
cd .. # Volver al directorio raíz

echo "▶️ Desplegando el Frontend..."
cd frontend
pnpm install
pnpm run build
# Usa 'pnpm' como el intérprete para el script 'preview' de Next.js.
pm2 start pnpm --name "frontend-prod" -- run preview
cd .. # Volver al directorio raíz

# --- 4. Finalización ---
echo "▶️ Guardando la lista de procesos de PM2 para que se reinicien automáticamente si el servidor se reinicia..."
pm2 save

echo "✅ Procesos iniciados y corriendo bajo PM2:"
pm2 list

echo "🎉 ¡Despliegue completado!"