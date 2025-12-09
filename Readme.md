# Небольшой гайд по деплою и запуску (для себя любимого и забывчивого)

Сервисы в Uppy:

1. Redis
2. Mongodb
3. Rabbitmq
4. Telegram бот
5. Discord bot
6. Fastify бекенд

## Для криптографии
```env
ENCRYPTION_KEY="super-secret-key"
```

## Для Redis

```env
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_USER="" # только прод
REDIS_PASSWORD="" # только прод
```

## Для Mongodb

```env
MONGO_URL="mongodb://localhost:27018/?authSource=admin"
```

## Для RabbitMQ

```env
RABBITMQ_URI="amqp://localhost:5672"
```

## Для Telegram

```env
TELEGRAM_TOKEN
MONGO_URL="mongodb://localhost:27018/?authSource=admin"
RABBITMQ_URI="amqp://localhost:5672"
ENCRYPTION_KEY="super-secret-key"

REDIS_HOST="localhost"
REDIS_PORT="6379"
```

## Для Discord

```env
APP_ENV=dev

TELEGRAM_TOKEN="8117414458:AAHYekMzJ2dKdlEmgMtN24P_5Dr3t0ltpeU"

DISCORD_TOKEN="MTM5NTcxOTgwNTc0NjY3OTg0OA.GL4Jfr.QO7oJuOEXmJ9xtV5tlSOOGyagYGCMjljTpK5YM"

UPPY_URL="http://localhost:4200"
UPPY_INTERNAL_TOKEN="super-secret-token"

MONGO_URL="mongodb://localhost:27018/?authSource=admin"

REDIS_HOST="localhost"
REDIS_PORT="6379"

RABBITMQ_URI="amqp://localhost:5672"
```

## Для Fastify

```env
APP_ENV=dev

DISCORD_CLIENT_ID="1395719805746679848"
DISCORD_CLIENT_SECRET="Dt5ZSrLvTdY2LEoU35MHubpTy7oqmEj_"
DISCORD_REDIRECT_URI="http://localhost:4200/discord/callback"

UPPY_URL="http://localhost:4200"
UPPY_INTERNAL_TOKEN="super-secret-token"

MONGO_URL="mongodb://localhost:27018/?authSource=admin"

REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_USER=""
REDIS_PASSWORD=""

RABBITMQ_URI="amqp://localhost:5672"
```