# Manual Tasks

Last updated: May 26, 2026

## Current Gate

- [ ] Clean or intentionally commit the dirty worktree.
- [x] Run the full app locally through Compose.
- [ ] Prove the browser flow through the gateway.
- [x] Prove RabbitMQ-backed registration and notification flow through API smoke.
- [ ] Prove RabbitMQ and MailHog behavior in their UIs.
- [x] Build full app Compose.
- [x] Add local Kubernetes manifests.
- [x] Add GitHub Actions CI.

## Local Setup Checks

- [x] Java 21 available through local wrappers/build images.
- [x] Docker Compose v2 works.
- [x] Node/npm works for tests and build.
- [x] Frontend deps installed with `npm ci`.
- [ ] Optional Kubernetes tools: `kubectl`, `kind` or `minikube`
- [ ] Optional GitHub CLI: `gh auth status`

## Local Config

- [ ] Identity and gateway use the same `IDENTITY_JWT_SECRET`.
- [ ] Frontend uses `VITE_API_BASE_URL=http://localhost:8080`.
- [ ] Queue listeners and outbox publishers stay disabled unless RabbitMQ is running.
- [ ] `.env` stays out of Git.

## Run Locally

Start full stack:

```sh
docker compose -f infra/docker-compose.yml up --build
docker compose -f infra/docker-compose.yml ps
```

Start app processes:

```sh
cd services/event-service && ./mvnw spring-boot:run
cd services/identity-service && IDENTITY_JWT_SECRET=replace-with-local-identity-secret-min-32-chars ./mvnw spring-boot:run
cd services/registration-service && ./mvnw spring-boot:run
cd services/notification-worker && ./mvnw spring-boot:run
cd services/gateway-service && IDENTITY_JWT_SECRET=replace-with-local-identity-secret-min-32-chars ./mvnw spring-boot:run
cd web-client && VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

## Browser Proof

- [ ] Organizer logs in.
- [ ] Organizer creates and publishes an event.
- [ ] Published event appears publicly.
- [ ] Attendee logs in.
- [ ] Attendee reserves one seat.
- [ ] Duplicate registration is rejected.
- [ ] Attendee sees the registration.
- [ ] Attendee cancels the registration.

Seed users:

- `organizer@qeue.local` / `LocalDevPassword1!`
- `attendee@qeue.local` / `LocalDevPassword1!`

## RabbitMQ And MailHog Proof

- [x] Run RabbitMQ and MailHog from `infra/docker-compose.yml`.
- [x] Enable event outbox publishing.
- [x] Enable registration listeners and outbox publishing.
- [x] Enable notification-worker listener.
- [x] Publish an event and confirm inventory projection consumes the event message.
- [x] Register for an event and confirm notification message consumption.
- [ ] Confirm DLQs stay empty.
- [ ] Confirm MailHog output when SMTP is enabled.

## Product Phase 1 Proof

- [x] Event builder fields persist and render publicly.
- [x] Organizer can view attendee list for owned events only.
- [x] Organizer can create registration questions.
- [x] Attendee submits answers during registration.
- [x] CSV export includes registrations and answers.
- [x] Backend tests cover success, validation, auth, and ownership failures.
- [x] Frontend tests cover core forms and tables.

## Verification Commands

```sh
cd services/event-service && ./mvnw test
cd services/identity-service && ./mvnw test
cd services/gateway-service && ./mvnw test
cd services/registration-service && ./mvnw test
cd services/notification-worker && ./mvnw test
cd web-client && npm test && npm run build
git diff --check
```

## Stop

```sh
docker compose -f infra/docker-compose.yml down
```
