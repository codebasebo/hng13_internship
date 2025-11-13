FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy shared directory
COPY shared ./shared

# Copy service directory
COPY services/user-service ./services/user-service

# Install dependencies
RUN npm install

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start service
CMD ["npm", "run", "start:user"]
