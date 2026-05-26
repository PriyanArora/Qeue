# Qeue Explanation

Qeue is a Java/Spring microservice event platform with a React UI.

Current flow:

1. Organizer creates and publishes an event.
2. Organizer configures questions, registration types, sessions, speakers, and surveys.
3. Attendee reserves one seat with a registration type and answers.
4. Registration service prevents duplicate reservations and overbooking.
5. Attendee can view a ticket code and submit survey feedback.
6. Organizer can view attendees, export CSV, check attendees in, and view analytics.
7. Outbox messages flow through RabbitMQ.
8. Notification worker renders templates and records delivery logs.

Main rule: services own their data and browser requests go through the gateway.

Organizer reporting uses registration-service projections instead of reading event-service tables.

Use `codex-folder/codex/ProjectSummary.md`, `Progress.md`, `BuildFlow.md`, and `RepoStructure.md` for current status.
