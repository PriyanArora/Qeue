import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { App } from '../App';
import { AuthProvider } from '../state/AuthContext';

const authUser = {
  userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  email: 'attendee@example.com',
  displayName: 'Attendee User',
  role: 'ATTENDEE',
  accessToken: 'attendee-token'
};

const organizerUser = {
  userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  email: 'organizer@example.com',
  displayName: 'Organizer User',
  role: 'ORGANIZER',
  accessToken: 'organizer-token'
};

const eventSummary = {
  id: '11111111-1111-1111-1111-111111111001',
  organizerId: organizerUser.userId,
  title: 'Springfield Java Meetup',
  eventFormat: 'IN_PERSON',
  category: 'Technology',
  bannerImageUrl: null,
  venueName: 'Community Hall',
  venueCity: 'Springfield',
  venueAddress: '1 Main St',
  timezone: 'UTC',
  startsAt: '2026-07-15T18:00:00Z',
  endsAt: '2026-07-15T20:00:00Z',
  capacity: 80,
  status: 'PUBLISHED'
};

const draftEvent = {
  ...eventSummary,
  id: '11111111-1111-1111-1111-111111111003',
  title: 'Draft Architecture Clinic',
  status: 'DRAFT'
};

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  }));
}

describe('Qeue app', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test('renders public events from the gateway API', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse([eventSummary])));

    renderApp('/events');

    expect(await screen.findByText('Springfield Java Meetup')).toBeInTheDocument();
    expect(screen.getByText('Community Hall, Springfield')).toBeInTheDocument();
  });

  test('redirects protected organizer route to login', async () => {
    vi.stubGlobal('fetch', vi.fn());

    renderApp('/organizer/events');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  test('organizer can publish a draft event', async () => {
    localStorage.setItem('qeue.auth', JSON.stringify(organizerUser));
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url.endsWith('/api/organizer/events') && !init?.method) {
        return jsonResponse([draftEvent]);
      }
      if (url.endsWith(`/api/organizer/events/${draftEvent.id}/publish`)) {
        return jsonResponse({ ...draftEvent, status: 'PUBLISHED' });
      }
      return jsonResponse({ message: 'not found' }, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/organizer/events');

    await screen.findByText('Draft Architecture Clinic');
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(screen.getByText('PUBLISHED')).toBeInTheDocument());
  });

  test('attendee can reserve a seat from event detail', async () => {
    localStorage.setItem('qeue.auth', JSON.stringify(authUser));
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('idem-key' as `${string}-${string}-${string}-${string}-${string}`);
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url.endsWith(`/api/events/${eventSummary.id}`) && !init?.method) {
        return jsonResponse({ ...eventSummary, description: 'A practical Java meetup.', createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' });
      }
      if (url.endsWith(`/api/events/${eventSummary.id}/registration-questions`)) {
        return jsonResponse([]);
      }
      if (url.endsWith(`/api/events/${eventSummary.id}/registration-types`)) {
        return jsonResponse([]);
      }
      if (url.endsWith(`/api/events/${eventSummary.id}/sessions`)) {
        return jsonResponse([]);
      }
      if (url.endsWith(`/api/events/${eventSummary.id}/surveys/active`)) {
        return jsonResponse({ message: 'not found' }, 404);
      }
      if (url.endsWith(`/api/events/${eventSummary.id}/registrations`)) {
        return jsonResponse({
          registrationId: '22222222-2222-2222-2222-222222222222',
          eventId: eventSummary.id,
          eventTitle: eventSummary.title,
          startsAt: eventSummary.startsAt,
          attendeeId: authUser.userId,
          attendeeEmail: authUser.email,
          attendeeDisplayNameSnapshot: authUser.email,
          registrationTypeId: null,
          registrationTypeNameSnapshot: null,
          status: 'CONFIRMED',
          checkInStatus: 'NOT_CHECKED_IN',
          createdAt: '2026-05-12T00:00:00Z',
          cancelledAt: null,
          checkedInAt: null,
          answers: []
        }, 201);
      }
      return jsonResponse({ message: 'not found' }, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderApp(`/events/${eventSummary.id}`);

    await screen.findByText('A practical Java meetup.');
    await userEvent.click(screen.getByRole('button', { name: 'Reserve seat' }));

    expect(await screen.findByText('Seat reserved.')).toBeInTheDocument();
  });

  test('attendee sees duplicate registration rejection', async () => {
    localStorage.setItem('qeue.auth', JSON.stringify(authUser));
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('idem-key' as `${string}-${string}-${string}-${string}-${string}`);
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url.endsWith(`/api/events/${eventSummary.id}`) && !init?.method) {
        return jsonResponse({ ...eventSummary, description: 'A practical Java meetup.', createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' });
      }
      if (url.endsWith(`/api/events/${eventSummary.id}/registration-questions`)) {
        return jsonResponse([]);
      }
      if (url.endsWith(`/api/events/${eventSummary.id}/registration-types`)) {
        return jsonResponse([]);
      }
      if (url.endsWith(`/api/events/${eventSummary.id}/sessions`)) {
        return jsonResponse([]);
      }
      if (url.endsWith(`/api/events/${eventSummary.id}/surveys/active`)) {
        return jsonResponse({ message: 'not found' }, 404);
      }
      return jsonResponse({ message: 'Attendee is already registered for this event' }, 409);
    }));

    renderApp(`/events/${eventSummary.id}`);

    await screen.findByText('A practical Java meetup.');
    await userEvent.click(screen.getByRole('button', { name: 'Reserve seat' }));

    expect(await screen.findByText('Attendee is already registered for this event')).toBeInTheDocument();
  });
});
