FROM golang:1.25-alpine

RUN apk add --no-cache runit

WORKDIR /app

ARG APP_ENV=dev
ENV APP_ENV=$APP_ENV

COPY ./backend /app

COPY ./docker/runit/backend/run.run /tmp/runit.run

RUN mkdir -p /etc/service/app /runit

RUN cp /tmp/runit.run /etc/service/app/run

RUN rm -rf /tmp/*

RUN chmod +x /etc/service/app/run

CMD ["runsvdir", "/etc/service"]
