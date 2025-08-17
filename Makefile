init:
	make down
	make build
	make up
	make update_bot
	make restart_bot

down:
	docker compose down --remove-orphans

build:
	docker compose build

up:
	docker compose up -d

update_bot:
	docker exec -it fear-bot pnpm install

console_bot:
	docker exec -it fear-bot sh

restart_bot:
	docker compose restart fear-bot

restart:
	docker compose restart

lint_fix:
	docker exec -it fear-bot pnpm run lint:fix
	docker exec -it fear-bot pnpm run format:fix
