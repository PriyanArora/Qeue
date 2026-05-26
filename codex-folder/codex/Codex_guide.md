# Codex Guide

## Project

- Name: Qeue.
- Type: Java/Spring microservice event platform with React UI.
- Direction: Cvent-inspired event management, focused on practical organizer and attendee workflows.
- Core rule: confirmed registrations must never exceed event or registration-type capacity.

## Active Components

- `web-client`: React/Vite UI.
- `gateway-service`: browser-facing API gateway and role guard.
- `identity-service`: users, roles, JWT.
- `event-service`: event setup, lifecycle, questions, registration types, sessions, speakers, surveys.
- `registration-service`: event inventory projection, registrations, capacity, answers, attendee list, check-in, analytics, CSV export, survey responses.
- `notification-worker`: notification logs and templates.

## Roadmap

Phase 1:

1. Better event setup/event builder.
2. Organizer attendee list.
3. Registration form questions.
4. CSV export.

Phase 2:

1. Code-based check-in.
2. Basic event analytics.
3. Notification templates.

Phase 3:

1. Registration types.
2. Agenda, sessions, and speakers.
3. Post-event survey.

## Engineering Rules

- Prefer `services/`; root `event-service/` and `registration-service/` are preserved baseline copies.
- Use Java 21 and each service's Maven wrapper.
- Use `VITE_API_BASE_URL=http://localhost:8080`.
- Use `qeue.*` for project Spring config keys.
- Keep queue listeners and outbox publishers disabled unless RabbitMQ is running.
- Add Flyway migrations, API contracts, tests, gateway routes, and basic UI for new browser-facing features.
- Never make one service read another service's database.
- Prefer projections from existing events over synchronous service calls.
- Store ticket code hashes only; issue or rotate raw codes for attendee display.
