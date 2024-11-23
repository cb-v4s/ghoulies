![gosty](./ui/public/cover.png)

# ghosties-app

### Overview

This is web-based platform that enables users to host and join virtual meetups in a game-like environment allowing them to interact with others through text chat.

### Tech stack

- **Typescript** Javascript but better.
- **Golang** For high performance and efficient handling of concurrent connections.
- **Postgres** SQL database.
- **Redis** Memory-based data storage (gamer speed pro max) used mainly for keeping track of active Websocket sessions, rooms info and caching.
- **React** SPA for dynamic and interactive UI components.
- **HTML Canvas API** faster for complex, interactive graphics because it doesn't have to maintain a DOM for each object

### Setup

Make sure you have installed the latest version of docker desktop on your machine and on your path.

###### Development

Create `.env` files accordingly for each `.env-template`

```sh
make watch
```

```sh
make watch EXTERNAL_DB=true # when using a service like neon for postgres
```

Go visit `http://localhost`

###### Release

```sh
make run ENV=release
```

### Docs

Visit `http://localhost:8000/docs/index.html`

Generate REST API Docs using Swagger

```sh
cd core/app && /bin/bash -c "$(go env GOPATH)/bin/swag init -g ./cmd/api/main.go -o docs/"
```

Generate WebSocket API Docs using AsyncAPI

```sh
[p]npm|yarn install -g @asyncapi/generator
ag ./core/app/wsdocs/asyncapi.yaml @asyncapi/html-template -o ./core/app/wsdocs
```
