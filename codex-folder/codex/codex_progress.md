# Codex Progress

Purpose: smallest practical checklist to overhaul this repo into the finished Qeue event platform described by the current roadmap.

## Implementation Run Status

- [x] Planning files critiqued and tightened in three passes before implementation.
- [x] Phase 1 backend, frontend, contracts, and examples implemented.
- [x] Phase 2 backend, frontend, contracts, AsyncAPI, and examples implemented.
- [x] Phase 3 backend, frontend, contracts, AsyncAPI, and examples implemented.
- [x] Compose, Dockerfiles, local Kubernetes manifests, and CI workflow implemented.
- [x] Backend tests passed for identity, event, registration, gateway, and notification services.
- [x] Frontend tests and production build passed.
- [x] Docker Compose config, image build, full stack startup, and gateway smoke flow passed.
- [x] Local Kubernetes manifests rendered successfully with dockerized `kubectl kustomize`.
- [ ] Hosted CI pass, branch protection, release tag, fresh-clone proof, and live Kubernetes apply still need external environment proof.

## Finished Product Target

- [x] Organizer can create, edit, publish, cancel, and manage rich events.
- [x] Attendee can browse events, answer registration questions, register, view ticket code, cancel, and submit survey feedback.
- [x] Organizer can view attendees, export CSV, check attendees in, see analytics, manage sessions, speakers, registration types, and surveys.
- [x] Notification worker renders templates and logs delivery for key event actions.
- [x] Confirmed registrations never exceed event capacity or registration-type capacity.
- [x] Browser traffic goes through `gateway-service`.
- [x] Services never read another service's database.
- [x] Full app runs locally with Compose.
- [ ] Local Kubernetes deployment works.
- [x] CI runs backend tests, frontend tests/build, image checks, and manifest validation.

## Tech Stack To Keep

- [x] Keep Java 21.
- [x] Keep Spring Boot.
- [x] Keep Spring Web MVC.
- [x] Keep Spring Cloud Gateway Server Web MVC.
- [x] Keep Spring Security.
- [x] Keep BCrypt password hashing.
- [x] Keep HMAC JWT auth.
- [x] Keep Spring Data JPA and Hibernate.
- [x] Keep Flyway migrations.
- [x] Keep PostgreSQL for local shared databases.
- [x] Keep H2 only where already useful for tests or lightweight local defaults.
- [x] Keep RabbitMQ and Spring AMQP.
- [x] Keep transactional outbox rows.
- [x] Keep MailHog for local email proof.
- [x] Keep React, Vite, TypeScript, and React Router.
- [x] Keep Vitest, React Testing Library, and jsdom.
- [x] Keep JUnit 5, Spring Boot Test, Mockito, and Testcontainers.
- [x] Keep OpenAPI and AsyncAPI contracts.
- [x] Keep Docker Compose.
- [x] Keep local Kubernetes target with kind or minikube.
- [x] Keep GitHub Actions for CI.

## New Technical Additions

- [x] Add CSV response support through Spring MVC endpoints.
- [x] Add frontend file download handling with `Blob` and browser download APIs.
- [x] Add ticket code generation and hashing using JDK/Spring crypto utilities.
- [x] Add template rendering in `notification-worker` with a small internal placeholder renderer.
- [x] Add more event-owned tables for setup, questions, registration types, sessions, speakers, and surveys.
- [x] Add more registration-owned tables for answers, event ownership projection, type inventory, check-in, analytics reads, CSV export, and survey responses.
- [x] Add contract entries for every browser-facing route.
- [x] Add request examples for every major workflow.

## Planning Critique Pass 1

- [x] Reuse the current services instead of adding new services.
- [x] Keep `event-service` as the event setup owner.
- [x] Keep `registration-service` as the registration and reporting owner.
- [x] Use RabbitMQ projections for registration-service event ownership checks.
- [x] Avoid direct cross-service database reads.
- [x] Avoid per-request event-service calls for attendee-list ownership checks.
- [x] Store only ticket code hashes.
- [x] Make ticket display issue or rotate a code instead of reading raw codes from storage.
- [x] Keep CSV generation inside registration-service because it owns submitted registrations and answers.

## Planning Critique Pass 2

- [x] Do not add a CSV library; simple escaped rows are enough.
- [x] Do not add a template engine; notification placeholders are limited and deterministic.
- [x] Do not add a chart library; analytics UI uses metric cards and tables.
- [x] Do not split survey storage into a new service.
- [x] Do not make display-name snapshots block Phase 1; fall back to attendee email.
- [x] Add nullable future-facing registration columns once when they reduce later migrations.
- [x] Keep frontend components local until duplication is proven.
- [x] Keep root baseline services untouched.

## Planning Critique Pass 3

- [x] Remove unresolved conditional implementation language.
- [x] Treat identity display-name changes as unnecessary for the first pass.
- [x] Treat migration proof as integration-test proof.
- [x] Keep checklists executable in current repo order.
- [x] Start implementation with active services, then contracts, frontend, platform, and CI.

## Repo Stabilization

- [x] Run `git status --short`.
- [x] Identify files changed by previous work.
- [x] Separate unrelated dirty changes from roadmap changes.
- [x] Decide whether preserved root `event-service/` remains read-only baseline.
- [x] Decide whether preserved root `registration-service/` remains read-only baseline.
- [x] Ensure active work only targets `services/`.
- [x] Run stale product-name scan.
- [x] Fix stale project names if found.
- [x] Run `git diff --check`.
- [x] Fix whitespace errors.
- [x] Run current backend tests.
- [x] Run current frontend tests.
- [x] Run current frontend build.
- [ ] Record current failures before feature work.
- [ ] Commit or intentionally stage a clean baseline.

## Architecture Baseline

- [x] Confirm gateway routes all browser API calls.
- [x] Confirm gateway forwards trusted user headers.
- [x] Confirm downstream services validate user role and ownership.
- [x] Confirm event-service owns event setup data.
- [x] Confirm registration-service owns registration submissions.
- [x] Confirm notification-worker owns notification logs.
- [x] Confirm event-service and registration-service outbox tables exist.
- [x] Confirm RabbitMQ exchange name is `qeue.events`.
- [x] Confirm queue listeners are off by default.
- [x] Confirm publishers are off by default.
- [x] Confirm local configs use `qeue.*` project keys.
- [x] Update architecture docs when a service boundary changes.

## Contract Baseline

- [x] Review `contracts/openapi/identity-api.yaml`.
- [x] Review `contracts/openapi/event-api.yaml`.
- [x] Review `contracts/openapi/registration-api.yaml`.
- [x] Review `contracts/asyncapi/event-platform-events.yaml`.
- [x] Add missing baseline routes to OpenAPI.
- [x] Add missing baseline message schemas to AsyncAPI.
- [x] Add standard `ApiError` schema where missing.
- [x] Add auth requirements to protected routes.
- [x] Keep route names consistent with gateway routes.

## Frontend Baseline

- [x] Review current route tree in `web-client/src/App.tsx`.
- [x] Review auth state in `web-client/src/state/AuthContext.tsx`.
- [x] Review API client in `web-client/src/services/api.ts`.
- [x] Review shared API types.
- [x] Review organizer pages.
- [x] Review attendee pages.
- [x] Review event form component.
- [x] Normalize loading states.
- [x] Normalize empty states.
- [x] Normalize error states.
- [x] Keep UI basic and workflow-focused.
- [x] Add reusable form field helpers only when duplication becomes clear.
- [x] Add reusable table patterns only when needed by attendee list/export/analytics.

## Identity Service Hardening

- [x] Confirm register route accepts organizer and attendee roles only.
- [x] Confirm duplicate email conflict behavior.
- [x] Confirm login failure behavior.
- [x] Confirm `/api/auth/me` behavior.
- [x] Confirm JWT includes user id, email, and role.
- [x] Confirm tests cover happy path and rejection path.
- [x] Reuse existing user fields for attendee identity.
- [x] Use attendee email as display-name fallback.
- [x] Keep seed users unchanged unless identity fields already support display names.

## Gateway Service Hardening

- [x] Add Phase 1 organizer attendee-list route.
- [x] Add Phase 1 registration-question routes.
- [x] Add Phase 1 CSV export route.
- [x] Add Phase 2 check-in route.
- [x] Add Phase 2 analytics route.
- [x] Add Phase 3 registration-type routes.
- [x] Add Phase 3 session routes.
- [x] Add Phase 3 speaker routes.
- [x] Add Phase 3 survey routes.
- [x] Add tests for each protected organizer route.
- [x] Add tests for attendee-only routes.
- [x] Add tests for public read routes.
- [x] Add wrong-role tests.
- [x] Add missing-token tests.
- [x] Add invalid-token tests.

## Event Service: Foundation

- [x] Review current `Event` entity.
- [x] Review current event DTOs.
- [x] Review event mapper.
- [x] Review event repository queries.
- [x] Review event lifecycle service.
- [x] Review event controller routes.
- [x] Review event tests.
- [x] Keep draft, published, and cancelled lifecycle.
- [x] Preserve public visibility rule for published events only.
- [x] Preserve organizer ownership checks.
- [x] Preserve event outbox behavior for publish/cancel.

## Registration Service: Foundation

- [x] Review current `EventInventory` entity.
- [x] Review current `Registration` entity.
- [x] Review current registration DTOs.
- [x] Review registration repository queries.
- [x] Review capacity-safe transaction.
- [x] Review idempotency-key behavior.
- [x] Review cancellation behavior.
- [x] Review registration outbox behavior.
- [x] Preserve duplicate active registration rejection.
- [x] Preserve concurrent capacity safety.
- [x] Preserve ownership checks for attendee routes.

## Notification Worker: Foundation

- [x] Review notification log entity.
- [x] Review consumer payloads.
- [x] Review duplicate-message handling.
- [x] Review MailHog config.
- [x] Review disabled-by-default listener behavior.
- [x] Preserve structured-log fallback.
- [x] Preserve notification log endpoint for local proof.

## Phase 1A: Event Builder Data

- [x] Add `event_format` column to events.
- [x] Add `category` column to events.
- [x] Add `banner_image_url` column to events.
- [x] Add `venue_address` column to events.
- [x] Add `timezone` column to events.
- [x] Create `EventFormat` enum.
- [x] Set safe default for existing rows.
- [x] Update event entity fields.
- [x] Update create request DTO.
- [x] Update update request DTO.
- [x] Update summary response DTO.
- [x] Update detail response DTO.
- [x] Update mapper.
- [x] Update seed event data.
- [x] Update validation for event format.
- [x] Update validation for timezone.
- [x] Update validation for banner URL length.
- [x] Keep end-after-start validation.
- [x] Prove migration changes through service integration tests.

## Phase 1A: Event Builder API

- [x] Update organizer create event endpoint.
- [x] Update organizer update draft event endpoint.
- [x] Update organizer read event endpoint.
- [x] Update public event detail endpoint.
- [x] Keep public list concise.
- [x] Add integration test for create with new fields.
- [x] Add integration test for update with new fields.
- [x] Add integration test for public detail fields.
- [x] Add integration test for invalid event format.
- [x] Add integration test for invalid time range.
- [x] Add integration test for cancelled event not public.
- [x] Update OpenAPI event schemas.
- [x] Update event API request examples.

## Phase 1A: Event Builder UI

- [x] Update event form type definitions.
- [x] Add event format control.
- [x] Add category input.
- [x] Add banner image URL input.
- [x] Add venue address input.
- [x] Add timezone input.
- [x] Keep venue name and city fields.
- [x] Keep start and end time fields.
- [x] Keep capacity field.
- [x] Update organizer create page.
- [x] Update organizer edit page.
- [x] Update public event detail page.
- [x] Render banner image only when URL exists.
- [x] Render format and category.
- [x] Render full venue details.
- [x] Add frontend tests for form submission.
- [x] Add frontend tests for detail rendering.

## Phase 1B: Organizer Attendee List Data

- [x] Add attendee display name snapshot to registrations with attendee email fallback.
- [x] Add nullable registration type id and snapshot fields.
- [x] Add check-in status fields with safe defaults.
- [x] Add organizer id to `EventInventory`.
- [x] Add event start time to `EventInventory`.
- [x] Add event title snapshot to `EventInventory`.
- [x] Add migration for new registration columns.
- [x] Add migration for event ownership projection columns.
- [x] Backfill safe defaults.
- [x] Add repository query by event id.
- [x] Add filter by registration status.
- [x] Add filter by registration type id.
- [x] Add attendee email/display-name search.
- [x] Add stable sort by registration date.
- [x] Add stable sort by attendee email.
- [x] Add pagination if list size requires it.

## Phase 1B: Organizer Attendee List API

- [x] Add `GET /api/organizer/events/{eventId}/registrations`.
- [x] Add `GET /api/organizer/events/{eventId}/registrations/{registrationId}`.
- [x] Require organizer auth.
- [x] Verify event ownership without reading event database directly.
- [x] Use `EventInventory.organizerId` projected from event messages for ownership.
- [x] Reject requests when event inventory is missing.
- [x] Return registration id.
- [x] Return event id.
- [x] Return attendee email.
- [x] Return attendee display name snapshot.
- [x] Return registration status.
- [x] Return created time.
- [x] Return cancelled time.
- [x] Return check-in status.
- [x] Return submitted answers.
- [x] Add integration test for owner success.
- [x] Add integration test for non-owner forbidden.
- [x] Add integration test for missing registration.
- [x] Add integration test for filters.
- [x] Add OpenAPI routes.
- [x] Add HTTP request examples.

## Phase 1B: Organizer Attendee List UI

- [x] Add organizer attendee route.
- [x] Add link from organizer event list.
- [x] Add attendee table.
- [x] Add status filter.
- [x] Add search input.
- [x] Add registration detail view.
- [x] Show attendee email.
- [x] Show display-name snapshot.
- [x] Show status.
- [x] Show registered date.
- [x] Show cancelled date when present.
- [x] Show answers when present.
- [x] Add loading state.
- [x] Add empty state.
- [x] Add forbidden/error state.
- [x] Add frontend tests for table rendering.
- [x] Add frontend tests for filter calls.

## Phase 1C: Registration Questions Data

- [x] Create `registration_questions` table in event-service.
- [x] Add question id.
- [x] Add event id.
- [x] Add question text.
- [x] Add question type.
- [x] Add required flag.
- [x] Add sort order.
- [x] Add active flag.
- [x] Add timestamps.
- [x] Create `QuestionType` enum with `TEXT`, `LONG_TEXT`, `YES_NO`.
- [x] Add `RegistrationQuestion` entity.
- [x] Add repository by event id.
- [x] Add owner-scoped repository query.
- [x] Add validation for blank question text.
- [x] Add validation for supported question type.
- [x] Add validation for sort order.
- [x] Add soft delete by setting active false.

## Phase 1C: Registration Questions API

- [x] Add organizer create question route.
- [x] Add organizer list questions route.
- [x] Add organizer update question route.
- [x] Add organizer delete/deactivate question route.
- [x] Add public active questions route.
- [x] Require organizer ownership for mutations.
- [x] Return questions sorted by sort order.
- [x] Hide inactive questions from public route.
- [x] Add integration test for create.
- [x] Add integration test for update.
- [x] Add integration test for deactivate.
- [x] Add integration test for public active list.
- [x] Add integration test for non-owner forbidden.
- [x] Update OpenAPI.
- [x] Add request examples.

## Phase 1C: Registration Answers Data

- [x] Create `registration_answers` table in registration-service.
- [x] Add answer id.
- [x] Add registration id.
- [x] Add question id.
- [x] Add answer text.
- [x] Add created time.
- [x] Add repository by registration id.
- [x] Add cascade or explicit save path from registration transaction.
- [x] Store answers in same transaction as registration.
- [x] Preserve idempotent retry response with answers.
- [x] Do not make registration-service read event-service tables.

## Phase 1C: Registration Answers API

- [x] Add `answers` array to registration request.
- [x] Validate duplicate question ids in request.
- [x] Store question id and answer text.
- [x] Keep required-question validation in frontend first.
- [x] Return saved answers in attendee registration detail.
- [x] Return saved answers in organizer registration detail.
- [x] Add integration test for registering with answers.
- [x] Add integration test for idempotent retry with answers.
- [x] Add integration test for duplicate question id rejection.
- [x] Update OpenAPI.
- [x] Update HTTP request examples.

## Phase 1C: Registration Questions UI

- [x] Add organizer question management UI on event edit or a child route.
- [x] Add create question form.
- [x] Add edit question form.
- [x] Add deactivate question action.
- [x] Add sort order input.
- [x] Add required toggle.
- [x] Add question type select.
- [x] Load public questions on event detail.
- [x] Render text answer input.
- [x] Render long text answer input.
- [x] Render yes/no answer control.
- [x] Enforce required answers in frontend.
- [x] Submit answers with registration.
- [x] Show saved answers in attendee list detail.
- [x] Add frontend tests for organizer question CRUD.
- [x] Add frontend tests for attendee registration with answers.

## Phase 1D: CSV Export

- [x] Add CSV DTO for organizer registration export.
- [x] Reuse attendee-list query and ownership guard.
- [x] Include registration id.
- [x] Include event id.
- [x] Include attendee email.
- [x] Include attendee display name.
- [x] Include registration type as blank when not selected.
- [x] Include registration status.
- [x] Include check-in status.
- [x] Include registered time.
- [x] Include cancelled time.
- [x] Include checked-in time as blank when not checked in.
- [x] Include answers.
- [x] Escape commas.
- [x] Escape quotes.
- [x] Escape newlines.
- [x] Return `text/csv`.
- [x] Set `Content-Disposition` filename.
- [x] Add integration test for CSV content.
- [x] Add integration test for CSV escaping.
- [x] Add integration test for non-owner forbidden.
- [x] Update OpenAPI.
- [x] Add HTTP request example.

## Phase 1D: CSV Export UI

- [x] Add export button on attendee list page.
- [x] Call CSV endpoint with auth token.
- [x] Create browser `Blob`.
- [x] Trigger download.
- [x] Show export error state.
- [x] Add frontend test for export call.

## Phase 1 Completion Gate

- [x] Event builder backend tests pass.
- [x] Event builder frontend tests pass.
- [x] Attendee list backend tests pass.
- [x] Attendee list frontend tests pass.
- [x] Registration question backend tests pass.
- [x] Registration question frontend tests pass.
- [x] CSV export backend tests pass.
- [x] CSV export frontend tests pass.
- [x] OpenAPI reflects Phase 1 routes.
- [x] README run docs reflect Phase 1.
- [ ] Manual browser flow covers Phase 1.
- [ ] Commit Phase 1.

## Phase 2A: Code-Based Check-In Data

- [x] Add `check_in_status` to registration.
- [x] Add `checked_in_at` to registration.
- [x] Add `checked_in_by_organizer_id` to registration.
- [x] Add `ticket_code_hash` to registration.
- [x] Add `ticket_code_issued_at` to registration.
- [x] Add enum `CheckInStatus`.
- [x] Backfill `NOT_CHECKED_IN`.
- [x] Generate ticket code when registration is confirmed.
- [x] Store only hash.
- [x] Do not store raw code.
- [x] Preserve idempotent registration behavior.
- [x] Ensure cancellation blocks future check-in.

## Phase 2A: Code-Based Check-In API

- [x] Add attendee ticket route.
- [x] Issue a fresh raw ticket code on attendee ticket view.
- [x] Replace stored ticket hash when a fresh code is issued.
- [x] Return only the new raw code to the attendee response.
- [x] Add organizer check-in route.
- [x] Require organizer ownership.
- [x] Match ticket code by hash.
- [x] Reject cancelled registrations.
- [x] Return clear already-checked-in response.
- [x] Store checked-in timestamp.
- [x] Store organizer id that checked in attendee.
- [x] Add integration test for ticket retrieval.
- [x] Add integration test for valid check-in.
- [x] Add integration test for duplicate check-in.
- [x] Add integration test for cancelled registration.
- [x] Add integration test for wrong organizer.
- [x] Update OpenAPI.
- [x] Add HTTP request examples.

## Phase 2A: Code-Based Check-In UI

- [x] Add ticket view in attendee registrations.
- [x] Show text ticket code.
- [x] Add organizer check-in page.
- [x] Add ticket code input.
- [x] Add submit action.
- [x] Show success result.
- [x] Show already checked-in result.
- [x] Show invalid code result.
- [x] Show cancelled registration result.
- [x] Add frontend tests.

## Phase 2B: Basic Analytics

- [x] Add analytics query model in registration-service.
- [x] Count capacity.
- [x] Count confirmed registrations.
- [x] Count cancelled registrations.
- [x] Count available seats.
- [x] Count check-ins.
- [x] Count no-shows.
- [x] Return an empty registration-type breakdown until types exist.
- [x] Add `GET /api/organizer/events/{eventId}/analytics`.
- [x] Require organizer ownership.
- [x] Add integration test for counts.
- [x] Add integration test after check-in.
- [x] Add integration test for non-owner forbidden.
- [x] Update OpenAPI.
- [x] Add analytics UI route.
- [x] Add metric cards.
- [x] Add breakdown table.
- [x] Add frontend tests.

## Phase 2C: Notification Templates

- [x] Create `notification_templates` table.
- [x] Add template id.
- [x] Add notification type.
- [x] Add subject template.
- [x] Add body template.
- [x] Add active flag.
- [x] Add timestamps.
- [x] Seed default templates.
- [x] Add internal template renderer.
- [x] Support `{{attendeeEmail}}`.
- [x] Support `{{eventTitle}}`.
- [x] Support `{{startsAt}}`.
- [x] Support `{{venueName}}`.
- [x] Support `{{registrationTypeName}}`.
- [x] Ensure missing placeholders do not crash worker.
- [x] Render registration confirmation.
- [x] Render registration cancellation.
- [x] Render event cancellation.
- [x] Render check-in confirmation after check-in event exists.
- [x] Store rendered status in notification log.
- [x] Add tests for template rendering.
- [x] Add tests for missing placeholders.
- [x] Add tests for inactive template fallback.
- [x] Update AsyncAPI if new events are emitted.

## Phase 2 Completion Gate

- [x] Check-in tests pass.
- [x] Analytics tests pass.
- [x] Notification template tests pass.
- [x] Frontend tests pass.
- [x] OpenAPI and AsyncAPI are current.
- [ ] Manual browser flow covers check-in and analytics.
- [x] Notification log proof covers rendered templates.
- [ ] Commit Phase 2.

## Phase 3A: Registration Types Data

- [x] Create `registration_types` table in event-service.
- [x] Add type id.
- [x] Add event id.
- [x] Add name.
- [x] Add description.
- [x] Add capacity.
- [x] Add active flag.
- [x] Add sort order.
- [x] Add timestamps.
- [x] Add event-service entity and repository.
- [x] Add registration fields for type id and name snapshot.
- [x] Add `registration_type_inventory` table in registration-service.
- [x] Add type id.
- [x] Add event id.
- [x] Add capacity.
- [x] Add confirmed count.
- [x] Add active flag.
- [x] Add version.
- [x] Add event message payload fields for type inventory projection.
- [x] Include organizer id in type projection messages or reuse event inventory ownership.
- [x] Preserve total event capacity rule.
- [x] Add per-type capacity rule.

## Phase 3A: Registration Types API

- [x] Add organizer create type route.
- [x] Add organizer list type route.
- [x] Add organizer update type route.
- [x] Add organizer deactivate type route.
- [x] Add public active type route.
- [x] Add registration request `registrationTypeId`.
- [x] Store type name snapshot on registration.
- [x] Reject inactive type.
- [x] Reject sold-out type.
- [x] Keep event-level sold-out rejection.
- [x] Add concurrent same-type capacity test.
- [x] Add non-owner type mutation test.
- [x] Update OpenAPI.
- [x] Update AsyncAPI if projection events change.

## Phase 3A: Registration Types UI

- [x] Add organizer registration-type management.
- [x] Add type name input.
- [x] Add description input.
- [x] Add capacity input.
- [x] Add active/deactivate action.
- [x] Add sort order input.
- [x] Add attendee type selection on event detail.
- [x] Show type on attendee registrations.
- [x] Show type on attendee list.
- [x] Add frontend tests.

## Phase 3B: Sessions And Speakers Data

- [x] Create `speakers` table.
- [x] Add speaker id.
- [x] Add event id.
- [x] Add name.
- [x] Add title.
- [x] Add organization.
- [x] Add bio.
- [x] Add photo URL.
- [x] Add timestamps.
- [x] Create `sessions` table.
- [x] Add session id.
- [x] Add event id.
- [x] Add title.
- [x] Add description.
- [x] Add starts at.
- [x] Add ends at.
- [x] Add room name.
- [x] Add capacity.
- [x] Add status.
- [x] Add timestamps.
- [x] Create `session_speakers` join table.
- [x] Add session status enum.
- [x] Validate session time range.
- [x] Validate session inside event time range.
- [x] Validate speaker belongs to event.

## Phase 3B: Sessions And Speakers API

- [x] Add organizer speaker create route.
- [x] Add organizer speaker list route.
- [x] Add organizer speaker update route.
- [x] Add organizer speaker delete route.
- [x] Add organizer session create route.
- [x] Add organizer session list route.
- [x] Add organizer session update route.
- [x] Add organizer session delete route.
- [x] Add public speaker list route.
- [x] Add public session list route.
- [x] Public route returns published sessions only.
- [x] Add tests for session validation.
- [x] Add tests for speaker ownership.
- [x] Add tests for public published-only visibility.
- [x] Update OpenAPI.

## Phase 3B: Sessions And Speakers UI

- [x] Add organizer speakers page.
- [x] Add organizer sessions page.
- [x] Add speaker create/edit form.
- [x] Add session create/edit form.
- [x] Add speaker assignment controls.
- [x] Show agenda on public event detail.
- [x] Sort agenda by start time.
- [x] Show speaker names under sessions.
- [x] Show room name.
- [x] Add frontend tests.

## Phase 3C: Post-Event Survey Data

- [x] Create `surveys` table in event-service.
- [x] Add survey id.
- [x] Add event id.
- [x] Add title.
- [x] Add status.
- [x] Add timestamps.
- [x] Create `survey_questions` table in event-service.
- [x] Add question id.
- [x] Add survey id.
- [x] Add question text.
- [x] Add question type.
- [x] Add required flag.
- [x] Add sort order.
- [x] Create `survey_responses` table in registration-service.
- [x] Add response id.
- [x] Add survey id.
- [x] Add event id.
- [x] Add attendee id.
- [x] Add submitted time.
- [x] Create `survey_answers` table in registration-service.
- [x] Add answer id.
- [x] Add response id.
- [x] Add question id.
- [x] Add answer text.
- [x] Add rating value.
- [x] Add unique constraint for one response per attendee per survey.

## Phase 3C: Post-Event Survey API

- [x] Add organizer create survey route.
- [x] Add organizer list surveys route.
- [x] Add organizer survey response route.
- [x] Add attendee active survey route.
- [x] Add attendee survey submission route.
- [x] Verify attendee has confirmed registration before submit.
- [x] Reject duplicate response.
- [x] Validate required answers at least at frontend first.
- [x] Add integration test for survey create.
- [x] Add integration test for confirmed attendee submit.
- [x] Add integration test for non-registered attendee forbidden.
- [x] Add integration test for duplicate submit.
- [x] Update OpenAPI.

## Phase 3C: Post-Event Survey UI

- [x] Add organizer survey management.
- [x] Add survey question form.
- [x] Add attendee survey page or section.
- [x] Show active survey after registration/event.
- [x] Submit survey answers.
- [x] Add organizer response view.
- [x] Add frontend tests.

## Phase 3 Completion Gate

- [x] Registration type tests pass.
- [x] Session and speaker tests pass.
- [x] Survey tests pass.
- [x] Frontend tests pass.
- [x] Contracts are current.
- [ ] Manual browser flow covers all Phase 3 features.
- [ ] Commit Phase 3.

## Full Compose Platform

- [x] Add or verify Dockerfile for identity-service.
- [x] Add or verify Dockerfile for gateway-service.
- [x] Add or verify Dockerfile for event-service.
- [x] Add or verify Dockerfile for registration-service.
- [x] Add or verify Dockerfile for notification-worker.
- [x] Add Dockerfile for web-client.
- [x] Extend Compose with all app services.
- [x] Use service DNS names inside containers.
- [x] Wire identity-service to identity database.
- [x] Wire event-service to event database.
- [x] Wire registration-service to registration database.
- [x] Wire notification-worker to notification database.
- [x] Wire services to RabbitMQ.
- [x] Wire notification-worker to MailHog.
- [x] Wire gateway to downstream service DNS names.
- [x] Wire web-client to gateway.
- [x] Add healthchecks.
- [x] Add startup dependency ordering where useful.
- [x] Add safe local secrets.
- [x] Prove `docker compose up --build`.
- [x] Prove organizer publish flow.
- [x] Prove attendee registration flow.
- [x] Prove attendee answer submission.
- [x] Prove attendee CSV export.
- [x] Prove check-in.
- [x] Prove notification log.

## Local Kubernetes

- [x] Create base namespace manifest.
- [x] Create ConfigMaps.
- [x] Create Secret templates with dummy local values.
- [x] Create Postgres manifest or chart path.
- [x] Create RabbitMQ manifest or chart path.
- [x] Create MailHog manifest.
- [x] Create identity-service Deployment.
- [x] Create event-service Deployment.
- [x] Create registration-service Deployment.
- [x] Create gateway-service Deployment.
- [x] Create notification-worker Deployment.
- [x] Create web-client Deployment.
- [x] Create Services for every workload.
- [x] Add readiness probes.
- [x] Add liveness probes.
- [x] Add resource requests.
- [x] Add resource limits.
- [x] Add local overlay under `deploy/k8s/overlays/local`.
- [x] Add kustomization files.
- [ ] Apply manifests locally.
- [ ] Prove pods become ready.
- [ ] Prove one full registration flow.
- [x] Render local Kubernetes manifests with dockerized `kubectl kustomize`.
- [x] Document local cluster commands.

## CI

- [x] Add GitHub Actions workflow.
- [x] Add Java setup for Java 21.
- [x] Cache Maven dependencies.
- [x] Run identity-service tests.
- [x] Run event-service tests.
- [x] Run registration-service tests.
- [x] Run gateway-service tests.
- [x] Run notification-worker tests.
- [x] Add Node setup.
- [x] Cache npm dependencies.
- [x] Run frontend tests.
- [x] Run frontend build.
- [x] Build backend Docker images.
- [x] Build frontend Docker image.
- [x] Validate Kubernetes manifests.
- [x] Run `git diff --check`.
- [ ] Upload test reports when the workflow already creates them.
- [ ] Confirm failing tests fail CI.
- [ ] Add branch protection after CI is stable.

## Security And Data Quality

- [x] Ensure secrets are not committed.
- [x] Keep `.env` ignored.
- [x] Validate JWT issuer consistently.
- [x] Validate JWT secret length.
- [x] Use owner checks on every organizer mutation.
- [x] Use attendee checks on every attendee mutation.
- [x] Avoid leaking attendee data through public routes.
- [x] Avoid storing raw ticket codes.
- [x] Escape CSV fields.
- [x] Keep HTML rendering out of notification templates unless sanitized.
- [x] Return consistent error bodies.
- [x] Log enough for local debugging without logging secrets.

## Documentation

- [x] Update README setup instructions.
- [x] Update README feature list.
- [x] Update README manual proof flow.
- [x] Update `ProjectSummary.md`.
- [x] Update `Progress.md`.
- [x] Update `BuildFlow.md`.
- [x] Update `RepoStructure.md`.
- [x] Update `progress_manual_tasks.md`.
- [x] Update request examples.
- [x] Update OpenAPI.
- [x] Update AsyncAPI.
- [x] Keep docs concise.

## Final Product Proof

- [ ] Fresh clone setup works.
- [x] `docker compose up --build` works.
- [x] Organizer can complete event builder.
- [x] Organizer can publish event.
- [x] Organizer can add registration questions.
- [x] Organizer can add registration types.
- [x] Organizer can add sessions and speakers.
- [x] Attendee can register with type and answers.
- [x] Duplicate registration is rejected.
- [x] Sold-out event is rejected.
- [x] Sold-out registration type is rejected.
- [x] Organizer can view attendee list.
- [x] Organizer can export CSV.
- [x] Attendee can view ticket code.
- [x] Organizer can check attendee in.
- [x] Analytics update after registration and check-in.
- [x] Notification templates render.
- [ ] MailHog receives local email when enabled.
- [x] Attendee can submit survey.
- [x] Organizer can view survey responses.
- [ ] RabbitMQ DLQs stay empty on happy path.
- [x] Backend tests pass.
- [x] Frontend tests pass.
- [x] Frontend build passes.
- [ ] CI passes.
- [ ] Local Kubernetes proof passes.
- [ ] Release tag is created.
