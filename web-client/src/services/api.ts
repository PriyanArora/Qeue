import type {
  Analytics,
  AuthResponse,
  CheckInResult,
  EventDetail,
  EventFormValues,
  EventSummary,
  LoginRequest,
  RegisterRequest,
  Registration,
  RegistrationAnswer,
  RegistrationQuestion,
  RegistrationType,
  Session,
  Speaker,
  Survey,
  SurveyAnswer,
  SurveySubmission,
  Ticket
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export class ApiClientError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;

  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await readJson(response);
    throw new ApiClientError(
      response.status,
      errorBody.message ?? errorBody.error ?? 'Request failed',
      errorBody.fields ?? {}
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function download(path: string, token: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'text/csv',
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorBody = await readJson(response);
    throw new ApiClientError(response.status, errorBody.message ?? 'Download failed', errorBody.fields ?? {});
  }
  return response.blob();
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export const api = {
  login(body: LoginRequest) {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  register(body: RegisterRequest) {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  listEvents() {
    return request<EventSummary[]>('/api/events');
  },
  getEvent(eventId: string) {
    return request<EventDetail>(`/api/events/${eventId}`);
  },
  listPublicQuestions(eventId: string) {
    return request<RegistrationQuestion[]>(`/api/events/${eventId}/registration-questions`);
  },
  listPublicTypes(eventId: string) {
    return request<RegistrationType[]>(`/api/events/${eventId}/registration-types`);
  },
  listPublicSessions(eventId: string) {
    return request<Session[]>(`/api/events/${eventId}/sessions`);
  },
  getActiveSurvey(eventId: string) {
    return request<Survey>(`/api/events/${eventId}/surveys/active`);
  },
  listOrganizerEvents(token: string) {
    return request<EventSummary[]>('/api/organizer/events', {}, token);
  },
  getOrganizerEvent(eventId: string, token: string) {
    return request<EventDetail>(`/api/organizer/events/${eventId}`, {}, token);
  },
  createEvent(values: EventFormValues, token: string) {
    return request<EventDetail>('/api/organizer/events', {
      method: 'POST',
      body: JSON.stringify(toEventRequest(values))
    }, token);
  },
  updateEvent(eventId: string, values: EventFormValues, token: string) {
    return request<EventDetail>(`/api/organizer/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(toEventRequest(values))
    }, token);
  },
  publishEvent(eventId: string, token: string) {
    return request<EventDetail>(`/api/organizer/events/${eventId}/publish`, {
      method: 'POST'
    }, token);
  },
  cancelEvent(eventId: string, token: string) {
    return request<EventDetail>(`/api/organizer/events/${eventId}/cancel`, {
      method: 'POST'
    }, token);
  },
  listOrganizerQuestions(eventId: string, token: string) {
    return request<RegistrationQuestion[]>(`/api/organizer/events/${eventId}/registration-questions`, {}, token);
  },
  createQuestion(eventId: string, body: Omit<RegistrationQuestion, 'id' | 'eventId'>, token: string) {
    return request<RegistrationQuestion>(`/api/organizer/events/${eventId}/registration-questions`, {
      method: 'POST',
      body: JSON.stringify(body)
    }, token);
  },
  deactivateQuestion(eventId: string, questionId: string, token: string) {
    return request<void>(`/api/organizer/events/${eventId}/registration-questions/${questionId}`, {
      method: 'DELETE'
    }, token);
  },
  listOrganizerTypes(eventId: string, token: string) {
    return request<RegistrationType[]>(`/api/organizer/events/${eventId}/registration-types`, {}, token);
  },
  createType(eventId: string, body: Omit<RegistrationType, 'id' | 'eventId'>, token: string) {
    return request<RegistrationType>(`/api/organizer/events/${eventId}/registration-types`, {
      method: 'POST',
      body: JSON.stringify(body)
    }, token);
  },
  deactivateType(eventId: string, typeId: string, token: string) {
    return request<void>(`/api/organizer/events/${eventId}/registration-types/${typeId}`, {
      method: 'DELETE'
    }, token);
  },
  listOrganizerSpeakers(eventId: string, token: string) {
    return request<Speaker[]>(`/api/organizer/events/${eventId}/speakers`, {}, token);
  },
  createSpeaker(eventId: string, body: Omit<Speaker, 'id' | 'eventId'>, token: string) {
    return request<Speaker>(`/api/organizer/events/${eventId}/speakers`, {
      method: 'POST',
      body: JSON.stringify(body)
    }, token);
  },
  listOrganizerSessions(eventId: string, token: string) {
    return request<Session[]>(`/api/organizer/events/${eventId}/sessions`, {}, token);
  },
  createSession(eventId: string, body: {
    title: string;
    description: string;
    startsAt: string;
    endsAt: string;
    roomName: string;
    capacity: number;
    status: string;
    speakerIds: string[];
  }, token: string) {
    return request<Session>(`/api/organizer/events/${eventId}/sessions`, {
      method: 'POST',
      body: JSON.stringify(body)
    }, token);
  },
  listOrganizerSurveys(eventId: string, token: string) {
    return request<Survey[]>(`/api/organizer/events/${eventId}/surveys`, {}, token);
  },
  createSurvey(eventId: string, body: { title: string; status: string; questions: Array<{ questionText: string; questionType: string; required: boolean; sortOrder: number }> }, token: string) {
    return request<Survey>(`/api/organizer/events/${eventId}/surveys`, {
      method: 'POST',
      body: JSON.stringify(body)
    }, token);
  },
  listAttendees(eventId: string, token: string) {
    return request<Registration[]>(`/api/organizer/events/${eventId}/registrations`, {}, token);
  },
  exportAttendees(eventId: string, token: string) {
    return download(`/api/organizer/events/${eventId}/registrations/export.csv`, token);
  },
  analytics(eventId: string, token: string) {
    return request<Analytics>(`/api/organizer/events/${eventId}/analytics`, {}, token);
  },
  checkIn(eventId: string, ticketCode: string, token: string) {
    return request<CheckInResult>(`/api/organizer/events/${eventId}/check-in`, {
      method: 'POST',
      body: JSON.stringify({ ticketCode })
    }, token);
  },
  reserveSeat(eventId: string, idempotencyKey: string, token: string, registrationTypeId?: string, answers: RegistrationAnswer[] = []) {
    return request<Registration>(`/api/events/${eventId}/registrations`, {
      method: 'POST',
      body: JSON.stringify({ idempotencyKey, registrationTypeId, answers })
    }, token);
  },
  listMyRegistrations(token: string) {
    return request<Registration[]>('/api/me/registrations', {}, token);
  },
  cancelRegistration(registrationId: string, token: string) {
    return request<Registration>(`/api/registrations/${registrationId}`, {
      method: 'DELETE'
    }, token);
  },
  issueTicket(registrationId: string, token: string) {
    return request<Ticket>(`/api/me/registrations/${registrationId}/ticket`, {}, token);
  },
  submitSurvey(eventId: string, surveyId: string, answers: SurveyAnswer[], token: string) {
    return request<SurveySubmission>(`/api/events/${eventId}/surveys/${surveyId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    }, token);
  },
  listSurveyResponses(eventId: string, surveyId: string, token: string) {
    return request<SurveySubmission[]>(`/api/organizer/events/${eventId}/surveys/${surveyId}/responses`, {}, token);
  }
};

function toEventRequest(values: EventFormValues) {
  return {
    ...values,
    startsAt: new Date(values.startsAt).toISOString(),
    endsAt: new Date(values.endsAt).toISOString(),
    bannerImageUrl: values.bannerImageUrl || null
  };
}
