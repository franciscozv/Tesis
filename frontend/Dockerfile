# Etapa base: pnpm y corepack
FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Etapa de dependencias solo de producción
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

# Etapa de build
FROM base AS build

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# Copia el archivo .env si lo necesitas en build (ej: para NEXT_PUBLIC_*)
COPY .env .env

RUN pnpm run build

# Etapa final de ejecución
FROM node:20-alpine AS runner

WORKDIR /app

# Copiar node_modules y build
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

# Copiar .env si se requiere en producción
COPY --from=build /app/.env .env

ENV NODE_ENV=production

EXPOSE 3000

# Iniciar el servidor Next.js
CMD ["pnpm", "start"]
