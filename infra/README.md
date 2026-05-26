# Local Infrastructure

Compose starts the full local platform.

## Start

```sh
docker compose -f infra/docker-compose.yml up -d
```

## Status

```sh
docker compose -f infra/docker-compose.yml ps
```

## Stop

```sh
docker compose -f infra/docker-compose.yml down
```

## Reset Volumes

```sh
docker compose -f infra/docker-compose.yml down -v
```

## Local URLs

- Web client: `http://localhost:3000`
- Gateway: `http://localhost:8080`
- RabbitMQ management UI: `http://localhost:15672`
- MailHog UI: `http://localhost:8025`

Use `RABBITMQ_USERNAME` and `RABBITMQ_PASSWORD` from `.env.example` for RabbitMQ login. All defaults in `infra/docker-compose.yml` are dummy local values only.
