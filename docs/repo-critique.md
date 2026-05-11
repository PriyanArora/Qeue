# Phase 1 Repo Critique

This critique is based on the repository as inspected during Phase 1. It intentionally separates current baseline issues from future EventForge work so later phases do not get implemented early.

## Critical

1. Maven wrapper executable bits were missing at audit start.
   - Evidence: `event-service/mvnw` and `registration-service/mvnw` were regular non-executable files.
   - Impact: The planned `./mvnw test` proof command fails on Unix-like systems unless the user calls `sh ./mvnw`.
   - Phase 1 action: restore executable bits before verification.

2. Dockerfiles depend on exact jar names and fragile artifact paths.
   - Evidence: both Dockerfiles copy `event-service-0.0.1-SNAPSHOT.jar` or `registration-service-0.0.1-SNAPSHOT.jar` directly from the build stage.
   - Impact: a version, artifactId, packaging, or Maven output change can break image builds without a clear source-code failure.
   - Phase recommendation: keep these Dockerfiles as baseline references now; harden or replace them when Docker is reintroduced in the planned infrastructure phases.

## High

1. The create-event HTTP sample conflicts with seeded data when seed SQL is active.
   - Evidence: `api-requests/event-service/create-event.http` posts `Springfield Java Meetup`, and `event-service/src/main/resources/data.sql` seeds the same title with a unique constraint.
   - Impact: a first manual create request can demonstrate duplicate-title failure instead of successful creation.
   - Phase recommendation: update samples when event lifecycle behavior is redesigned.

2. Missing-event delete behavior is not handled clearly.
   - Evidence: `EventService.deleteEvent` calls `eventRepository.deleteById(id)` without first checking existence or mapping repository exceptions.
   - Impact: deleting a missing event can return an unclear framework error instead of a stable API error.
   - Phase recommendation: handle this in the event-service hardening or lifecycle phase.

3. Malformed date strings are not mapped to a clean client error.
   - Evidence: `EventMapper.toModel` and `EventService.updateEvent` call `LocalDate.parse(...)` directly.
   - Impact: bad date input can leak as an internal server error rather than a clear `400 Bad Request`.
   - Phase recommendation: validate date shape at the boundary or map parse failures in the global exception handler.

4. Event-not-found currently returns `400 Bad Request`.
   - Evidence: `GlobalExceptionHandler.handleEventNotFoundException` returns `ResponseEntity.badRequest()`.
   - Impact: API clients cannot distinguish malformed input from a missing resource.
   - Phase recommendation: return `404 Not Found` when event API behavior is hardened.

## Medium

1. Root IntelliJ metadata still references old module names.
   - Evidence: `.idea/compiler.xml`, `.idea/modules.xml`, `.idea/encodings.xml`, and `.idea/sqldialects.xml` reference `patient-service`, `billing-service`, or `patient-management.iml`.
   - Impact: IntelliJ project import may be confusing even though command-line Maven builds are the source of truth.
   - Phase recommendation: clean IDE metadata separately or stop tracking local IDE project files.

2. Event service configuration still contains commented sample credentials.
   - Evidence: `event-service/src/main/resources/application.properties` contains commented H2 username and password examples.
   - Impact: they are inactive, but they teach a pattern that conflicts with the project's no-hardcoded-secrets rule.
   - Phase recommendation: replace with environment-driven configuration in the event-service hardening phase.

3. Registration service starts without a Jakarta Validation provider.
   - Evidence: the registration-service test logs report no Bean Validation provider.
   - Impact: there is no current validated request model in the gRPC stub, so this is not breaking today, but it should be addressed before adding request validation.
   - Phase recommendation: add validation only when the service moves from stub to real web/API behavior.

4. Registration gRPC response is hardcoded.
   - Evidence: `RegistrationGrpcService` always returns registration id `12345` and status `CONFIRMED`.
   - Impact: useful for a stub, but not meaningful registration behavior.
   - Phase recommendation: replace during the registration storage and capacity phases.

## Low

1. `EventService.eventRepository` can be `final`.
   - Evidence: the repository is constructor-injected but the field is mutable.
   - Impact: no current behavior issue, but immutability would better communicate intent.

2. Event create returns `200 OK` instead of `201 Created`.
   - Evidence: `EventController.createEvent` returns `ResponseEntity.ok(...)`.
   - Impact: acceptable for a learning baseline, but less precise REST semantics.

3. OpenAPI annotations describe current CRUD routes only.
   - Evidence: `EventController` has basic `@Operation` annotations for current `/events` endpoints.
   - Impact: they do not represent the future gateway `/api/...` routes and should not be mistaken for final contracts.

## Environment Verification

- Java 21 is present in this environment: `openjdk version "21.0.10"` and `javac 21.0.10`.
- The planned missing-Java blocker from `Progress.md` is not currently observed.
- Docker is installed, but Docker Compose platform work is intentionally deferred to Phase 3.
- Node is installed locally, but frontend work is intentionally deferred to Phase 13.
