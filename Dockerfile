# Multi-stage production build for МИРОВИЗОР (vcore)

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for efficient layer caching
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run lint
RUN npm run test
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built frontend static files and bundled server from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expose default HTTP/WS port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start bundled Express server
CMD ["node", "dist/server.cjs"]
