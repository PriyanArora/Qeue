# Build Flow

## Baseline Completed Locally

| Phase | Result |
| --- | --- |
| P1-P2 | Repo pivot, service layout, contracts |
| P3 | Dependency Compose |
| P4-P5 | Event service and lifecycle |
| P6 | Identity service and JWT |
| P7 | Gateway routing and role guards |
| P8-P10 | Registration storage, capacity safety, cancellation, outbox |
| P11 | RabbitMQ publisher/consumer paths |
| P12 | Notification worker |
| P13-P14 | React organizer/attendee workflows |

## Product Phases

| Phase | Result |
| --- | --- |
| 1 | Event builder, attendee list, registration questions, CSV export implemented |
| 2 | Code-based check-in, analytics, notification templates implemented |
| 3 | Registration types, sessions/speakers, post-event survey implemented |

Implementation rules:

- Reuse current services.
- Use projections for cross-service read needs.
- Add no new runtime framework unless tests prove a clear need.

## Platform Roadmap

| Work | Required proof |
| --- | --- |
| Full Compose | passed: `docker compose up --build`, services healthy, gateway smoke flow |
| Local Kubernetes | `kubectl apply -k deploy/k8s/overlays/local`, pods healthy, one registration flow |
| CI | workflow added for backend tests, frontend tests/build, image checks, manifest validation |

## Verification Commands

```sh
cd services/event-service && ./mvnw test
cd services/identity-service && ./mvnw test
cd services/gateway-service && ./mvnw test
cd services/registration-service && ./mvnw test
cd services/notification-worker && ./mvnw test
cd web-client && npm test && npm run build
docker compose -f infra/docker-compose.yml config
docker compose -f infra/docker-compose.yml build
docker compose -f infra/docker-compose.yml up --build
docker run --rm -v "$PWD:/work" -w /work bitnami/kubectl:latest kustomize deploy/k8s/overlays/local
git diff --check
```

## Local Run Order

1. Start the full stack: `docker compose -f infra/docker-compose.yml up --build`.
2. Open `http://localhost:3000`.
3. Browser API calls go through `http://localhost:8080`.
4. Use seed users from `ProjectSummary.md`.
