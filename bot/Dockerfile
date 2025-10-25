FROM node:24-alpine3.21

WORKDIR /app

COPY ./bot /app

RUN npm install pnpm -g

RUN pnpm install

RUN pnpm run build

CMD ["pnpm run prod"]