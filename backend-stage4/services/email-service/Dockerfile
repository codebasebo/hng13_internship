FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY shared ./shared
COPY services/email-service ./services/email-service

RUN npm install
RUN npm run build

EXPOSE 3003

CMD ["npm", "run", "start:email"]
