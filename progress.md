# Qeue — Production Transformation Progress

This is a **sequential, gated checklist** for turning Qeue from an AI-generated
prototype into a real, runnable, deployable application.

## How to use this file

1. Work **top to bottom**. Do the steps inside a phase **in order**.
2. Each step is the **smallest next action** — do exactly one, tick it, move on.
3. At the end of every phase there is a **🚧 GATE**.
   **Do not start the next phase until every box in the current phase is ticked
   and the GATE check passes.** If the gate fails, go back and fix before moving on.
4. Tick a box by changing `[ ]` to `[x]`. Add a short note + date after it if useful.
5. If a step reveals a bug, fix it before ticking the box. "It runs" is the bar,
   not "the code exists".

### Repo facts (so steps are concrete)

- Services live in `services/`: `identity-service` (4001), `gateway-service` (8080),
  `event-service` (4000), `registration-service` (HTTP 4002 / gRPC 9001),
  `notification-worker` (4003). Web UI in `web-client/` (Compose 3000, Vite dev 5173).
- Local stack: `infra/docker-compose.yml`. Env template: `.env.example`.
- Infra: PostgreSQL, RabbitMQ (UI 15672), MailHog (UI 8025).
- CI: `.github/workflows/ci.yml`. Contracts: `contracts/`. K8s: `deploy/k8s/`.

### Phase overview

| Phase | Goal | Done |
| --- | --- | :---: |
| 0 | Run it exactly as-is (baseline) | [ ] |
| 1 | Environment & secrets hygiene | [ ] |
| 2 | Prove every core flow end-to-end | [ ] |
| 3 | All tests + CI green | [ ] |
| 4 | Security hardening | [ ] |
| 5 | Observability (logs, health, metrics) | [ ] |
| 6 | UI/UX polish | [ ] |
| 7 | Data & reliability | [ ] |
| 8 | Real deployment | [ ] |
| 9 | Production readiness / ops | [ ] |

---

## Phase 0 — Run it exactly as-is (baseline)

**Goal:** prove the app starts and serves a page before changing anything.
Do **not** improve or refactor in this phase — only get it running and write down
what's broken.

- [ ] Install/confirm prerequisites: `docker --version`, `docker compose version`,
      `java -version` (21), `node --version`.
- [ ] Confirm Docker daemon is running: `docker info` returns without error.
- [ ] Copy the env template: `cp .env.example .env` (do not edit values yet).
- [ ] Build and start the full stack:
      `docker compose -f infra/docker-compose.yml up --build -d`.
- [ ] Wait for health, then list status: `docker compose -f infra/docker-compose.yml ps`
      — every service should be `running`/`healthy` (not `restarting`).
- [ ] Tail logs for any service stuck in a crash loop and write the error down:
      `docker compose -f infra/docker-compose.yml logs --tail=50 <service>`.
- [ ] Open the web UI in a browser: http://localhost:3000 — confirm it loads.
- [ ] Hit the gateway health endpoint: `curl -s http://localhost:8080/api/internal/health`.
- [ ] Open RabbitMQ UI (http://localhost:15672) and MailHog UI (http://localhost:8025)
      to confirm infra is reachable.
- [ ] Create a file `KNOWN_ISSUES.md` and list everything that did NOT work in this phase.

**🚧 GATE 0:** `docker compose ps` shows all services healthy AND the web UI loads at
:3000 AND gateway health returns `UP`. **Do not proceed to Phase 1 until this passes.**

---

## Phase 1 — Environment & secrets hygiene

**Goal:** no real app should run on `change-me` defaults. Make config explicit and
keep secrets out of git.

- [ ] Confirm `.env` is git-ignored: `git check-ignore .env` prints `.env`.
      If not, add `.env` to `.gitignore`.
- [ ] Generate a strong JWT secret (≥32 bytes): `openssl rand -base64 48`.
- [ ] Set `IDENTITY_JWT_SECRET` in `.env` to that value. Set the gateway's verification
      secret to the **same** value (it must match the identity signing key).
- [ ] Replace every `change-me-local-only` DB password in `.env` with a unique
      generated value (one per service DB).
- [ ] Set `RABBITMQ_USERNAME` / `RABBITMQ_PASSWORD` to non-`guest` values in `.env`.
- [ ] Set `CORS_ALLOWED_ORIGINS` to the exact origin you use (e.g. `http://localhost:3000`).
- [ ] Audit `.env.example` — confirm it contains **only placeholders**, never a real secret.
- [ ] Grep the repo for hardcoded secrets that bypass env:
      `git grep -nE "(secret|password|jwt)\s*=" -- services | grep -vi '\${'` — every match
      should read from an env var, not a literal.
- [ ] Review committed K8s secrets in `deploy/k8s/base/secret.yaml` — confirm they are
      clearly marked as dummy/local-only (real values come later in Phase 8).
- [ ] Restart the stack with new values and re-run GATE 0 checks:
      `docker compose -f infra/docker-compose.yml up -d --force-recreate`.

**🚧 GATE 1:** stack still healthy with **no** `change-me`/`guest`/placeholder secrets in
`.env`, and `git status` shows `.env` is untracked. **Do not proceed until this passes.**

---

## Phase 2 — Prove every core flow end-to-end

**Goal:** click/curl through the whole product and confirm each promised feature
actually works against the running containers. Fix breakage as you find it.

- [ ] **Auth:** register a new attendee and a new organizer via the UI (or
      `api-requests/identity-service/register.http`); confirm login returns a token.
- [ ] **Current user:** confirm "who am I" works (`/api/auth/me` via gateway).
- [ ] **Organizer — create event:** create a draft event in the UI as the organizer.
- [ ] **Organizer — setup:** add a ticket type, a registration question, a speaker,
      a session, and a survey to that event.
- [ ] **Organizer — publish:** publish the event.
- [ ] **Messaging — inventory projection:** confirm the publish reached
      registration-service (RabbitMQ UI shows the message consumed; the event becomes
      registerable). Check `GET /api/internal/outbox/pending` is draining.
- [ ] **Attendee — browse + register:** as the attendee, see the published event and
      register for it (pick the ticket type, answer the question).
- [ ] **Capacity:** verify a sold-out event rejects registration (use a low-capacity
      event or `sold-out-registration.http`).
- [ ] **Idempotency:** re-send the same registration with the same idempotency key and
      confirm no duplicate is created.
- [ ] **Ticket + check-in:** issue the attendee ticket, then check it in as the organizer.
- [ ] **Notifications:** confirm MailHog (http://localhost:8025) received the
      registration-confirmed and check-in emails.
- [ ] **Analytics + export:** open organizer analytics and download the attendee CSV.
- [ ] **Survey:** submit the survey as the attendee; view responses as the organizer.
- [ ] **Cancel paths:** cancel a registration and cancel an event; confirm inventory and
      notifications update correctly.
- [ ] Update `KNOWN_ISSUES.md`: every flow above is either ✅ working or has a fix logged.

**🚧 GATE 2:** every bullet above is ✅ working end-to-end against the Docker stack, with
zero unresolved blockers in `KNOWN_ISSUES.md`. **Do not proceed until this passes.**

---

## Phase 3 — All tests + CI green

**Goal:** a real app has a trustworthy, automated safety net.

- [ ] Run each backend service's tests locally and confirm green:
      `cd services/<svc> && ./mvnw test` (do all five).
- [ ] Run frontend tests: `cd web-client && npm test`.
- [ ] Run the frontend production build: `cd web-client && npm run build`.
- [ ] Add at least one test for any flow from Phase 2 that broke and you fixed
      (regression guard).
- [ ] Run the CI workflow logic locally or push a branch and confirm
      `.github/workflows/ci.yml` passes end-to-end.
- [ ] Make CI a required check on the default branch (branch protection), so red CI
      blocks merges.

**🚧 GATE 3:** all backend tests, frontend tests, and the frontend build pass, and CI is
green on a pushed branch. **Do not proceed until this passes.**

---

## Phase 4 — Security hardening

**Goal:** close the gaps that separate a demo from something you'd expose.

- [ ] JWT: confirm tokens expire (`IDENTITY_JWT_EXPIRATION_MINUTES`) and the gateway
      rejects expired/invalid/missing tokens with 401 (test each case).
- [ ] Roles: confirm an attendee cannot call organizer-only routes and vice versa
      (use `api-requests/gateway-service/rejected-organizer-route.http`).
- [ ] CORS: confirm only `CORS_ALLOWED_ORIGINS` is allowed; a random origin is rejected.
- [ ] Passwords: confirm hashing (bcrypt/argon) is used and a minimum password policy is
      enforced at registration.
- [ ] Input validation: confirm every write endpoint rejects malformed/oversized bodies
      with a clean 400 (not a 500 stack trace).
- [ ] Error responses: confirm errors return the standard `ApiErrorDTO` shape and never
      leak stack traces or SQL to the client.
- [ ] Add basic rate limiting / abuse protection on auth endpoints at the gateway.
- [ ] Run a dependency vulnerability scan (`npm audit` for web-client; `./mvnw
      dependency:tree` + a CVE check for services) and address criticals.
- [ ] Confirm no secrets are logged (grep service logs for token/password values).

**🚧 GATE 4:** auth, role checks, CORS, validation, and error-shape tests all pass and no
critical dependency CVEs remain. **Do not proceed until this passes.**

---

## Phase 5 — Observability (logs, health, metrics)

**Goal:** when something breaks in Phase 8+, you can see why.

- [ ] Structured logging: confirm each service logs JSON or a consistent format with a
      level and timestamp.
- [ ] Correlation: propagate a request/correlation id from the gateway through downstream
      calls and into logs.
- [ ] Health: confirm liveness vs readiness endpoints exist and reflect DB/RabbitMQ
      connectivity (not just "process up").
- [ ] Metrics: expose Spring Boot Actuator/Prometheus metrics on each service.
- [ ] Stand up local metrics viewing (Prometheus scrape config, or at least confirm the
      `/actuator/prometheus` endpoint returns data).
- [ ] Dead-letter visibility: confirm a poison message lands in the DLQ
      (`registration.event-inventory.dlq` / `notification.registration-events.dlq`) and is
      observable.

**🚧 GATE 5:** every service exposes health + metrics, logs carry a correlation id, and a
forced failure is visible in logs/DLQ. **Do not proceed until this passes.**

---

## Phase 6 — UI/UX polish

**Goal:** make the web client feel like a product, not a scaffold.

- [ ] Every page has explicit loading, empty, and error states (reuse `StatusView`).
- [ ] Every form shows field-level validation errors from the API (`ApiErrorDTO.fields`).
- [ ] Navigation reflects auth state and role (organizer vs attendee menus).
- [ ] Responsive layout works at mobile width (test at 375px).
- [ ] Basic accessibility: labels on inputs, focus order, color contrast, keyboard nav.
- [ ] Consistent branding: app name, favicon, page titles, 404 page.
- [ ] Remove dead/demo UI and any console errors/warnings in the browser.
- [ ] Re-run `npm run build` and re-test the polished flows from Phase 2 in the built app.

**🚧 GATE 6:** all Phase 2 flows are usable end-to-end in the UI with proper
loading/error/empty states and no console errors. **Do not proceed until this passes.**

---

## Phase 7 — Data & reliability

**Goal:** correct data under load and after restarts.

- [ ] Review every Flyway migration; confirm a fresh DB migrates cleanly start to finish.
- [ ] Add indexes for the hot query paths (attendee lookups, outbox `status`, inventory
      by event).
- [ ] Confirm idempotency + active-registration uniqueness hold under concurrency
      (the registration Testcontainers concurrency tests pass).
- [ ] Confirm the outbox publishers drain reliably and survive a broker restart
      (stop/start RabbitMQ, verify pending messages flush).
- [ ] Confirm consumers are idempotent (replay a message; no double counting).
- [ ] Define and document a database backup/restore procedure for each service DB.
- [ ] Verify data survives `docker compose down && up` (named volumes intact).

**🚧 GATE 7:** fresh-DB migration works, concurrency tests pass, outbox/consumers are
proven idempotent and broker-restart-safe. **Do not proceed until this passes.**

---

## Phase 8 — Real deployment

**Goal:** run it somewhere other than your laptop.

- [ ] Build and tag versioned images for every service + web-client (not `:local`).
- [ ] Push images to a real container registry (GHCR/ECR/etc.).
- [ ] Move secrets out of `deploy/k8s/base/secret.yaml` into a real secret store
      (sealed-secrets / external-secrets / cloud secret manager).
- [ ] Set production env via ConfigMap (real DB URLs, RabbitMQ host, CORS origin).
- [ ] Apply the manifests to a real cluster: `kubectl apply -k deploy/k8s/overlays/<env>`.
- [ ] Confirm resource requests/limits and replica counts are set per deployment.
- [ ] Put the gateway/web-client behind an Ingress with a real domain + TLS certificate.
- [ ] Run the full Phase 2 flow checklist against the deployed environment.

**🚧 GATE 8:** the app is reachable on a real domain over HTTPS and all Phase 2 flows pass
there. **Do not proceed until this passes.**

---

## Phase 9 — Production readiness / ops

**Goal:** keep it alive and know when it isn't.

- [ ] Monitoring dashboards for the key metrics (request rate, errors, latency, queue depth).
- [ ] Alerting on: service down, high error rate, DLQ growth, DB/broker unreachable.
- [ ] Error tracking (e.g. Sentry) wired into services and the web client.
- [ ] Automated DB backups running on a schedule with a tested restore.
- [ ] A basic load test against the deployed env; record capacity limits.
- [ ] A short runbook: how to deploy, roll back, rotate secrets, and triage common alerts.
- [ ] Document the architecture and on-call expectations in the README.

**🚧 GATE 9:** monitoring + alerting are live, backups are tested, and a runbook exists.
**This is the finish line — the app is now a real, operable application.**

---

## Progress log

Add a line each session: `YYYY-MM-DD — finished Phase N step X / hit blocker Y`.

- 2026-06-06 — created this plan.
</content>
</invoke>
