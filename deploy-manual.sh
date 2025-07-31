#!/bin/bash

# Este script automatiza el despliegue MANUAL de la aplicación usando NVM y PM2.
# Se detendrá inmediatamente si cualquier comando falla.
set -e

# --- Inicio del Script ---
echo "🚀 Iniciando el script de despliegue manual (PM2)..."

# --- 1. Configuración del Entorno (Solo se ejecuta si es necesario) ---
echo "▶️ Verificando y configurando el entorno (NVM, Node.js, PM2, pnpm)..."

# Instalar NVM (Node Version Manager) si no está instalado
if [ ! -d "$HOME/.nvm" ]; then
  echo "NVM no encontrado. Instalando NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

# Cargar NVM en la sesión actual del script para poder usarlo
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Instalar la última versión LTS (Long-Term Support) de Node.js
echo "Instalando/Usando la versión LTS de Node.js..."
nvm install --lts
nvm use --lts

# Instalar pnpm y pm2 globalmente usando npm
# -g es para instalación global
echo "Instalando/Actualizando PM2 y PNPM globalmente..."
npm install -g pm2 pnpm


# --- 2. Detener y Eliminar Procesos Antiguos ---
echo "▶️ Deteniendo y eliminando cualquier proceso PM2 antiguo para un inicio limpio..."
# El '|| true' evita que el script falle si no hay procesos que detener/eliminar.
pm2 stop all || true
pm2 delete all || true


# --- 3. Desplegar el Backend ---
echo "▶️ Desplegando el Backend..."
cd backend
echo "Instalando dependencias del backend..."
pnpm install
echo "Construyendo el backend..."
pnpm run build
echo "Iniciando el backend con PM2..."
pm2 start dist/index.js --name "backend-prod"
cd .. # Volver al directorio raíz


# --- 4. Desplegar el Frontend ---
echo "▶️ Desplegando el Frontend..."
cd frontend
echo "Instalando dependencias del frontend..."
pnpm install
echo "Construyendo el frontend..."
pnpm run build
echo "Iniciando el frontend con PM2..."
# Usamos 'pnpm' como el intérprete para el script 'preview'
pm2 start pnpm --name "frontend-prod" -- run preview
cd .. # Volver al directorio raíz


# --- 5. Guardar y Mostrar Estado ---
echo "▶️ Guardando la configuración de PM2 para que persista tras reinicios..."
pm2 save

echo "✅ Procesos iniciados y corriendo bajo PM2:"
pm2 list

# --- Fin del Script ---
echo "🎉 ¡Despliegue manual completado!"
