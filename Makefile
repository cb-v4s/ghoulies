# Makefile

.PHONY: watch down build

ENV ?= dev
EXTERNAL_DB ?= false

DB_STRING := $(if $(filter true,$(EXTERNAL_DB)),external-db,local-db)
COMPOSE_FILE := ./resources/$(ENV)/docker-compose-$(DB_STRING).yml

watch:
	sudo docker compose -f $(COMPOSE_FILE) up --watch

down:
	sudo docker compose -f $(COMPOSE_FILE) down

build:
	sudo docker compose -f $(COMPOSE_FILE) build
