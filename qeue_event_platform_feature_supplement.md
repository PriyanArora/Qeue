# Qeue Cvent-Inspired Feature Supplement

This is a narrowed feature backlog for Qeue based mainly on what Cvent does.

Do not merge every feature from every event platform. This file intentionally avoids becoming a huge Eventbrite + Whova + Hopin + Ticket Tailor clone. The goal is to supplement the current Qeue project with a focused set of Cvent-style features that make sense for the existing Java/Spring microservice architecture.

Current Qeue baseline:

- Organizers can create draft events.
- Organizers can publish or cancel events.
- Attendees can view published events.
- Attendees can reserve/cancel registrations.
- Confirmed registrations must never exceed event capacity.
- Services are split into identity, gateway, event, registration, and notification components.
- RabbitMQ/outbox is already part of the architecture.
- UI should remain basic for now.

---

## What Cvent Mainly Does

Cvent is not just a ticketing app. It is an event marketing and management platform for in-person, virtual, and hybrid events. The most relevant Cvent-style areas for Qeue are:

1. Event setup and event lifecycle management.
2. Registration websites and registration workflows.
3. Agenda/session management.
4. Email/event marketing.
5. Onsite check-in and badging.
6. Attendee engagement.
7. Surveys and post-event feedback.
8. Event and attendee insights/analytics.
9. Integrations/export.
10. Optional later: virtual/hybrid event experience.

For Qeue, only implement the practical subset below.

---

# Recommended Scope For This Project

## Keep

These are realistic and useful for the current Qeue architecture:

1. Better event setup page.
2. Event registration form customization.
3. Ticket/registration types.
4. Agenda and sessions.
5. Organizer attendee list.
6. Check-in with QR/manual code.
7. Basic email notifications/templates.
8. Basic event analytics.
9. Post-event survey.
10. CSV export/integration-style export.

## Skip For Now

These are too large or too enterprise-level for now:

1. Venue sourcing.
2. Vendor sourcing.
3. Budget approval workflows.
4. Full mobile event app.
5. Native badge printer integration.
6. Lead retrieval hardware.
7. Trade show meeting scheduler.
8. AI content repurposing.
9. Full virtual event streaming platform.
10. CRM integrations like Salesforce/HubSpot.
11. Real payment processing.
12. Advanced multi-tenant enterprise permissions.

---

# Cvent-Inspired Feature Backlog

## Feature 1: Better Event Setup / Event Builder

### Why

Cvent gives organizers a structured way to build and manage an event instead of just entering a title, description, venue, date, and capacity.

### Goal

Make Qeue's organizer event form feel more like a real event setup workflow.

### Add to Event model

```text
Event
- id
- organizerId
- title
- description
- eventFormat
- category
- bannerImageUrl
- venueName
- venueCity
- venueAddress
- timezone
- startsAt
- endsAt
- capacity
- status
- createdAt
- updatedAt
```

Suggested enum:

```text
eventFormat: IN_PERSON, ONLINE, HYBRID
```

### Organizer UI

Update:

```text
/organizer/events/new
/organizer/events/:eventId/edit
```

Add basic fields:

- Event title.
- Description.
- Event format.
- Category.
- Banner image URL.
- Venue name.
- Venue city.
- Venue address.
- Timezone.
- Start time.
- End time.
- Capacity.

### Public UI

Update:

```text
/events/:eventId
```

Show:

- Banner image if available.
- Event title.
- Description.
- Date/time.
- Venue.
- Format.
- Category.
- Remaining capacity if available.

### Backend

Service:

```text
event-service
```

Update event creation/update DTOs.

Add Flyway migration for new columns.

### Acceptance Criteria

- Organizer can create/edit these fields.
- Public event page shows the fields after publish.
- Draft/cancelled events are still hidden from public listing.
- Invalid end time before start time is rejected.
- Tests cover create/update validation.

---

## Feature 2: Registration Form Questions

### Why

Cvent registration pages collect attendee information beyond just "reserve a seat." Examples: company name, job title, dietary restrictions, accessibility needs, and custom questions.

### Goal

Allow organizers to define simple registration questions for an event.

### Data model

Service:

```text
event-service
```

```text
RegistrationQuestion
- id
- eventId
- questionText
- questionType
- required
- sortOrder
- active
- createdAt
- updatedAt
```

Suggested question types:

```text
TEXT
LONG_TEXT
YES_NO
```

Service:

```text
registration-service
```

```text
RegistrationAnswer
- id
- registrationId
- questionId
- answerText
```

### APIs

Organizer:

```http
POST /api/organizer/events/{eventId}/registration-questions
GET /api/organizer/events/{eventId}/registration-questions
PUT /api/organizer/events/{eventId}/registration-questions/{questionId}
DELETE /api/organizer/events/{eventId}/registration-questions/{questionId}
```

Public:

```http
GET /api/events/{eventId}/registration-questions
```

Attendee registration request:

```json
{
  "idempotencyKey": "client-generated-key",
  "answers": [
    {
      "questionId": "uuid",
      "answerText": "Vegetarian"
    }
  ]
}
```

### Important architecture note

`event-service` owns the question definitions.

`registration-service` owns the submitted answers.

Do not make `registration-service` read the event-service database directly. Use one of these:

1. Include active registration questions in the public event detail response and submit answers by question ID.
2. Add an event-question projection inside registration-service through RabbitMQ later.
3. For first implementation, validate only required presence at gateway/frontend level and store answers by question ID.

Recommended first implementation:

- Keep backend validation simple.
- Store answers.
- Add stronger cross-service validation later.

### Frontend

On event detail page:

- Show questions before attendee clicks reserve/register.
- Required questions should be marked.
- Submit answers with registration.

On organizer attendee list:

- Show registration answers in registration detail or CSV export.

### Acceptance Criteria

- Organizer can define active questions.
- Attendee sees active questions during registration.
- Registration saves submitted answers.
- Required questions are enforced at least in the frontend first.
- CSV export includes answers.

---

## Feature 3: Ticket / Registration Types

### Why

Cvent supports different registration paths/packages. Qeue currently has one simple seat reservation flow.

### Goal

Add simple registration types, not full paid ticketing.

### Data model

Service:

```text
event-service
```

```text
RegistrationType
- id
- eventId
- name
- description
- capacity
- active
- sortOrder
- createdAt
- updatedAt
```

Examples:

```text
General Attendee
Student
Speaker
VIP
Volunteer
```

Service:

```text
registration-service
```

Update:

```text
Registration
- registrationTypeId
- registrationTypeNameSnapshot
```

Optional projection:

```text
RegistrationTypeInventory
- registrationTypeId
- eventId
- capacity
- confirmedCount
- active
- version
```

### APIs

Organizer:

```http
POST /api/organizer/events/{eventId}/registration-types
GET /api/organizer/events/{eventId}/registration-types
PUT /api/organizer/events/{eventId}/registration-types/{typeId}
DELETE /api/organizer/events/{eventId}/registration-types/{typeId}
```

Public:

```http
GET /api/events/{eventId}/registration-types
```

Attendee registration:

```json
{
  "registrationTypeId": "uuid",
  "idempotencyKey": "client-generated-key",
  "answers": []
}
```

### Keep it simple

Do not add payments yet.

Use price-free registration types first.

### Acceptance Criteria

- Organizer can create registration types.
- Attendee chooses one registration type.
- Total confirmed registrations cannot exceed event capacity.
- A registration type cannot exceed its own capacity.
- Tests cover concurrent registration for the same type.

---

## Feature 4: Agenda, Sessions, and Speakers

### Why

Cvent events often include agendas, sessions, and speakers. This is one of the most useful Cvent-style additions for a student project.

### Goal

Allow organizers to add sessions and speakers to an event.

### Data model

Service:

```text
event-service
```

```text
Speaker
- id
- eventId
- name
- title
- organization
- bio
- photoUrl
- createdAt
- updatedAt
```

```text
Session
- id
- eventId
- title
- description
- startsAt
- endsAt
- roomName
- capacity
- status
- createdAt
- updatedAt
```

```text
SessionSpeaker
- sessionId
- speakerId
```

Suggested session status:

```text
DRAFT
PUBLISHED
CANCELLED
```

### APIs

Organizer:

```http
POST /api/organizer/events/{eventId}/speakers
GET /api/organizer/events/{eventId}/speakers
PUT /api/organizer/events/{eventId}/speakers/{speakerId}
DELETE /api/organizer/events/{eventId}/speakers/{speakerId}

POST /api/organizer/events/{eventId}/sessions
GET /api/organizer/events/{eventId}/sessions
PUT /api/organizer/events/{eventId}/sessions/{sessionId}
DELETE /api/organizer/events/{eventId}/sessions/{sessionId}
```

Public:

```http
GET /api/events/{eventId}/speakers
GET /api/events/{eventId}/sessions
```

### Frontend

Organizer:

```text
/organizer/events/:eventId/speakers
/organizer/events/:eventId/sessions
```

Public event page:

- Show agenda sorted by start time.
- Show speaker names under sessions.
- Show room name if present.

### Acceptance Criteria

- Organizer can create sessions inside event date/time.
- Session cannot end before it starts.
- Session cannot be outside event time range.
- Public page shows published sessions only.
- Tests cover validation.

---

## Feature 5: Organizer Attendee List

### Why

Cvent gives planners attendee/registration visibility. Qeue needs a real organizer guest list.

### Goal

Allow organizer to view attendees for an event.

### Backend

Service:

```text
registration-service
```

APIs:

```http
GET /api/organizer/events/{eventId}/registrations
GET /api/organizer/events/{eventId}/registrations/{registrationId}
```

Query filters:

```http
?status=&registrationTypeId=&query=&sort=
```

Return:

```text
registrationId
eventId
attendeeEmail
attendeeDisplayNameSnapshot
registrationTypeNameSnapshot
status
createdAt
cancelledAt
checkInStatus
checkedInAt
answers
```

### Frontend

Add:

```text
/organizer/events/:eventId/attendees
```

Basic table:

- Attendee email.
- Registration type.
- Status.
- Registered at.
- Check-in status.
- Button to view details.

### Acceptance Criteria

- Organizer can only see registrations for events they own.
- Attendee answers are visible to the organizer.
- Filters work.
- Tests cover authorization.

---

## Feature 6: QR / Code-Based Check-In

### Why

Cvent has onsite check-in and badging. For Qeue, implement a simple check-in system, not real badge printers.

### Goal

Each confirmed registration gets a check-in code. Organizer can mark attendee as checked in.

### Data model

Service:

```text
registration-service
```

Extend:

```text
Registration
- checkInStatus
- checkedInAt
- checkedInByOrganizerId
- ticketCodeHash
- ticketCodeIssuedAt
```

Suggested status:

```text
NOT_CHECKED_IN
CHECKED_IN
```

### APIs

Attendee:

```http
GET /api/me/registrations/{registrationId}/ticket
```

Organizer:

```http
POST /api/organizer/events/{eventId}/check-in
```

Request:

```json
{
  "ticketCode": "plain-code-from-attendee"
}
```

Response:

```json
{
  "status": "CHECKED_IN",
  "registrationId": "uuid",
  "attendeeEmail": "attendee@example.com",
  "checkedInAt": "2026-01-01T10:00:00Z"
}
```

### Security

- Store only hash of ticket code.
- Do not store raw ticket code.
- Cancelled registrations cannot be checked in.
- Already checked-in registrations should return a clear response.

### Frontend

Attendee:

- In `/me/registrations`, add "View ticket."
- Show text code for now.
- QR image can be added later.

Organizer:

- Add `/organizer/events/:eventId/check-in`.
- Text input for ticket code.
- Submit button.
- Result message.

### Acceptance Criteria

- Confirmed attendee can view ticket code.
- Organizer can check in valid code.
- Same code cannot check in twice.
- Cancelled registration cannot be checked in.
- Unauthorized organizer cannot check in another organizer's event attendee.
- Tests cover all cases.

---

## Feature 7: Notification Templates

### Why

Cvent supports event communications. Qeue already has notification-worker, so this is a natural extension.

### Goal

Send structured notifications for key event actions.

### Notification types

```text
REGISTRATION_CONFIRMED
REGISTRATION_CANCELLED
EVENT_CANCELLED
EVENT_REMINDER
CHECK_IN_CONFIRMATION
SURVEY_REQUEST
```

### Data model

Service:

```text
notification-worker
```

```text
NotificationTemplate
- id
- type
- subjectTemplate
- bodyTemplate
- active
- createdAt
- updatedAt
```

Supported placeholders:

```text
{{attendeeEmail}}
{{eventTitle}}
{{startsAt}}
{{venueName}}
{{registrationTypeName}}
```

### Queue events

Use existing events first:

```text
registration.confirmed.v1
registration.cancelled.v1
event.cancelled.v1
```

Optional later:

```text
event.reminder.requested.v1
checkin.completed.v1
survey.requested.v1
```

### Frontend

No polished email editor needed.

Optional simple admin/dev page:

```text
/organizer/events/:eventId/notifications
```

For now, hardcoded default templates are enough.

### Acceptance Criteria

- Notification worker renders template body.
- MailHog receives email if enabled.
- NotificationLog stores rendered status.
- Missing placeholder does not crash worker.
- Tests cover template rendering.

---

## Feature 8: Basic Event Analytics

### Why

Cvent gives event and attendee insights. Qeue should add basic organizer analytics.

### Goal

Add simple dashboard numbers, not complex charts.

### Metrics

Per event:

```text
capacity
confirmedRegistrations
cancelledRegistrations
availableSeats
checkIns
noShows
registrationTypeBreakdown
```

Organizer-wide later:

```text
publishedEvents
upcomingEvents
totalRegistrations
totalCheckIns
```

### Backend

Service:

```text
registration-service
```

API:

```http
GET /api/organizer/events/{eventId}/analytics
```

Return:

```json
{
  "capacity": 100,
  "confirmedRegistrations": 80,
  "cancelledRegistrations": 4,
  "availableSeats": 20,
  "checkIns": 55,
  "noShows": 25,
  "registrationTypeBreakdown": [
    {
      "registrationTypeName": "Student",
      "confirmedCount": 30
    }
  ]
}
```

### Frontend

Add:

```text
/organizer/events/:eventId/analytics
```

Basic UI:

- Metric cards.
- Simple table for registration type breakdown.
- No chart library required.

### Acceptance Criteria

- Counts are correct.
- Organizer only sees analytics for owned events.
- Cancelled registrations are counted separately.
- Check-in count updates after check-in.
- Tests cover analytics calculation.

---

## Feature 9: Post-Event Survey

### Why

Cvent includes surveys and post-event feedback.

### Goal

Allow organizer to create a simple survey and attendees to submit feedback after event.

### Data model

Service:

```text
event-service
```

```text
Survey
- id
- eventId
- title
- status
- createdAt
- updatedAt
```

```text
SurveyQuestion
- id
- surveyId
- questionText
- questionType
- required
- sortOrder
```

Service:

```text
registration-service
```

Or create later:

```text
feedback-service
```

For now, use registration-service because it can verify attendee registration.

```text
SurveyResponse
- id
- surveyId
- eventId
- attendeeId
- submittedAt
```

```text
SurveyAnswer
- id
- responseId
- questionId
- answerText
- ratingValue
```

Question types:

```text
TEXT
RATING_1_TO_5
YES_NO
```

### APIs

Organizer:

```http
POST /api/organizer/events/{eventId}/surveys
GET /api/organizer/events/{eventId}/surveys
GET /api/organizer/events/{eventId}/surveys/{surveyId}/responses
```

Attendee:

```http
GET /api/events/{eventId}/surveys/active
POST /api/events/{eventId}/surveys/{surveyId}/responses
```

### Acceptance Criteria

- Organizer can create a survey.
- Only confirmed attendees can submit survey.
- One attendee can submit only once per survey.
- Organizer can view responses.
- Tests cover duplicate prevention and unauthorized users.

---

## Feature 10: CSV Export

### Why

Cvent-style platforms often connect event data with business systems. For Qeue, CSV export is the simplest useful integration.

### Goal

Allow organizers to export event registrations.

### Backend

Service:

```text
registration-service
```

API:

```http
GET /api/organizer/events/{eventId}/registrations/export.csv
```

CSV columns:

```text
registrationId
eventId
attendeeEmail
attendeeDisplayName
registrationType
status
checkInStatus
registeredAt
cancelledAt
checkedInAt
answers
```

### Frontend

Add button to attendee list page:

```text
Export CSV
```

### Acceptance Criteria

- Organizer can export owned event registrations.
- Unauthorized organizer cannot export another organizer's event.
- CSV includes registration answers.
- Tests cover CSV content and auth.

---

# Recommended Build Order

Do not build everything at once.

Build in this order:

## Phase 1: Strong Event + Registration Admin

1. Better event setup/event builder.
2. Organizer attendee list.
3. Registration form questions.
4. CSV export.

## Phase 2: Cvent-Style Onsite Basics

5. QR/code-based check-in.
6. Basic event analytics.
7. Notification templates.

## Phase 3: Conference/Event Depth

8. Registration types.
9. Agenda/sessions/speakers.
10. Post-event survey.

This order keeps the project realistic and avoids making Qeue too huge.

---

# Codex Prompt

Use this prompt with Codex:

```text
You are working in my existing Qeue event management Java/Spring microservice project.

Do not rebuild the app. Preserve the current service boundaries:
- identity-service owns users/auth/JWT.
- event-service owns event setup and event lifecycle.
- registration-service owns registrations, capacity correctness, check-in, and registration data.
- notification-worker owns notification logs and email rendering.
- gateway-service routes browser API traffic.
- web-client is React + Vite + TypeScript.

The UI should stay basic. Focus on backend correctness, APIs, database migrations, service boundaries, and tests.

I want Qeue to become Cvent-inspired, not a clone of every event platform. Implement only the features in `qeue_cvent_inspired_feature_supplement.md`.

Start with Phase 1 only:
1. Better event setup/event builder.
2. Organizer attendee list.
3. Registration form questions.
4. CSV export.

For each feature:
- Add Flyway migrations.
- Add DTOs/controllers/services/repositories using existing code style.
- Add or update gateway routes if browser-facing.
- Add backend tests for success and failure paths.
- Add basic React pages/forms/tables.
- Update OpenAPI contracts.
- Do not let one service directly read another service's database.
- Keep existing tests passing.
```

---

# Do Not Add Yet

Unless explicitly asked later, do not add:

- Real payments.
- Venue sourcing.
- Vendor sourcing.
- Full mobile app.
- Native badge printing.
- Lead retrieval.
- AI content repurposing.
- Real streaming/virtual venue.
- Complex dashboards.
- Seating charts.
- Salesforce/HubSpot integrations.
- Enterprise budget approvals.
