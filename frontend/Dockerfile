FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user first
RUN addgroup -g 1001 appuser 2>/dev/null || true && \
    adduser -u 1001 -G appuser -s /bin/sh -D appuser 2>/dev/null || true

# Copy package files and install as root, then change ownership
COPY --chown=appuser:appuser package*.json ./

# Switch to appuser before npm install
USER appuser

# Install dependencies
RUN npm install

# Copy application code (already owned by appuser)
COPY --chown=appuser:appuser . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start development server
CMD ["npm", "start"]