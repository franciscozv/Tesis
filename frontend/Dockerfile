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

# --- ¡PASO CLAVE AÑADIDO! ---
# Declara un argumento que se puede pasar durante el 'build'. Docker Compose lo proporcionará.
ARG NEXT_PUBLIC_CLIENTVAR
# Asigna el valor del argumento a una variable de entorno para que 'pnpm run build' lo pueda usar.
ENV NEXT_PUBLIC_CLIENTVAR=${NEXT_PUBLIC_CLIENTVAR}

# Construye la aplicación de Next.js para producción.
RUN pnpm run build

# Expone el puerto en el que correrá Next.js (siempre 3000 por defecto).
EXPOSE 3000

# El comando para iniciar el servidor de Next.js en modo producción.
CMD ["pnpm", "start"]