FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create non-root user (handle existing group)
RUN addgroup -g 1001 appuser || true
RUN adduser -u 1001 -G appuser -s /bin/sh -D appuser 2>/dev/null || adduser -u 1001 -g 1001 -s /bin/sh -D appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start development server
CMD ["npm", "start"]