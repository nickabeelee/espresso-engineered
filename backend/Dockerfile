# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../shared/package*.json ../shared/ || true

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .
COPY ../shared ../shared

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S fastify -u 1001

USER fastify

EXPOSE 3000

CMD ["npm", "start"]