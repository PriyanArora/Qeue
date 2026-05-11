CREATE TABLE event_inventory (
    event_id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    capacity INTEGER NOT NULL,
    confirmed_count INTEGER NOT NULL,
    event_status VARCHAR(30) NOT NULL,
    version BIGINT NOT NULL
);

CREATE INDEX idx_event_inventory_status ON event_inventory(event_status);
