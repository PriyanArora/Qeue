# Qeue Project Summary

Qeue is an event-management learning platform. Organizers publish events, attendees register, and the system protects capacity under duplicate and concurrent requests.

## Current State

- Roadmap implementation is code complete across services, web client, contracts, Compose, Kubernetes manifests, and CI workflow.
- Full Compose build, startup, gateway smoke flow, backend tests, frontend tests/build, Docker image build, and manifest render validation passed locally.
- Manual proof remains for browser walkthrough, RabbitMQ dashboard, MailHog UI, hosted CI, live Kubernetes apply, and release tagging.

## Implemented Product Scope

Phase 1:

- Better event setup/event builder.
- Organizer attendee list.
- Registration form questions.
- CSV export.

Phase 2:

- Code-based check-in.
- Basic event analytics.
- Notification templates.

Phase 3:

- Registration types.
- Agenda, sessions, and speakers.
- Post-event survey.

## Architecture

```text
Browser
  -> web-client
  -> gateway-service
     -> identity-service -> identity database
     -> event-service -> event database + event outbox
     -> registration-service -> registration database + registration outbox

event-service outbox -> RabbitMQ qeue.events -> registration-service inventory projection
registration-service outbox -> RabbitMQ qeue.events -> notification-worker -> notification database / MailHog
```

## Service Boundaries

- Browser API calls go through `gateway-service`.
- Services own their own database state.
- Services do not read each other's tables.
- Cross-service state changes use HTTP contracts, RabbitMQ events, and outbox rows.
- `event-service` owns event configuration.
- `registration-service` owns registration submissions, capacity state, event inventory projection, and organizer-facing registration reports.
- `notification-worker` owns notification logs and templates.

## Planning Decisions

- Reuse the existing five-service architecture.
- Do not add a feedback service for surveys.
- Do not add a reporting service for analytics or CSV.
- Registration ownership checks use projected event organizer ids in `registration-service`.
- Ticket display issues or rotates a code because raw ticket codes are not stored.

## Existing Main Routes

| Route | Service | Auth |
| --- | --- | --- |
| `POST /api/auth/register` | identity | public |
| `POST /api/auth/login` | identity | public |
| `GET /api/auth/me` | identity | authenticated |
| `GET /api/events` | event | public |
| `GET /api/events/{id}` | event | public |
| `/api/organizer/events/**` | event | `ORGANIZER` |
| `POST /api/events/{id}/registrations` | registration | `ATTENDEE` |
| `DELETE /api/registrations/{id}` | registration | `ATTENDEE` |
| `GET /api/me/registrations` | registration | `ATTENDEE` |
| `GET /api/me/registrations/{id}/ticket` | registration | `ATTENDEE` |
| `/api/organizer/events/{id}/registrations/**` | registration | `ORGANIZER` |
| `POST /api/organizer/events/{id}/check-in` | registration | `ORGANIZER` |
| `GET /api/organizer/events/{id}/analytics` | registration | `ORGANIZER` |
| `/api/events/{id}/surveys/{surveyId}/responses` | registration | `ATTENDEE` |

## Browser Routes

| Route | Purpose |
| --- | --- |
| `/organizer/events/:eventId/attendees` | Attendee list and detail |
| `/organizer/events/:eventId/check-in` | Organizer check-in |
| `/organizer/events/:eventId/analytics` | Event metrics |
| `/organizer/events/:eventId/sessions` | Session management |
| `/organizer/events/:eventId/speakers` | Speaker management |
| `/organizer/events/:eventId/surveys` | Survey management |

## Events

- Exchange: `qeue.events`
- Routing keys: `event.published.v1`, `event.cancelled.v1`, `registration.confirmed.v1`, `registration.cancelled.v1`, `checkin.completed.v1`
- Queues: `registration.event-inventory`, `notification.registration-events`
- DLQs: `registration.event-inventory.dlq`, `notification.registration-events.dlq`

## Local Runtime

Required:

- Java 21
- Node/npm for `web-client`
- Docker for Postgres, RabbitMQ, MailHog, and Testcontainers

Start full stack:

```sh
docker compose -f infra/docker-compose.yml up --build
```

Run services separately when debugging:

```sh
cd services/event-service && ./mvnw spring-boot:run
cd services/identity-service && IDENTITY_JWT_SECRET=replace-with-local-identity-secret-min-32-chars ./mvnw spring-boot:run
cd services/registration-service && ./mvnw spring-boot:run
cd services/gateway-service && IDENTITY_JWT_SECRET=replace-with-local-identity-secret-min-32-chars ./mvnw spring-boot:run
cd web-client && VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

Seed users:

- `organizer@qeue.local` / `LocalDevPassword1!`
- `attendee@qeue.local` / `LocalDevPassword1!`

## Known Gaps

- Worktree is not clean.
- Browser, RabbitMQ dashboard, and MailHog UI proof remain manual.
- Hosted CI pass, live Kubernetes apply, and release tag are not proven locally.
