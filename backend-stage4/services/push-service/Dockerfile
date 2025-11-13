FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY shared ./shared
COPY services/push-service ./services/push-service

RUN npm install
RUN npm run build

EXPOSE 3004

CMD ["npm", "run", "start:push"]
