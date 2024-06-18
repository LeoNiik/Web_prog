

up:
	sudo docker compose up -d --build

down:
	sudo docker compose down
restart:
	sudo docker compose down
	sudo docker compose up -d --build

logs:
	sudo docker logs web_prog-app-1

execsrv:
	sudo docker exec -it web_prog-app-1 bash

execdb:
	sudo docker exec -it web_prog-app-db-1 bash
clean:
	make down
	sudo docker volume rm db-default
dblog:
	sudo docker logs web_prog-app-db-1
