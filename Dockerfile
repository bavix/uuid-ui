FROM node:21.4-alpine3.19

WORKDIR /app
COPY . /app

RUN npm ci --production && npm run build

EXPOSE 8080

CMD "npm" "run" "serve"
