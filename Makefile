init:
	make down
	make build
	make up
	make update_bot
	make restart_bot

init_prod:
	make down
	make build
	make up
	make update_bot
	make build_bot
	make restart_bot

build_bot:
	docker exec -it fear-bot pnpm run build

logs_bot:
	docker compose logs fear-bot -f

down:
	docker compose down --remove-orphans

build:
	docker compose build

up:
	docker compose up -d

update_bot:
	docker exec -it fear-bot pnpm install

update_backend:
	docker exec -it fear-backend go install github.com/swaggo/swag/cmd/swag@latest
	docker exec -it fear-backend go mod vendor

console_bot:
	docker exec -it fear-bot sh

console_backend:
	docker exec -it fear-backend sh

restart_bot:
	docker compose restart fear-bot

restart_backend:
	docker compose restart fear-backend


restart:
	docker compose restart

lint_fix:
	docker exec -it fear-bot pnpm run lint:fix
	docker exec -it fear-bot pnpm run format:fix
