init:
	make down
	make build
	make up
	make update_bot
	make generate_prisma
	make migrate_prisma
	make restart_bot

down:
	docker compose down --remove-orphans

build:
	docker compose build

up:
	docker compose up -d

update_bot:
	docker exec -it fear-bot pnpm install

generate_prisma:
	docker exec -it fear-bot pnpm run prisma:generate

migrate_prisma:
	docker exec -it fear-bot pnpm run prisma:migrate

console_bot:
	docker exec -it fear-bot sh

restart_bot:
	docker compose restart fear-bot

restart:
	docker compose restart
