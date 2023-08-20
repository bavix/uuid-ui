FROM node:20-alpine

WORKDIR /app
COPY . /app

RUN npm ci --production && npm run build

EXPOSE 8080

CMD "npm" "run" "serve"
