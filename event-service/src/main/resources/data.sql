-- Ensure the 'event' table exists
CREATE TABLE IF NOT EXISTS event
(
    id              UUID PRIMARY KEY,
    title           VARCHAR(255) UNIQUE NOT NULL,
    organizer_email VARCHAR(255)        NOT NULL,
    venue           VARCHAR(255)        NOT NULL,
    event_date      DATE                NOT NULL,
    created_date    DATE                NOT NULL
    );

-- Insert well-known UUIDs for specific events
INSERT INTO event (id, title, organizer_email, venue, event_date, created_date)
SELECT '123e4567-e89b-12d3-a456-426614174000',
       'Springfield Java Meetup',
       'organizer.springfield@example.com',
       'Springfield Community Hall',
       '2026-06-15',
       '2026-05-01'
    WHERE NOT EXISTS (SELECT 1
                  FROM event
                  WHERE id = '123e4567-e89b-12d3-a456-426614174000');

INSERT INTO event (id, title, organizer_email, venue, event_date, created_date)
SELECT '123e4567-e89b-12d3-a456-426614174001',
       'Shelbyville Startup Night',
       'events@shelbyville.dev',
       'Shelbyville Innovation Center',
       '2026-07-23',
       '2026-05-02'
    WHERE NOT EXISTS (SELECT 1
                  FROM event
                  WHERE id = '123e4567-e89b-12d3-a456-426614174001');

INSERT INTO event (id, title, organizer_email, venue, event_date, created_date)
SELECT '123e4567-e89b-12d3-a456-426614174002',
       'Capital City DevOps Workshop',
       'workshops@capitalcity.dev',
       'Capital City Library',
       '2026-08-12',
       '2026-05-03'
    WHERE NOT EXISTS (SELECT 1
                  FROM event
                  WHERE id = '123e4567-e89b-12d3-a456-426614174002');

INSERT INTO event (id, title, organizer_email, venue, event_date, created_date)
SELECT '123e4567-e89b-12d3-a456-426614174003',
       'Springfield Cloud Study Group',
       'cloud.study@example.com',
       'Springfield Tech Hub',
       '2026-09-30',
       '2026-05-04'
    WHERE NOT EXISTS (SELECT 1
                  FROM event
                  WHERE id = '123e4567-e89b-12d3-a456-426614174003');

INSERT INTO event (id, title, organizer_email, venue, event_date, created_date)
SELECT '123e4567-e89b-12d3-a456-426614174004',
       'Shelbyville Product Demo Day',
       'demo@shelbyville.dev',
       'Shelbyville Arts Center',
       '2026-10-05',
       '2026-05-05'
    WHERE NOT EXISTS (SELECT 1
                  FROM event
                  WHERE id = '123e4567-e89b-12d3-a456-426614174004');
