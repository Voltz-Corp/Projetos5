# Makefile para facilitar comandos Docker
.PHONY: build run build-run stop clean logs

# Buildar os containers
build:
	docker compose build

# Rodar os containers (assumindo que já estão buildados)
run:
	docker compose up -d

# Buildar e rodar os containers
build-run:
	docker compose up --build -d

# Parar os containers
stop:
	docker compose down

# Limpar containers, volumes e imagens
clean:
	docker compose down -v --rmi all

# Ver logs dos containers
logs:
	docker compose logs -f

# Ver status dos containers
status:
	docker compose ps

# Acessar shell do container frontend
shell-frontend:
	docker compose exec frontend sh

# Acessar shell do container backend
shell-backend:
	docker compose exec backend sh