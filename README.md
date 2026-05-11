# EventForge

EventForge is a learning portfolio project for building a small Java event-management platform. The target system is a microservice web platform where organizers publish events and attendees reserve seats without overselling capacity.

## Current Baseline

This repository has local work through Phase 10 in progress. The current code is a renamed baseline from an earlier patient-management project, with the copied service workspace now carrying the newer EventForge implementation:

- `event-service/` is a Spring Boot REST CRUD service for event records.
- `registration-service/` is a Spring Boot gRPC stub for creating a registration response.
- `services/event-service/` is the Phase 4/5 event lifecycle service with Phase 10 event outbox preparation, Flyway migrations, env-driven database configuration, public event browsing, organizer draft/update/publish/cancel routes, and integration tests.
- `services/registration-service/` is the Phase 8-10 registration service with REST registration APIs, Flyway storage, PostgreSQL/Testcontainers test coverage, capacity-safe reservations, cancellation, and registration outbox rows.
- `services/identity-service/` is the Phase 6 identity service with registration, login, `/api/auth/me`, BCrypt password hashes, HMAC-SHA256 JWTs, Flyway migrations, and integration tests.
- `services/gateway-service/` is the Phase 7 gateway with JWT validation, route-level role guards, downstream proxying, and user header forwarding.
- `services/notification-worker/` is a placeholder for later phases.
- `contracts/openapi/` and `contracts/asyncapi/` contain Phase 2 draft route and event contracts.
- `api-requests/event-service/` contains manual HTTP request examples for the Phase 5 event lifecycle endpoints.
- `grpc-requests/registration-service/` contains a manual gRPC request example for the registration stub.
- `api-requests/registration-service/` contains manual HTTP request examples for the Phase 8-10 registration endpoints through the gateway plus direct outbox visibility.
- `codex-folder/` contains the gated build plan and is the source of truth for future phases.

The current local workspace does not yet include RabbitMQ message publishing, a React web client, Kubernetes manifests, or CI. Those are later gated phases.

## Requirements

- Java 21
- Maven through each service's Maven wrapper
- Docker is required for Phase 3 local infrastructure and registration-service Testcontainers tests
- Node is not required until Phase 13

## Run Checks

From `event-service/`:

```sh
./mvnw test
```

From `registration-service/`:

```sh
./mvnw test
```

From copied Phase 2 service locations:

```sh
cd services/event-service && ./mvnw test
cd services/identity-service && ./mvnw test
cd services/gateway-service && ./mvnw test
cd services/registration-service && ./mvnw test
```

There is no one-command full-platform app start yet. Docker Compose starts shared dependencies in Phase 3, gateway routing starts in Phase 7, registration workflows run through the gateway in Phase 8-10, the web client starts in Phase 13, and the complete local platform command starts in Phase 15.

From the repository root, start Phase 3 local dependencies:

```sh
docker compose -f infra/docker-compose.yml up -d
```

Stop the local dependencies:

```sh
docker compose -f infra/docker-compose.yml down
```

If your filesystem loses executable bits, run the same commands through `sh ./mvnw test` and restore the wrapper permissions before committing.

Run the Phase 5 event-service locally with the default in-memory database:

```sh
cd services/event-service
./mvnw spring-boot:run
```

Run the Phase 5 event-service against local Postgres after starting Compose:

```sh
cd services/event-service
EVENT_DB_URL=jdbc:postgresql://localhost:5432/eventforge_event \
EVENT_DB_USERNAME=eventforge_event_user \
EVENT_DB_PASSWORD=change-me-local-only \
./mvnw spring-boot:run
```

Useful local checks:

```sh
curl http://localhost:4000/api/internal/health
curl http://localhost:4000/api/events
```

Run the Phase 6 identity-service against local Postgres after starting Compose:

```sh
cd services/identity-service
IDENTITY_DB_URL=jdbc:postgresql://localhost:5432/eventforge_identity \
IDENTITY_DB_USERNAME=eventforge_identity_user \
IDENTITY_DB_PASSWORD=change-me-local-only \
IDENTITY_JWT_SECRET=replace-with-local-identity-secret-min-32-chars \
./mvnw spring-boot:run
```

Local seed accounts are development-only and both use password `LocalDevPassword1!`:

- `organizer@eventforge.local` with role `ORGANIZER`
- `attendee@eventforge.local` with role `ATTENDEE`

Run the gateway after the services it proxies are running. Phase 7 needs event-service and identity-service; Phase 8-10 registration routes also need registration-service.

```sh
cd services/gateway-service
IDENTITY_JWT_SECRET=replace-with-local-identity-secret-min-32-chars \
./mvnw spring-boot:run
```

Gateway checks:

```sh
curl http://localhost:8080/api/internal/health
curl http://localhost:8080/api/events
```

Run the Phase 8-10 registration-service against local Postgres after starting Compose:

```sh
cd services/registration-service
REGISTRATION_DB_URL=jdbc:postgresql://localhost:5432/eventforge_registration \
REGISTRATION_DB_USERNAME=eventforge_registration_user \
REGISTRATION_DB_PASSWORD=change-me-local-only \
./mvnw spring-boot:run
```

After event-service, identity-service, registration-service, and gateway-service are running, use the seed attendee through the gateway:

```sh
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"attendee@eventforge.local","password":"LocalDevPassword1!"}'
curl http://localhost:8080/api/me/registrations \
  -H "Authorization: Bearer <accessToken>"
```

## Local Configuration

Copy `.env.example` to `.env` for local-only values when later phases need environment variables. Keep `.env` out of Git. The example file uses dummy local values only and does not contain real credentials.

## Phase 1 Notes

Phase 1 documents the project pivot and keeps the baseline honest. See:

- `docs/legacy-service-map.md`
- `docs/repo-critique.md`
- `codex-folder/codex/Progress.md`

## Phase 2 Notes

Phase 2 defines the target workspace layout and contracts before adding new service behavior. See:

- `docs/architecture/service-boundaries.md`
- `contracts/openapi/identity-api.yaml`
- `contracts/openapi/event-api.yaml`
- `contracts/openapi/registration-api.yaml`
- `contracts/asyncapi/event-platform-events.yaml`

## Phase 3 Notes

Phase 3 starts only Postgres, RabbitMQ, and MailHog. See:

- `infra/docker-compose.yml`
- `infra/README.md`
