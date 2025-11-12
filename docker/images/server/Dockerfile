FROM node:24-alpine3.21

RUN apk add runit

WORKDIR /app

ARG APP_ENV=dev

COPY --chown=appuser:appuser ./ /app

COPY docker/runit/server/dev.run /tmp/runit-dev.run
COPY docker/runit/server/prod.run /tmp/runit-prod.run

RUN mkdir -p /etc/service/app /runit

RUN if [ "$APP_ENV" != "dev" ]; then \
  cp /tmp/runit-prod.run /etc/service/app/run; \
  else \
  cp /tmp/runit-dev.run /etc/service/app/run; \
  fi && \
  rm /tmp/runit-*.run

RUN chmod +x /etc/service/app/run
RUN npm install pnpm@10.13.1 -g

CMD ["runsvdir", "/etc/service"]
