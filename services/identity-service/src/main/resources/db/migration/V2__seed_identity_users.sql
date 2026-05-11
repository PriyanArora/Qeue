-- Local-only development users. Password for both accounts: LocalDevPassword1!
INSERT INTO identity_users (
    id,
    email,
    password_hash,
    display_name,
    role,
    created_at,
    updated_at
) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'organizer@eventforge.local',
    '$2a$10$3moS5c/ObAzRLLRKabmLYu8kT0eac8KjXPlY7nusPn0DzHxDDUuve',
    'Local Organizer',
    'ORGANIZER',
    '2026-05-01T00:00:00Z',
    '2026-05-01T00:00:00Z'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'attendee@eventforge.local',
    '$2a$10$3YEaS8zKseMw3wZUhElcIOIhPxJH0Y/G0GOTkWfPGWkcqlgMCrUQC',
    'Local Attendee',
    'ATTENDEE',
    '2026-05-01T00:00:00Z',
    '2026-05-01T00:00:00Z'
);
