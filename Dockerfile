# Chess3D Backend
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install production deps
RUN npm ci --only=production

# Copy source
COPY backend/src ./src

# Create data dir for SQLite
RUN mkdir -p /data

# Environment
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/data/chess3d.db
ENV CORS_ORIGIN=*

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Run with auto-migration
CMD ["sh", "-c", "node ./config/migrate.js && node ./server.js"]
