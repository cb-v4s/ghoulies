# Makefile

.PHONY: watch down build

ENV ?= dev

watch:
	sudo docker compose -f ./docker-compose-dev.yml up --watch

down:
	sudo docker compose -f ./docker-compose-$(ENV).yml down

build:
	sudo docker compose -f ./docker-compose-$(ENV).yml build
