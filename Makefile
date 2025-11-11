init:
	make down
	make build
	make up
	make update_app
	make restart_bot

init_prod:
	make down
	make build
	make up
	make update_bot
	make build_bot
	make restart_bot

build_bot:
	docker exec -it uppy-discord pnpm run build

logs_bot:
	docker compose logs uppy-discord -f

logs_backend:
	docker compose logs uppy-backend -f

down:
	docker compose down --remove-orphans

build:
	docker compose build --no-cache

up:
	docker compose up -d

update_app:
	make update_bot

update_bot:
	docker exec -it uppy-discord pnpm install

console_bot:
	docker exec -it uppy-discord sh

restart_bot:
	docker compose restart uppy-discord

restart_backend:
	docker compose restart uppy-backend

restart_frontend:
	docker compose restart uppy-frontend

restart:
	docker compose restart

lint_fix:
	docker exec -it uppy-discord pnpm run lint:fix
	docker exec -it uppy-discord pnpm run format:fix
