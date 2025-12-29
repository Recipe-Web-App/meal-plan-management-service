# Multi-stage build for production optimization
FROM oven/bun:1-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files and lockfile
COPY package.json bun.lock ./

# Install dependencies including dev dependencies for build stage
FROM base AS deps
RUN bun install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client & build application
RUN bunx prisma generate && bun run build

# Production stage
FROM oven/bun:1-alpine AS production

# Set NODE_ENV
ENV NODE_ENV=production

# Create app directory with proper permissions
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files and lockfile
COPY package.json bun.lock ./

# Install only production dependencies
RUN bun install --production --frozen-lockfile

# Copy built application, prisma schema, and generated client
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nestjs:nodejs /app/src/generated ./src/generated

# Create logs directory
RUN mkdir -p logs && \
    chown nestjs:nodejs logs

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/v1/health/live || exit 1

# Start the application
CMD ["bun", "run", "dist/main.js"]
