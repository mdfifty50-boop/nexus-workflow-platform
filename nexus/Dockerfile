# Nexus Backend Server - Dockerfile for Northflank/Railway/Render
# Persistent Node.js backend for WhatsApp Baileys, AI proxy, and real-time services

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (tsx is needed at runtime)
RUN npm ci --legacy-peer-deps

# Copy server source, config, and tsconfig
COPY server/ ./server/
COPY config/ ./config/
COPY tsconfig.server.json ./

# WhatsApp sessions directory (persistent volume mount point)
RUN mkdir -p /app/.whatsapp-sessions-baileys

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-4567}/api/health || exit 1

# Expose port (Northflank will set PORT env var)
EXPOSE ${PORT:-4567}

# Start server using tsx (TypeScript executor, no compilation needed)
CMD ["node", "--import", "tsx", "server/index.ts"]
