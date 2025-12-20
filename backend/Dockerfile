# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency install
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Install dependencies (include dev deps for build tools)
RUN npm ci --prefix backend

# Copy source code
COPY backend ./backend
COPY shared ./shared

# Build the application and prune dev deps
RUN npm run build --prefix backend \
  && npm prune --omit=dev --prefix backend

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S fastify -u 1001

USER fastify

EXPOSE 8080

CMD ["node", "dist/index.js"]
