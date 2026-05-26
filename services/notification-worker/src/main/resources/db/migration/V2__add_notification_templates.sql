ALTER TABLE notification_log ADD COLUMN rendered_subject VARCHAR(240);
ALTER TABLE notification_log ADD COLUMN rendered_body TEXT;

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY,
    notification_type VARCHAR(60) NOT NULL,
    subject_template VARCHAR(240) NOT NULL,
    body_template TEXT NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_notification_templates_type_active
    ON notification_templates(notification_type, active);

INSERT INTO notification_templates (
    id,
    notification_type,
    subject_template,
    body_template,
    active,
    created_at,
    updated_at
) VALUES
(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'REGISTRATION_CONFIRMED',
    'Registration confirmed: {{eventTitle}}',
    'Your registration for {{eventTitle}} is confirmed. Start: {{startsAt}}. Venue: {{venueName}}. Type: {{registrationTypeName}}.',
    TRUE,
    '2026-05-01T00:00:00Z',
    '2026-05-01T00:00:00Z'
),
(
    'aaaaaaaa-0000-0000-0000-000000000002',
    'REGISTRATION_CANCELLED',
    'Registration cancelled: {{eventTitle}}',
    'Your registration for {{eventTitle}} was cancelled.',
    TRUE,
    '2026-05-01T00:00:00Z',
    '2026-05-01T00:00:00Z'
),
(
    'aaaaaaaa-0000-0000-0000-000000000003',
    'CHECK_IN_CONFIRMATION',
    'Checked in: {{eventTitle}}',
    'You are checked in for {{eventTitle}}.',
    TRUE,
    '2026-05-01T00:00:00Z',
    '2026-05-01T00:00:00Z'
);
