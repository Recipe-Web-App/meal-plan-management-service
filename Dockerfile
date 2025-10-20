# Multi-stage build for production optimization
FROM node:25-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including dev dependencies for build stage
FROM base AS deps
RUN npm ci

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client & build application
RUN npx prisma generate && npm run build

# Production stage
FROM node:25-alpine AS production

# Set NODE_ENV
ENV NODE_ENV=production

# Create app directory with proper permissions
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies (skip scripts to avoid husky)
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy built application and prisma schema
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma

# Generate Prisma client for production
RUN npx prisma generate

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
CMD ["node", "dist/main.js"]
