# Usa una imagen oficial de Node.js como base.
FROM node:20-slim

# Establece el directorio de trabajo dentro del contenedor.
WORKDIR /app

# Instala pnpm globalmente para manejar las dependencias.
RUN npm install -g pnpm

# Copia los archivos que definen las dependencias.
COPY package.json pnpm-lock.yaml ./

# Instala todas las dependencias del proyecto.
RUN pnpm install

# Copia el resto del código fuente de la aplicación.
COPY . .

# Ejecuta 'prisma generate' para crear el cliente de Prisma.
RUN pnpm prisma generate

# Compila el código de TypeScript a JavaScript.
RUN pnpm run build

# Expone el puerto en el que correrá la aplicación.
EXPOSE 8080

# El comando por defecto para iniciar la aplicación.
# Lo sobreescribiremos en docker-compose para añadir la migración.
CMD ["node", "dist/index.js"]