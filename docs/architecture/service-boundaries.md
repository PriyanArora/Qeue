# Service Boundaries

Phase 2 defines the target workspace shape and external contracts before deeper implementation.

## Workspace Decision

- `event-service/` was copied to `services/event-service/`.
- `registration-service/` was copied to `services/registration-service/`.
- The root service directories were left in place so the Phase 1 baseline commands still run unchanged.
- Generated `target/` directories were not copied.

The copied services keep their existing package roots for now:

| Service | Java package root |
|---------|-------------------|
| `services/event-service` | `com.pm.eventservice` |
| `services/registration-service` | `com.pm.registrationservice` |
| `services/identity-service` | `com.pm.identityservice` |
| `services/gateway-service` | `com.pm.gatewayservice` |
| `services/notification-worker` | `com.pm.notificationworker` |

## Ownership Rules

- Each service owns its own database or schema.
- Services do not read or write each other's tables.
- Cross-service state will move through contracts, gateway-routed HTTP, and later domain events.

## Gateway Path Prefixes

Browser traffic goes through `gateway-service` after P7. Before P7, the existing root service ports remain baseline-only verification paths.

| Gateway path | Target service | Phase implemented |
|--------------|----------------|-------------------|
| `/api/auth/**` | `identity-service` | P6 and P7 |
| `/api/events` | `event-service` | P4 and P5 |
| `/api/events/{eventId}` | `event-service` | P5 |
| `/api/organizer/events/**` | `event-service` | P5 and P7 |
| `/api/events/{eventId}/registrations` | `registration-service` | P8 and P9 |
| `/api/registrations/**` | `registration-service` | P10 |
| `/api/me/registrations` | `registration-service` | P8 |

## Event Timing

RabbitMQ begins only after synchronous service slices work. The planned exchange is `eventforge.events`, with routing keys defined in `contracts/asyncapi/event-platform-events.yaml`.

The first event names are:

- `EventPublished`
- `EventCancelled`
- `RegistrationConfirmed`
- `RegistrationCancelled`
