# Legacy Service Map

This repository has been pivoted from a patient-management learning project into the EventForge event-management baseline. The current services are intentionally modest: they preserve useful Spring Boot, REST, JPA, Maven, Dockerfile, protobuf, and gRPC learning work while replacing old domain names with event-platform names.

## Service Rename Map

| Old baseline | Current baseline | Current purpose |
|--------------|------------------|-----------------|
| `patient-service/` | `event-service/` | Spring Boot REST CRUD service for event records |
| `billing-service/` | `registration-service/` | Spring Boot gRPC stub for registration creation |
| `api-requests/patient-service/` | `api-requests/event-service/` | Manual HTTP examples for event CRUD |
| `grpc-requests/billing-service/` | `grpc-requests/registration-service/` | Manual gRPC example for registration stub |
| `patient-management.iml` | `eventforge.iml` | IntelliJ module file for the renamed project |

## Java Package Map

| Old package | Current package |
|-------------|-----------------|
| `com.pm.patientservice` | `com.pm.eventservice` |
| `com.pm.billingservice` | `com.pm.registrationservice` |

## Domain Map

| Old concept | Current concept |
|-------------|-----------------|
| Patient REST entity | Event REST entity |
| Patient request and response DTOs | Event request and response DTOs |
| Patient repository | Event repository |
| Billing gRPC service | Registration gRPC service |
| Billing account request | Registration request |

## Current Event Service Baseline

`event-service` uses Spring Boot 4.0.1 and Java 21. It currently has:

- REST endpoints under `/events`
- Controller, service, repository, DTO, mapper, model, and exception layers
- JPA with H2 and PostgreSQL runtime dependencies
- Bean validation on request DTO fields
- `data.sql` with deterministic event seed rows
- A context-load smoke test
- A multi-stage Dockerfile

This is not the final EventForge event lifecycle. Organizer ownership, draft/published/cancelled status, capacity, publish rules, Flyway migrations, gateway routing, and JWT checks belong to later phases.

## Current Registration Service Baseline

`registration-service` uses Spring Boot 4.0.1 and Java 21. It currently has:

- A protobuf contract in `src/main/proto/registration_service.proto`
- A gRPC service named `RegistrationService`
- A `CreateRegistration` RPC that returns a simple hardcoded response
- HTTP port `4001` and gRPC port `9001`
- A context-load smoke test
- A multi-stage Dockerfile

This is not the final capacity-safe registration service. Registration storage, idempotency keys, inventory projection, outbox messages, RabbitMQ, cancellation, and notification events belong to later phases.

## Future Structure

The long-term structure in `codex-folder/codex/ProjectSummary.md` moves services under `services/` and adds gateway, identity, notification, frontend, contracts, infrastructure, deployment, and CI directories. That restructuring starts in Phase 2, not Phase 1.
