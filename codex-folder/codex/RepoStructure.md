# Repo Structure

## Top Level

- `README.md` - main local run and status docs.
- `.env.example` - safe local config template.
- `contracts/` - OpenAPI and AsyncAPI contracts.
- `infra/` - full local Compose stack.
- `deploy/` - local Kubernetes manifests and overlay.
- `api-requests/` - manual HTTP examples.
- `grpc-requests/` - preserved gRPC baseline examples.
- `codex-folder/` - project memory and planning.
- `qeue.iml` - local IntelliJ module file.

## Active Code

- `services/identity-service` - auth, users, roles, JWT.
- `services/gateway-service` - browser API entry point and guards.
- `services/event-service` - event lifecycle and event-owned setup data.
- `services/registration-service` - event inventory projection, registrations, answers, check-in, analytics, export.
- `services/notification-worker` - notification logs and templates.
- `web-client` - React/Vite frontend.

## Preserved Baseline Code

- `event-service/` - root baseline copy from the original pivot.
- `registration-service/` - root baseline copy from the original pivot.

## Planning Files

- `codex-folder/codex/ProjectSummary.md` - scope, architecture, routes, runtime, gaps.
- `codex-folder/codex/Progress.md` - current status and roadmap tasks.
- `codex-folder/codex/codex_progress.md` - detailed implementation checklist.
- `codex-folder/codex/BuildFlow.md` - build order and proof commands.
- `codex-folder/codex/progress_manual_tasks.md` - manual checks.
