# Makefile

.PHONY: watch down build

ENV ?= dev

watch:
	sudo docker compose -f ./resources/$(ENV)/docker-compose.yml up --watch

down:
	sudo docker compose -f ./resources/$(ENV)/docker-compose.yml down

build:
	sudo docker compose -f ./resources/$(ENV)/docker-compose.yml build
