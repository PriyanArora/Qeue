INSERT INTO event_inventory (
    event_id,
    title,
    starts_at,
    capacity,
    confirmed_count,
    event_status,
    version
) VALUES
(
    '11111111-1111-1111-1111-111111111001',
    'Springfield Java Meetup',
    '2026-07-15T18:00:00Z',
    80,
    0,
    'PUBLISHED',
    0
),
(
    '11111111-1111-1111-1111-111111111002',
    'Capital City DevOps Workshop',
    '2026-08-12T14:00:00Z',
    40,
    0,
    'PUBLISHED',
    0
),
(
    '11111111-1111-1111-1111-111111111004',
    'Cancelled Product Demo Day',
    '2026-10-05T13:00:00Z',
    60,
    0,
    'CANCELLED',
    0
);
