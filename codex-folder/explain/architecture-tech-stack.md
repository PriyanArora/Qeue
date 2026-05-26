# Architecture And Tech Stack

## Purpose

Qeue is a Cvent-inspired event platform for learning Java microservices, React, queues, outbox patterns, Docker, Kubernetes, and CI.

## Architecture

```text
web-client
  -> gateway-service
     -> identity-service
     -> event-service
     -> registration-service

event-service outbox -> RabbitMQ -> registration-service inventory projection
registration-service outbox -> RabbitMQ -> notification-worker
```

## Ownership

| Component | Owns |
| --- | --- |
| `identity-service` | Users, password hashes, roles, JWT |
| `event-service` | Events, event setup, registration questions, registration types, sessions, speakers, surveys |
| `registration-service` | Event inventory projection, organizer ownership projection, registrations, answers, attendee list, check-in, analytics, CSV export, survey responses |
| `notification-worker` | Notification logs and templates |
| `gateway-service` | Routing and route-level auth |
| `web-client` | Browser state and UI |

Rules:

- Browser API traffic goes through `gateway-service`.
- Services do not read another service's tables.
- Gateway validates JWTs and forwards trusted user headers.
- Downstream services enforce ownership for protected mutations.
- Cross-service changes use outbox rows and RabbitMQ events.
- Organizer registration views use projected event ownership in `registration-service`, not direct event table reads.
- Ticket codes are issued as raw one-time display values and stored only as hashes.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Java 21, Spring Boot, Spring MVC |
| Gateway | Spring Cloud Gateway Server Web MVC |
| Security | Spring Security, BCrypt, HMAC JWT |
| Persistence | Spring Data JPA, Hibernate, Flyway |
| Database | PostgreSQL locally; H2 where configured for tests/dev |
| Queue | RabbitMQ through Spring AMQP |
| Email proof | MailHog |
| Frontend | React, Vite, TypeScript, React Router |
| Tests | JUnit 5, Spring Boot Test, Mockito, Testcontainers, Vitest |
| Contracts | OpenAPI, AsyncAPI |
| Infra | Docker Compose, local Kubernetes manifests, GitHub Actions |

## Main API Surface

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/events` | Public event list |
| `GET` | `/api/events/{eventId}` | Public event detail |
| `GET/POST/PUT` | `/api/organizer/events/**` | Organizer event management |
| `POST` | `/api/events/{eventId}/registrations` | Attendee registration |
| `DELETE` | `/api/registrations/{registrationId}` | Registration cancellation |
| `GET` | `/api/me/registrations` | Attendee registrations |

## Implemented API Areas

- Event builder fields in event create/update/detail APIs.
- Organizer attendee list and registration detail APIs.
- Registration question APIs plus answer submission.
- CSV export API for event registrations.
- Check-in, analytics, notification template, registration type, session, speaker, and survey APIs.

## Data Summary

- Identity: `User`.
- Event: `Event`, `EventOutboxMessage`, registration questions, registration types, speakers, sessions, surveys.
- Registration: `EventInventory`, `Registration`, `RegistrationOutboxMessage`, answers, type inventory, check-in, survey responses.
- Notification: `NotificationLog`, `NotificationTemplate`.

## Runtime

Ports:

| Component | Port |
| --- | --- |
| gateway-service | `8080` |
| event-service | `4000` |
| identity-service | `4001` |
| registration-service | `4002` |
| notification-worker | `4003` |
| web-client | `3000` in Compose, usually `5173` in Vite dev |
| Postgres | `5432` |
| RabbitMQ | `5672`, UI `15672` |
| MailHog | SMTP `1025`, UI `8025` |

Key variables:

- `IDENTITY_JWT_SECRET`
- `IDENTITY_JWT_ISSUER`
- `EVENT_DB_URL`
- `IDENTITY_DB_URL`
- `REGISTRATION_DB_URL`
- `NOTIFICATION_DB_URL`
- `RABBITMQ_HOST`
- `RABBITMQ_EXCHANGE`
- `RABBITMQ_LISTENER_ENABLED`
- `EVENT_OUTBOX_PUBLISHER_ENABLED`
- `REGISTRATION_OUTBOX_PUBLISHER_ENABLED`
- `MAILHOG_ENABLED`
- `VITE_API_BASE_URL`

## Verification

```sh
cd services/event-service && ./mvnw test
cd services/identity-service && ./mvnw test
cd services/gateway-service && ./mvnw test
cd services/registration-service && ./mvnw test
cd services/notification-worker && ./mvnw test
cd web-client && npm test && npm run build
```

Current gaps:

- Dirty worktree needs cleanup or commit.
- Browser, RabbitMQ UI, and MailHog UI proof remain manual.
- Hosted CI and live Kubernetes apply are not proven locally.
