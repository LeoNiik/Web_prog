

up:
	sudo docker compose up -d --build

down:
	sudo docker compose down
restart:
	sudo docker compose down
	sudo docker compose up -d --build
