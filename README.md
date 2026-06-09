# Qeue

Qeue is a Java/Spring event-management platform for organizers and attendees. It is a learning portfolio project that started from an abandoned patient-management tutorial structure and was pivoted into a event platform.

The current product goal is simple: organizers can build and publish events, attendees can register without overselling capacity, and organizers can run basic event operations such as attendee management, check-in, analytics, notifications, and surveys.

## Current Feature Scope

The active implementation covers the event-platform scope:

- Event builder fields: format, category, banner image, venue, timezone, start/end time, capacity, draft/publish/cancel lifecycle.
- Registration questions and stored attendee answers.
- Registration types with per-type capacity enforcement.
- Agenda, sessions, and speakers.
- Organizer attendee list with status/type/search filters, sorting, registration detail data, and CSV export.
- Ticket-code check-in with hashed ticket codes.
- Notification templates and notification logs for registration and check-in events.
- Event analytics: capacity, confirmed/cancelled registrations, available seats, check-ins, no-shows, and type breakdown.
- Post-event survey definitions and attendee survey submissions.
- OpenAPI and AsyncAPI contracts for HTTP APIs and RabbitMQ event messages.

Public event pages show total capacity. Remaining capacity is available to organizers through analytics; it is not exposed on public event detail because registration capacity is owned by `registration-service` and the project avoids cross-service database reads.

## Architecture

Active runtime code lives under `services/` and `web-client/`.

| Component | Port | Responsibility |
| --- | ---: | --- |
| `services/identity-service` | `4001` | User registration, login, BCrypt password hashing, JWT issuing, `/api/auth/me`. |
| `services/gateway-service` | `8080` | Browser-facing API gateway, JWT validation, role checks, downstream proxy routing. |
| `services/event-service` | `4000` | Event lifecycle, event setup, registration-question definitions, registration-type definitions, speakers, sessions, surveys, event outbox. |
| `services/registration-service` | `4002`, gRPC `9001` | Registration correctness, event inventory projection, registration answers, tickets, check-in, attendee lists, CSV export, analytics, survey submissions, registration outbox. |
| `services/notification-worker` | `4003` | RabbitMQ notification consumer, template rendering, notification logs, optional MailHog SMTP delivery. |
| `web-client` | Compose `3000`, Vite `5173` | React/Vite browser UI for public browsing, auth, organizer workflows, attendee registration, tickets, check-in, analytics, and surveys. |

The root-level `event-service/` and `registration-service/` folders are older tutorial/stub service paths. They are not used by Docker Compose, Kubernetes, or the current browser workflow.

## Tech Stack

- Java 21 and Spring Boot 4 for the backend services.
- Spring MVC for HTTP APIs.
- Spring Security for stateless JWT-protected gateway and identity routes.
- Spring Data JPA and Flyway for relational persistence and migrations.
- PostgreSQL 16 for local service databases.
- H2 for most fast service tests; Testcontainers PostgreSQL for registration concurrency tests.
- RabbitMQ topic exchange plus transactional outbox tables for cross-service event propagation.
- gRPC in `registration-service` for the retained registration stub interface.
- React 19, TypeScript, Vite, and React Router for the UI.
- Docker Compose for the full local developer stack.
- Kubernetes manifests with Kustomize for local deployment shape validation.
- MailHog for local email inspection when notification delivery is enabled.

Why these tools:

- Docker Compose gives one command to run the complete local platform.
- Kubernetes manifests document the deployable service shape without requiring Kubernetes for daily development.
- RabbitMQ plus outbox keeps event publication durable enough for a microservice learning project.
- Flyway keeps schema changes explicit and repeatable across local, test, and container runs.
- Gateway-owned JWT validation keeps browser clients pointed at one API origin and prevents direct trust in user-supplied service headers.

## Prerequisites

- Java 21.
- Docker with Docker Compose.
- Node 22 LTS or newer and npm.
- `kubectl` only if validating or applying Kubernetes manifests.
- `kind` only if running the Kubernetes walkthrough.

## Run The Full Local App

From the repository root:

```sh
cp .env.example .env
docker compose -f infra/docker-compose.yml up --build
```

Open the UI:

```text
http://localhost:3000
```

Useful local URLs:

- Web UI: `http://localhost:3000`
- Gateway API: `http://localhost:8080`
- RabbitMQ management: `http://localhost:15672`
- MailHog: `http://localhost:8025`

Local seed accounts:

| Role | Email | Password |
| --- | --- | --- |
| Organizer | `organizer@qeue.local` | `LocalDevPassword1!` |
| Attendee | `attendee@qeue.local` | `LocalDevPassword1!` |

Stop the stack:

```sh
docker compose -f infra/docker-compose.yml down
```

Reset local database and broker volumes:

```sh
docker compose -f infra/docker-compose.yml down -v
```

## Run The UI In Vite Dev Mode

Use this when you want hot reload while the backend services run in Compose:

```sh
docker compose -f infra/docker-compose.yml up --build postgres rabbitmq mailhog identity-service event-service registration-service notification-worker gateway-service
cd web-client
npm install
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

Open:

```text
http://localhost:5173
```

## Run Services Individually

Start shared infrastructure first:

```sh
docker compose -f infra/docker-compose.yml up postgres rabbitmq mailhog
```

Then run services from their active folders. Example:

```sh
cd services/event-service
EVENT_DB_URL=jdbc:postgresql://localhost:5432/qeue_event \
EVENT_DB_USERNAME=qeue_event_user \
EVENT_DB_PASSWORD=change-me-local-only \
RABBITMQ_HOST=localhost \
./mvnw spring-boot:run
```

Use the same pattern for:

- `services/identity-service`
- `services/registration-service`
- `services/notification-worker`
- `services/gateway-service`

Required local secrets and connection values are listed in `.env.example`.

## Verification

Backend service tests:

```sh
cd services/identity-service && ./mvnw test
cd services/event-service && ./mvnw test
cd services/registration-service && ./mvnw test
cd services/gateway-service && ./mvnw test
cd services/notification-worker && ./mvnw test
```

`services/registration-service` tests require Docker because they use Testcontainers PostgreSQL for capacity and concurrency checks.

Frontend checks:

```sh
cd web-client
npm test
npm run build
```

Kubernetes manifest validation:

```sh
kubectl kustomize deploy/k8s/overlays/local
```

## API Contracts

- Identity API: `contracts/openapi/identity-api.yaml`
- Event API: `contracts/openapi/event-api.yaml`
- Registration API: `contracts/openapi/registration-api.yaml`
- Platform events: `contracts/asyncapi/event-platform-events.yaml`

Manual request examples live in `api-requests/` and `grpc-requests/`.

For a full file-by-file project walkthrough, read `explanation.md`.

## Local Kubernetes

Build images, load them into kind, apply manifests, and port-forward the web client:

```sh
docker build -t qeue/identity-service:local services/identity-service
docker build -t qeue/event-service:local services/event-service
docker build -t qeue/registration-service:local services/registration-service
docker build -t qeue/notification-worker:local services/notification-worker
docker build -t qeue/gateway-service:local services/gateway-service
docker build -t qeue/web-client:local web-client
kind load docker-image qeue/identity-service:local qeue/event-service:local qeue/registration-service:local qeue/notification-worker:local qeue/gateway-service:local qeue/web-client:local
kubectl apply -k deploy/k8s/overlays/local
kubectl -n qeue-local get pods
kubectl -n qeue-local port-forward svc/web-client 3000:80
```

Open `http://localhost:3000`.

## Configuration Notes

- `.env.example` contains local-only dummy credentials and ports.
- Keep real secrets out of Git.
- `IDENTITY_JWT_SECRET` must be at least 32 bytes.
- `RABBITMQ_LISTENER_ENABLED`, `EVENT_OUTBOX_PUBLISHER_ENABLED`, and `REGISTRATION_OUTBOX_PUBLISHER_ENABLED` are enabled in Compose for the full platform.
- `MAILHOG_ENABLED=true` sends rendered notification emails to MailHog; otherwise notification logs are still recorded with status `SKIPPED`.

## CI

GitHub Actions runs:

- Maven tests for all active backend services.
- npm test and production build for `web-client`.
- Docker image builds.
- Kubernetes Kustomize validation.
- `git diff --check`.
