FROM node:24.4.1-alpine3.21

RUN apk add --no-cache supervisor

WORKDIR /app

COPY ./docker/supervisord/dev/supervisord.conf /etc/supervisor/supervisord.conf

COPY ./ /app

RUN npm install pnpm -g
RUN mkdir -p /var/log/supervisor/

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
