ALTER TABLE event_inventory ADD COLUMN organizer_id UUID;
ALTER TABLE event_inventory ADD COLUMN venue_name VARCHAR(160);
ALTER TABLE event_inventory ADD COLUMN timezone VARCHAR(80);

UPDATE event_inventory
SET organizer_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    venue_name = title,
    timezone = 'UTC'
WHERE event_id IN (
    '11111111-1111-1111-1111-111111111001',
    '11111111-1111-1111-1111-111111111002',
    '11111111-1111-1111-1111-111111111005'
);

UPDATE event_inventory
SET organizer_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    venue_name = title,
    timezone = 'UTC'
WHERE event_id = '11111111-1111-1111-1111-111111111004';

ALTER TABLE registrations ADD COLUMN attendee_display_name_snapshot VARCHAR(160);
ALTER TABLE registrations ADD COLUMN registration_type_id UUID;
ALTER TABLE registrations ADD COLUMN registration_type_name_snapshot VARCHAR(120);
ALTER TABLE registrations ADD COLUMN check_in_status VARCHAR(30);
ALTER TABLE registrations ADD COLUMN checked_in_at TIMESTAMP;
ALTER TABLE registrations ADD COLUMN checked_in_by_organizer_id UUID;
ALTER TABLE registrations ADD COLUMN ticket_code_hash VARCHAR(128);
ALTER TABLE registrations ADD COLUMN ticket_code_issued_at TIMESTAMP;

UPDATE registrations
SET attendee_display_name_snapshot = attendee_email,
    check_in_status = 'NOT_CHECKED_IN'
WHERE attendee_display_name_snapshot IS NULL;

ALTER TABLE registrations ALTER COLUMN attendee_display_name_snapshot SET NOT NULL;
ALTER TABLE registrations ALTER COLUMN check_in_status SET NOT NULL;

CREATE TABLE registration_answers (
    id UUID PRIMARY KEY,
    registration_id UUID NOT NULL,
    question_id UUID NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_registration_answers_registration
        FOREIGN KEY (registration_id) REFERENCES registrations(id),
    CONSTRAINT uk_registration_answer_question
        UNIQUE (registration_id, question_id)
);

CREATE INDEX idx_registration_answers_registration
    ON registration_answers(registration_id);

CREATE TABLE registration_type_inventory (
    registration_type_id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    capacity INTEGER NOT NULL,
    confirmed_count INTEGER NOT NULL,
    active BOOLEAN NOT NULL,
    version BIGINT NOT NULL,
    CONSTRAINT fk_registration_type_inventory_event
        FOREIGN KEY (event_id) REFERENCES event_inventory(event_id)
);

CREATE INDEX idx_registration_type_inventory_event
    ON registration_type_inventory(event_id);

CREATE TABLE survey_submissions (
    id UUID PRIMARY KEY,
    survey_id UUID NOT NULL,
    event_id UUID NOT NULL,
    attendee_id UUID NOT NULL,
    submitted_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_survey_submission_attendee
        UNIQUE (survey_id, attendee_id)
);

CREATE INDEX idx_survey_submissions_event
    ON survey_submissions(event_id);

CREATE TABLE survey_answers (
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL,
    question_id UUID NOT NULL,
    answer_text TEXT,
    rating_value INTEGER,
    CONSTRAINT fk_survey_answers_submission
        FOREIGN KEY (submission_id) REFERENCES survey_submissions(id),
    CONSTRAINT uk_survey_answer_question
        UNIQUE (submission_id, question_id)
);

CREATE INDEX idx_survey_answers_submission
    ON survey_answers(submission_id);
