FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Copy all source code
COPY shared ./shared
COPY services ./services

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build the project
RUN pnpm build

# Expose the API Gateway port
EXPOSE 3000

# Start the API Gateway service
CMD ["node", "dist/services/api-gateway/src/index.js"]
