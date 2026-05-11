ALTER TABLE registrations DROP CONSTRAINT uk_registration_attendee_event_status;

ALTER TABLE registrations ADD COLUMN active_registration_key VARCHAR(30);

UPDATE registrations
SET active_registration_key = 'CONFIRMED'
WHERE status = 'CONFIRMED';

CREATE UNIQUE INDEX uk_registration_active_attendee_event
    ON registrations(attendee_id, event_id, active_registration_key);
