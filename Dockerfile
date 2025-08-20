FROM node:24.4.1-alpine3.21

RUN apk add --no-cache supervisor

WORKDIR /app

ARG APP_ENV=dev

COPY ./ /app

COPY ./docker/supervisord/dev/supervisord.conf /tmp/supervisord-dev.conf
COPY ./docker/supervisord/prod/supervisord.conf /tmp/supervisord-prod.conf

RUN mkdir -p /etc/supervisor
RUN touch /etc/supervisor/supervisord.conf

RUN if [ "$APP_ENV" = "prod" ]; then \
  cp /tmp/supervisord-prod.conf /etc/supervisor/supervisord.conf; \
  else \
  cp /tmp/supervisord-dev.conf /etc/supervisor/supervisord.conf; \
  fi && \
  rm /tmp/supervisord-*.conf

RUN npm install pnpm -g

RUN if [ "$APP_ENV" = "prod" ]; then \
  pnpm install --frozen-lockfile && \
  pnpm run build; \
  fi
RUN mkdir -p /var/log/supervisor/

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
