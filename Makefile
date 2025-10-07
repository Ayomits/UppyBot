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
	docker exec -it uppy-bot pnpm run build

logs_bot:
	docker compose logs uppy-bot -f

logs_backend:
	docker compose logs uppy-backend -f

logs_frontend:
	docker compose logs uppy-frontend -f

down:
	docker compose down --remove-orphans

build:
	docker compose build --no-cache

up:
	docker compose up -d

update_app:
	make update_bot
	make update_backend
	make update_frontend

update_bot:
	docker exec -it uppy-bot pnpm install

update_backend:
	docker exec -it uppy-backend pnpm install

update_frontend:
	docker exec -it uppy-frontend pnpm install

console_bot:
	docker exec -it uppy-bot sh

console_backend:
	docker exec -it uppy-backend sh

console_frontend:
	docker exec -it uppy-frontend sh

restart_bot:
	docker compose restart uppy-bot

restart_backend:
	docker compose restart uppy-backend

restart_frontend:
	docker compose restart uppy-frontend

restart:
	docker compose restart

lint_fix:
	docker exec -it uppy-bot pnpm run lint:fix
	docker exec -it uppy-bot pnpm run format:fix
