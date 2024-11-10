![gosty](./ui/public/gosties.png)

# ghosties-app

### Overview

This is web-based platform that enables users to host and join virtual meetups in a game-like environment allowing them to interact with others through text chat. Built with security and scalability in mind, this project aims to handle millions of concurrent users (with some tweaks) while providing a seamless and engaging experience.

### Tech stack

- **Typescript** Javascript but better.
- **Golang** For high performance and efficient handling of concurrent connections.
- **Postgres** SQL database.
- **Redis** Memory-based data storage (gamer speed pro max) used mainly for keeping track of active Websocket sessions, rooms info and caching.
- **React** SPA for dynamic and interactive UI components.

### Setup

Make sure you have installed the latest version of docker desktop on your machine and on your path.

###### Development

Create `.env` files accordingly for each `.env-template`

```sh
make watch
```

```sh
make watch EXTERNAL_DB=true # when using a service like neon for postgres, so it doesn't download postgres/pgadmin images
```

Go visit `http://localhost`

###### Release

```sh
make run ENV=release
```

### Docs

Visit `http://localhost:8000/docs/index.html`

Generate rest api docs using Swagger

```sh
cd core/app && /bin/bash -c "$(go env GOPATH)/bin/swag init -g ./cmd/api/main.go -o docs/"
```
