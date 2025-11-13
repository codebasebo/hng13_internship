FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY shared ./shared
COPY services/api-gateway ./services/api-gateway

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:gateway"]
