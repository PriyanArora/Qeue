CREATE TABLE registrations (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    attendee_id UUID NOT NULL,
    attendee_email VARCHAR(320) NOT NULL,
    status VARCHAR(30) NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    cancelled_at TIMESTAMP,
    CONSTRAINT fk_registrations_event_inventory
        FOREIGN KEY (event_id) REFERENCES event_inventory(event_id),
    CONSTRAINT uk_registration_attendee_idempotency
        UNIQUE (attendee_id, idempotency_key),
    CONSTRAINT uk_registration_attendee_event_status
        UNIQUE (attendee_id, event_id, status)
);

CREATE INDEX idx_registrations_attendee_created ON registrations(attendee_id, created_at);
CREATE INDEX idx_registrations_event_status ON registrations(event_id, status);
