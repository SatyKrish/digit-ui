# Multi-stage Docker build for production deployment
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install build dependencies for native modules like better-sqlite3
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./
# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
# Install build dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build environment variables to prevent database initialization
ENV NODE_ENV=production
ENV BUILDING=true
ENV NEXT_PHASE=phase-production-build

# Rebuild native modules for the target platform and build the application
RUN npm rebuild better-sqlite3
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory for SQLite database with proper permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy the rebuilt node_modules with native binaries
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Note: Health checks are handled by Kubernetes probes in K8s deployments
# Docker HEALTHCHECK removed to avoid conflicts with K8s liveness/readiness probes

CMD ["node", "server.js"]
