# ---- Base Stage ----
# Sets up pnpm in a base image to be reused.
FROM node:20-slim AS base
WORKDIR /app
RUN npm install -g pnpm

# ---- Builder Stage ----
# This stage installs dependencies and builds the Next.js application.
FROM base AS builder

# Copy dependency definition files
COPY package.json pnpm-lock.yaml ./
# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Set the build-time environment variable for the API URL.
# The value will be passed in by docker-compose during the build.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build the Next.js application for production
RUN pnpm run build

# ---- Production Stage ----
# This stage sets up the final production image.
FROM base AS production

# Copy production dependencies definition
COPY package.json pnpm-lock.yaml ./
# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Create a non-root user for enhanced security
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy the essential output from the builder stage
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next ./.next
COPY --from=builder --chown=nextjs:nextjs /app/node_modules ./node_modules

# Expose the port Next.js will run on
EXPOSE 3000

# Set the command to start the Next.js server in production mode
CMD ["pnpm", "start"]
