# Phase History

## Current Snapshot

- Branch: `P1-10`.
- Local state: roadmap code is implemented through services, web client, contracts, Compose, local Kubernetes manifests, and CI workflow.
- Git state: dirty worktree; original phase commits/PRs were not completed.
- Current gate: external proof and worktree cleanup.

## Completed Baseline

| Phase | Status | Result |
| --- | --- | --- |
| G0 | complete locally | Product identity, workflow, architecture goals |
| P1 | complete locally | Baseline pivot into event/registration naming |
| P2 | complete locally | Active `services/` layout and contracts |
| P3 | partial | Dependency Compose for Postgres, RabbitMQ, MailHog |
| P4-P5 | complete locally | Event service lifecycle and tests |
| P6 | complete locally | Identity service, roles, JWT, seed users |
| P7 | complete locally | Gateway routes and role guards |
| P8-P10 | complete locally | Registration model, capacity safety, idempotency, cancellation, outbox |
| P11 | code complete | RabbitMQ publisher/consumer paths |
| P12 | code complete | Notification worker and local logs |
| P13-P14 | code complete | React public, organizer, attendee workflows |
| Cleanup | complete locally | Qeue rename and concise docs |

Manual proof still needed for browser walkthrough, RabbitMQ UI, MailHog UI, hosted CI, live Kubernetes apply, and release tagging.

## Baseline Behavior

- Organizer can create, edit, publish, and cancel events.
- Attendee can list events, reserve a seat, view registrations, and cancel.
- Duplicate active registrations are rejected.
- Capacity-safe logic protects concurrent registration.
- Outbox rows are created for event and registration changes.
- Notification worker consumes registration messages when queues are enabled.

## Product Phases

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

## Platform Phases

- Full app Docker Compose complete locally.
- Local Kubernetes manifests render locally.
- GitHub Actions CI workflow added.
- Release tag after proof passes.
