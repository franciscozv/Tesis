# ---- Base Stage ----
# Sets up pnpm in a base image to be reused.
FROM node:20-slim AS base
WORKDIR /app
RUN npm install -g pnpm

# ---- Builder Stage ----
# This stage installs all dependencies (including devDependencies) and builds the application.
FROM base AS builder

# Copy dependency definition files and install all dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Generate Prisma client - this is necessary for Prisma to work correctly
RUN pnpm prisma generate

# Build the TypeScript source code into JavaScript
RUN pnpm run build

# ---- Production Stage ----
# This stage creates the final, lightweight image with only production assets.
FROM base AS production

# Copy production dependencies definition
COPY package.json pnpm-lock.yaml ./
# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Create a non-root user for security purposes
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 node
USER node

# Copy the built application and necessary modules from the builder stage
COPY --from=builder --chown=node:nodejs /app/dist ./dist
COPY --from=builder --chown=node:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=node:nodejs /app/prisma ./prisma

# Expose the port the application will run on. The actual port number is passed via .env.
EXPOSE ${PORT:-8080}

# The command to start the application in production mode.
CMD ["node", "dist/server.js"]