# Qeue

Qeue is a learning portfolio project for building a small Java event-management platform. The target system is a microservice web platform where organizers publish events and attendees reserve seats without overselling capacity.

## Current Local State

This repository now targets a full local Qeue platform: event setup, registration, attendee tickets, check-in, analytics, surveys, notifications, Compose, local Kubernetes manifests, and CI.

- `event-service/` is a Spring Boot REST CRUD service for event records.
- `registration-service/` is a Spring Boot gRPC stub for creating a registration response.
- `services/event-service/` owns event lifecycle, builder fields, registration questions, registration types, speakers, sessions, surveys, event outbox rows, and event projection messages.
- `services/registration-service/` owns attendee registrations, answers, tickets, check-in, attendee lists, CSV export, analytics, survey responses, projected event inventory, and registration outbox rows.
- `services/identity-service/` provides registration, login, `/api/auth/me`, BCrypt password hashes, HMAC-SHA256 JWTs, Flyway migrations, and integration tests.
- `services/gateway-service/` validates JWTs, guards routes by role, proxies downstream APIs, and forwards trusted user headers.
- `services/notification-worker/` consumes registration notification events, deduplicates them, writes notification logs, and can send to MailHog when enabled.
- `web-client/` is a React/Vite TypeScript client for public browsing, auth, organizer setup, attendee registration, ticket display, check-in, analytics, and surveys.
- `contracts/openapi/` and `contracts/asyncapi/` contain route and event contracts.
- `api-requests/event-service/` contains manual HTTP request examples for event endpoints.
- `grpc-requests/registration-service/` contains a manual gRPC request example for the registration stub.
- `api-requests/registration-service/` contains manual HTTP request examples for registration endpoints.
- `codex-folder/` contains concise project memory, current status, architecture notes, and implementation progress.
- `codex-folder/explain/project-explanation.md` gives a short beginner-friendly explanation.

## Requirements

- Java 21
- Maven through each service's Maven wrapper
- Docker is required for Compose, image builds, and registration-service Testcontainers tests
- Node 22 LTS or newer and npm for `web-client`
- `kubectl` with kustomize support for manifest validation or local Kubernetes apply

## Run Checks

From `event-service/`:

```sh
./mvnw test
```

From `registration-service/`:

```sh
./mvnw test
```

From active service locations:

```sh
cd services/event-service && ./mvnw test
cd services/identity-service && ./mvnw test
cd services/gateway-service && ./mvnw test
cd services/registration-service && ./mvnw test
cd services/notification-worker && ./mvnw test
cd web-client && npm install && npm test && npm run build
```

From the repository root, start the full local platform:

```sh
docker compose -f infra/docker-compose.yml up --build
```

Open `http://localhost:3000`. Gateway is available at `http://localhost:8080`.

Stop the platform:

```sh
docker compose -f infra/docker-compose.yml down
```

If your filesystem loses executable bits, run the same commands through `sh ./mvnw test` and restore the wrapper permissions before committing.

Run event-service locally with the default in-memory database:

```sh
cd services/event-service
./mvnw spring-boot:run
```

Run event-service against local Postgres after starting Compose:

```sh
cd services/event-service
EVENT_DB_URL=jdbc:postgresql://localhost:5432/qeue_event \
EVENT_DB_USERNAME=qeue_event_user \
EVENT_DB_PASSWORD=change-me-local-only \
./mvnw spring-boot:run
```

Useful local checks:

```sh
curl http://localhost:4000/api/internal/health
curl http://localhost:4000/api/events
```

Run identity-service against local Postgres after starting Compose:

```sh
cd services/identity-service
IDENTITY_DB_URL=jdbc:postgresql://localhost:5432/qeue_identity \
IDENTITY_DB_USERNAME=qeue_identity_user \
IDENTITY_DB_PASSWORD=change-me-local-only \
IDENTITY_JWT_SECRET=replace-with-local-identity-secret-min-32-chars \
./mvnw spring-boot:run
```

Local seed accounts are development-only and both use password `LocalDevPassword1!`:

- `organizer@qeue.local` with role `ORGANIZER`
- `attendee@qeue.local` with role `ATTENDEE`

Run the gateway after identity-service, event-service, and registration-service are running.

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

Run registration-service against local Postgres after starting Compose:

```sh
cd services/registration-service
REGISTRATION_DB_URL=jdbc:postgresql://localhost:5432/qeue_registration \
REGISTRATION_DB_USERNAME=qeue_registration_user \
REGISTRATION_DB_PASSWORD=change-me-local-only \
./mvnw spring-boot:run
```

Run the notification-worker against local Postgres after starting Compose:

```sh
cd services/notification-worker
NOTIFICATION_DB_URL=jdbc:postgresql://localhost:5432/qeue_notification \
NOTIFICATION_DB_USERNAME=qeue_notification_user \
NOTIFICATION_DB_PASSWORD=change-me-local-only \
./mvnw spring-boot:run
```

Enable RabbitMQ publishers and listeners only after RabbitMQ is running:

```sh
RABBITMQ_LISTENER_ENABLED=true
EVENT_OUTBOX_PUBLISHER_ENABLED=true
REGISTRATION_OUTBOX_PUBLISHER_ENABLED=true
```

Run the web client locally:

```sh
cd web-client
npm install
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

Validate Kubernetes manifests:

```sh
kubectl kustomize deploy/k8s/overlays/local
```

After event-service, identity-service, registration-service, and gateway-service are running, use the seed attendee through the gateway:

```sh
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"attendee@qeue.local","password":"LocalDevPassword1!"}'
curl http://localhost:8080/api/me/registrations \
  -H "Authorization: Bearer <accessToken>"
```

## Local Configuration

Copy `.env.example` to `.env` for local-only values when later phases need environment variables. Keep `.env` out of Git. The example file uses dummy local values only and does not contain real credentials.

## Project Notes

- `codex-folder/codex/ProjectSummary.md` has architecture, boundaries, troubleshooting notes, and the legacy map.
- `codex-folder/codex/Progress.md` has current status.
- `codex-folder/codex/BuildFlow.md` has concise verification commands.
- `codex-folder/codex/RepoStructure.md` explains the active folders.
- `contracts/asyncapi/event-platform-events.yaml` has the queue contract.
