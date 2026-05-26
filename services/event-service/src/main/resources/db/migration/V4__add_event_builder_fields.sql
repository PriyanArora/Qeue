ALTER TABLE events ADD COLUMN event_format VARCHAR(24);
ALTER TABLE events ADD COLUMN category VARCHAR(80);
ALTER TABLE events ADD COLUMN banner_image_url VARCHAR(500);
ALTER TABLE events ADD COLUMN venue_address VARCHAR(240);
ALTER TABLE events ADD COLUMN timezone VARCHAR(80);

UPDATE events
SET event_format = 'IN_PERSON',
    category = 'Technology',
    venue_address = venue_name || ', ' || venue_city,
    timezone = 'UTC'
WHERE event_format IS NULL;

ALTER TABLE events ALTER COLUMN event_format SET NOT NULL;
ALTER TABLE events ALTER COLUMN category SET NOT NULL;
ALTER TABLE events ALTER COLUMN venue_address SET NOT NULL;
ALTER TABLE events ALTER COLUMN timezone SET NOT NULL;
