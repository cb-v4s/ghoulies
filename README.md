# GOsties

![gosty](./ui/public/gosty.png)

### Overview

This is web-based platform that enables users to host and join virtual meetups in a game-like environment allowing them to interact with others through text chat. Built with security and scalability in mind, this project aims to handle millions of concurrent users (with some tweaks) while providing a seamless and engaging experience.

### Tech stack

<!-- - **Apache Kafka** A cluster of brokers to handle XXXX
- **Zookeper** For the kafka brokers to coordinate with each other. -->

- **Typescript** Javascript but better.
- **Golang** For high performance and efficient handling of concurrent connections.
- **Postgres** SQL database.
- **Redis** Memory-based data storage (gamer speed pro max) used mainly for keeping track of active Websocket sessions, rooms info and caching.
- **React** SPA for dynamic and interactive UI components.

### Setup

Make sure you have installed the lastest version of docker desktop on your machine and on your path.

###### Development

Create `.env` files accordingly for each `.env-template`

```sh
make watch
```

Go visit `http://localhost`

###### Release

```sh
make run ENV=release
```
