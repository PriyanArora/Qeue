CREATE TABLE events
(
    id           UUID PRIMARY KEY,
    organizer_id UUID NOT NULL,
    title        VARCHAR(120) NOT NULL,
    description  TEXT NOT NULL,
    venue_name   VARCHAR(160) NOT NULL,
    venue_city   VARCHAR(120) NOT NULL,
    starts_at    TIMESTAMP NOT NULL,
    ends_at      TIMESTAMP NOT NULL,
    capacity     INTEGER NOT NULL,
    status       VARCHAR(24) NOT NULL,
    created_at   TIMESTAMP NOT NULL,
    updated_at   TIMESTAMP NOT NULL
);

CREATE INDEX idx_events_status_starts_at ON events (status, starts_at);
CREATE INDEX idx_events_organizer_starts_at ON events (organizer_id, starts_at);
