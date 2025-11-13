FROM node:20-alpine

# Reuse backend-stage4 project assets
WORKDIR /app

COPY backend-stage4/package.json backend-stage4/pnpm-lock.yaml backend-stage4/pnpm-workspace.yaml backend-stage4/tsconfig.json ./backend-stage4/
COPY backend-stage4/shared ./backend-stage4/shared
COPY backend-stage4/services ./backend-stage4/services

WORKDIR /app/backend-stage4

RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/services/api-gateway/src/index.js"]
