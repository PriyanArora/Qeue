CREATE TABLE event_outbox_messages
(
    id           UUID PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    event_type   VARCHAR(80) NOT NULL,
    payload_json TEXT NOT NULL,
    status       VARCHAR(24) NOT NULL,
    created_at   TIMESTAMP NOT NULL,
    published_at TIMESTAMP NULL
);

CREATE INDEX idx_event_outbox_status_created_at ON event_outbox_messages (status, created_at);
