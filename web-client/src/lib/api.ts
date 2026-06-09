import type {
  Analytics,
  AuthResponse,
  CheckInResponse,
  EventDetail,
  EventRequest,
  EventSummary,
  OrganizerRegistration,
  Registration,
  RegistrationListParams,
  RegistrationQuestion,
  RegistrationQuestionRequest,
  RegistrationRequest,
  RegistrationType,
  RegistrationTypeRequest,
  Role,
  Session,
  SessionRequest,
  Speaker,
  SpeakerRequest,
  Survey,
  SurveyRequest,
  SurveySubmission,
  SurveySubmissionRequest,
  Ticket,
  User,
} from './types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const TOKEN_KEY = 'qeue.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Error thrown for non-2xx responses, carrying the parsed API error body. */
export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'Network error — is the gateway running?');
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? parseJsonResponse(text, response) : null;

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && (data as any).message) ||
      defaultMessage(response.status);
    const fields = data && typeof data === 'object' ? (data as any).fields : undefined;
    throw new ApiError(response.status, String(message), fields);
  }

  return data as T;
}

function parseJsonResponse(text: string, response: Response): unknown {
  try {
    return JSON.parse(text);
  } catch {
    if (response.ok) {
      throw new ApiError(
        response.status,
        'Unexpected response from API. Check VITE_API_BASE_URL or the /api proxy configuration.',
      );
    }
    return text;
  }
}

function defaultMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Please check the form and try again.';
    case 401:
      return 'Please sign in to continue.';
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return 'Not found.';
    case 409:
      return 'That conflicts with an existing record.';
    default:
      return `Request failed (${status}).`;
  }
}

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries as [string, string][]).toString();
}

// ---------------------------------------------------------------- auth
export const authApi = {
  register: (body: {
    email: string;
    password: string;
    displayName: string;
    role: Role;
  }) => request<AuthResponse>('/api/auth/register', { method: 'POST', body, auth: false }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body, auth: false }),

  me: (signal?: AbortSignal) => request<User>('/api/auth/me', { signal }),
};

// ---------------------------------------------------------- public events
export const eventsApi = {
  listPublished: (signal?: AbortSignal) =>
    request<EventSummary[]>('/api/events', { auth: false, signal }),

  get: (eventId: string, signal?: AbortSignal) =>
    request<EventDetail>(`/api/events/${eventId}`, { auth: false, signal }),

  questions: (eventId: string, signal?: AbortSignal) =>
    request<RegistrationQuestion[]>(`/api/events/${eventId}/registration-questions`, {
      auth: false,
      signal,
    }),

  types: (eventId: string, signal?: AbortSignal) =>
    request<RegistrationType[]>(`/api/events/${eventId}/registration-types`, {
      auth: false,
      signal,
    }),

  speakers: (eventId: string, signal?: AbortSignal) =>
    request<Speaker[]>(`/api/events/${eventId}/speakers`, { auth: false, signal }),

  sessions: (eventId: string, signal?: AbortSignal) =>
    request<Session[]>(`/api/events/${eventId}/sessions`, { auth: false, signal }),

  activeSurvey: (eventId: string, signal?: AbortSignal) =>
    request<Survey>(`/api/events/${eventId}/surveys/active`, { auth: false, signal }),
};

// -------------------------------------------------- attendee registrations
export const registrationsApi = {
  register: (eventId: string, body: RegistrationRequest) =>
    request<Registration>(`/api/events/${eventId}/registrations`, { method: 'POST', body }),

  cancel: (registrationId: string) =>
    request<Registration>(`/api/registrations/${registrationId}`, { method: 'DELETE' }),

  mine: (signal?: AbortSignal) =>
    request<Registration[]>('/api/me/registrations', { signal }),

  ticket: (registrationId: string) =>
    request<Ticket>(`/api/me/registrations/${registrationId}/ticket`),

  submitSurvey: (eventId: string, surveyId: string, body: SurveySubmissionRequest) =>
    request<SurveySubmission>(`/api/events/${eventId}/surveys/${surveyId}/responses`, {
      method: 'POST',
      body,
    }),
};

// -------------------------------------------------------------- organizer
export const organizerApi = {
  listEvents: (signal?: AbortSignal) =>
    request<EventSummary[]>('/api/organizer/events', { signal }),

  getEvent: (eventId: string, signal?: AbortSignal) =>
    request<EventDetail>(`/api/organizer/events/${eventId}`, { signal }),

  createEvent: (body: EventRequest) =>
    request<EventDetail>('/api/organizer/events', { method: 'POST', body }),

  updateEvent: (eventId: string, body: EventRequest) =>
    request<EventDetail>(`/api/organizer/events/${eventId}`, { method: 'PUT', body }),

  publish: (eventId: string) =>
    request<EventDetail>(`/api/organizer/events/${eventId}/publish`, { method: 'POST' }),

  cancel: (eventId: string) =>
    request<EventDetail>(`/api/organizer/events/${eventId}/cancel`, { method: 'POST' }),

  // questions
  questions: (eventId: string, signal?: AbortSignal) =>
    request<RegistrationQuestion[]>(`/api/organizer/events/${eventId}/registration-questions`, {
      signal,
    }),
  createQuestion: (eventId: string, body: RegistrationQuestionRequest) =>
    request<RegistrationQuestion>(`/api/organizer/events/${eventId}/registration-questions`, {
      method: 'POST',
      body,
    }),
  updateQuestion: (eventId: string, questionId: string, body: RegistrationQuestionRequest) =>
    request<RegistrationQuestion>(
      `/api/organizer/events/${eventId}/registration-questions/${questionId}`,
      { method: 'PUT', body },
    ),
  deleteQuestion: (eventId: string, questionId: string) =>
    request<void>(`/api/organizer/events/${eventId}/registration-questions/${questionId}`, {
      method: 'DELETE',
    }),

  // types
  types: (eventId: string, signal?: AbortSignal) =>
    request<RegistrationType[]>(`/api/organizer/events/${eventId}/registration-types`, { signal }),
  createType: (eventId: string, body: RegistrationTypeRequest) =>
    request<RegistrationType>(`/api/organizer/events/${eventId}/registration-types`, {
      method: 'POST',
      body,
    }),
  updateType: (eventId: string, typeId: string, body: RegistrationTypeRequest) =>
    request<RegistrationType>(`/api/organizer/events/${eventId}/registration-types/${typeId}`, {
      method: 'PUT',
      body,
    }),
  deleteType: (eventId: string, typeId: string) =>
    request<void>(`/api/organizer/events/${eventId}/registration-types/${typeId}`, {
      method: 'DELETE',
    }),

  // speakers
  speakers: (eventId: string, signal?: AbortSignal) =>
    request<Speaker[]>(`/api/organizer/events/${eventId}/speakers`, { signal }),
  createSpeaker: (eventId: string, body: SpeakerRequest) =>
    request<Speaker>(`/api/organizer/events/${eventId}/speakers`, { method: 'POST', body }),
  updateSpeaker: (eventId: string, speakerId: string, body: SpeakerRequest) =>
    request<Speaker>(`/api/organizer/events/${eventId}/speakers/${speakerId}`, {
      method: 'PUT',
      body,
    }),
  deleteSpeaker: (eventId: string, speakerId: string) =>
    request<void>(`/api/organizer/events/${eventId}/speakers/${speakerId}`, { method: 'DELETE' }),

  // sessions
  sessions: (eventId: string, signal?: AbortSignal) =>
    request<Session[]>(`/api/organizer/events/${eventId}/sessions`, { signal }),
  createSession: (eventId: string, body: SessionRequest) =>
    request<Session>(`/api/organizer/events/${eventId}/sessions`, { method: 'POST', body }),
  updateSession: (eventId: string, sessionId: string, body: SessionRequest) =>
    request<Session>(`/api/organizer/events/${eventId}/sessions/${sessionId}`, {
      method: 'PUT',
      body,
    }),
  deleteSession: (eventId: string, sessionId: string) =>
    request<void>(`/api/organizer/events/${eventId}/sessions/${sessionId}`, { method: 'DELETE' }),

  // surveys
  surveys: (eventId: string, signal?: AbortSignal) =>
    request<Survey[]>(`/api/organizer/events/${eventId}/surveys`, { signal }),
  createSurvey: (eventId: string, body: SurveyRequest) =>
    request<Survey>(`/api/organizer/events/${eventId}/surveys`, { method: 'POST', body }),
  surveyResponses: (eventId: string, surveyId: string, signal?: AbortSignal) =>
    request<SurveySubmission[]>(
      `/api/organizer/events/${eventId}/surveys/${surveyId}/responses`,
      { signal },
    ),

  // attendees / check-in / analytics
  registrations: (eventId: string, params: RegistrationListParams = {}, signal?: AbortSignal) =>
    request<OrganizerRegistration[]>(
      `/api/organizer/events/${eventId}/registrations${qs({
        status: params.status,
        registrationTypeId: params.registrationTypeId,
        query: params.query,
        sort: params.sort,
      })}`,
      { signal },
    ),
  registration: (eventId: string, registrationId: string, signal?: AbortSignal) =>
    request<OrganizerRegistration>(
      `/api/organizer/events/${eventId}/registrations/${registrationId}`,
      { signal },
    ),
  checkIn: (eventId: string, ticketCode: string) =>
    request<CheckInResponse>(`/api/organizer/events/${eventId}/check-in`, {
      method: 'POST',
      body: { ticketCode },
    }),
  analytics: (eventId: string, signal?: AbortSignal) =>
    request<Analytics>(`/api/organizer/events/${eventId}/analytics`, { signal }),

  /** CSV export needs the bearer header, so fetch as a blob and return it for download. */
  async exportRegistrationsCsv(eventId: string): Promise<Blob> {
    const token = getToken();
    const response = await fetch(
      `${BASE_URL}/api/organizer/events/${eventId}/registrations/export.csv`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!response.ok) throw new ApiError(response.status, defaultMessage(response.status));
    return response.blob();
  },
};
