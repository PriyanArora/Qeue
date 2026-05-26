CREATE TABLE notification_log (
    id UUID PRIMARY KEY,
    registration_id UUID NOT NULL,
    event_id UUID NOT NULL,
    recipient_email VARCHAR(320) NOT NULL,
    notification_type VARCHAR(60) NOT NULL,
    status VARCHAR(30) NOT NULL,
    message_id VARCHAR(120),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_notification_registration_type
        UNIQUE (registration_id, notification_type)
);

CREATE INDEX idx_notification_log_created_at ON notification_log(created_at);
CREATE INDEX idx_notification_log_recipient ON notification_log(recipient_email);
