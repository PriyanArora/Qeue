# Progress

Last updated: May 26, 2026

## Current Status

- Project name: Qeue.
- Branch: `P1-10`.
- Local source state: roadmap implementation is code complete across backend, frontend, contracts, Compose, Kubernetes manifests, and CI workflow.
- Current gate: external proof for hosted CI, live Kubernetes apply, release tag, and worktree cleanup.

## Completed Locally

- [x] Legacy baseline pivoted into event/registration naming.
- [x] Active service tree added under `services/`.
- [x] Dependency Compose added for Postgres, RabbitMQ, and MailHog.
- [x] Event lifecycle implemented.
- [x] Identity/JWT service implemented.
- [x] Gateway routing and role guards implemented.
- [x] Registration capacity safety, idempotency, cancellation, and outbox implemented.
- [x] RabbitMQ publisher/consumer paths implemented.
- [x] Notification worker implemented.
- [x] React web client implemented.
- [x] Qeue name applied across source, config, contracts, tests, and docs.
- [x] Event builder fields, registration questions, registration types, sessions, speakers, and surveys implemented.
- [x] Organizer attendee list, CSV export, check-in, analytics, and survey response views implemented.
- [x] Ticket-code hashing and notification template rendering implemented.
- [x] Full Docker Compose app stack implemented and smoke-tested through the gateway.
- [x] Local Kubernetes manifests and GitHub Actions workflow added.

## Verified In Cleanup

- [x] Product-name scan passed.
- [x] Frontend unit tests passed.
- [x] Frontend production build passed.
- [x] Active backend Maven tests passed.
- [x] Docker Compose config passed.
- [x] Docker image build passed.
- [x] Full Compose startup passed with healthy services.
- [x] Gateway API smoke flow passed.
- [x] Kubernetes local overlay rendered with dockerized `kubectl kustomize`.
- [x] `git diff --check` passed.

## Not Yet Verified

- [ ] Runtime browser walkthrough through gateway.
- [ ] RabbitMQ dashboard proof.
- [ ] MailHog UI proof.
- [ ] Hosted CI pass.
- [ ] Live Kubernetes apply and pod readiness proof.
- [ ] Release tag.

## Implemented Product Phases

Phase 1:

- [x] Better event setup/event builder.
- [x] Organizer attendee list.
- [x] Registration form questions.
- [x] CSV export.

Each feature needs migrations, APIs, gateway routing when needed, contracts, backend tests, and basic React UI.

Implementation decisions:

- Use existing services.
- Use event projections for registration-service ownership checks.
- Store ticket code hashes only.

## Later Roadmap

Phase 2:

- [x] Code-based check-in.
- [x] Basic event analytics.
- [x] Notification templates.

Phase 3:

- [x] Registration types.
- [x] Agenda, sessions, and speakers.
- [x] Post-event survey.

## Platform Work

- [ ] Clean or intentionally commit the dirty worktree.
- [x] Build full app Docker Compose.
- [x] Add local Kubernetes manifests.
- [x] Add GitHub Actions CI.
- [ ] Tag a release after CI and deployment proof pass.
