#!/bin/sh

# Salimos si algún comando falla
set -e

# Aplicamos las migraciones de la base de datos
echo "Applying database migrations..."
pnpm prisma migrate deploy
echo "Migrations applied."

# Iniciamos la aplicación principal
exec "$@"
