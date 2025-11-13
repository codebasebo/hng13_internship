FROM node:20-alpine
WORKDIR /app/backend-stage4

# Copy manifests first for better layer caching
COPY backend-stage4/package.json ./
COPY backend-stage4/pnpm-lock.yaml ./
COPY backend-stage4/pnpm-workspace.yaml ./
COPY backend-stage4/tsconfig.json ./

# Copy source code
COPY backend-stage4/shared ./shared
COPY backend-stage4/services ./services

# Install dependencies and build
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm build

# Expose API Gateway port
EXPOSE 3000

# Start API Gateway
CMD ["node", "dist/services/api-gateway/src/index.js"]
