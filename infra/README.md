# Local Infrastructure

Phase 3 starts only shared local dependencies. Application services are still run separately until the full platform Compose phase.

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

- RabbitMQ management UI: `http://localhost:15672`
- MailHog UI: `http://localhost:8025`

Use `RABBITMQ_USERNAME` and `RABBITMQ_PASSWORD` from `.env.example` for RabbitMQ login. All defaults in `infra/docker-compose.yml` are dummy local values only.
