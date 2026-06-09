// Types mirroring the OpenAPI contracts in contracts/openapi/*.yaml.

export type Role = 'ORGANIZER' | 'ATTENDEE';

export interface User {
  userId: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface AuthResponse extends User {
  tokenType: string;
  accessToken: string;
  expiresAt: string;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  fields?: Record<string, string>;
}

// ----- Events -----

export type EventFormat = 'IN_PERSON' | 'ONLINE' | 'HYBRID';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export interface EventSummary {
  id: string;
  organizerId: string;
  title: string;
  eventFormat: EventFormat;
  category: string;
  bannerImageUrl?: string | null;
  venueName: string;
  venueCity: string;
  venueAddress: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: EventStatus;
}

export interface EventDetail extends EventSummary {
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventRequest {
  title: string;
  description: string;
  eventFormat: EventFormat;
  category: string;
  bannerImageUrl?: string | null;
  venueName: string;
  venueCity: string;
  venueAddress: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
}

// ----- Registration questions / types -----

export type QuestionType = 'TEXT' | 'LONG_TEXT' | 'YES_NO' | 'RATING_1_TO_5';

export interface RegistrationQuestionRequest {
  questionText: string;
  questionType: QuestionType;
  required: boolean;
  sortOrder: number;
  active: boolean;
}

export interface RegistrationQuestion extends RegistrationQuestionRequest {
  id: string;
  eventId: string;
}

export interface RegistrationTypeRequest {
  name: string;
  description: string;
  capacity: number;
  active: boolean;
  sortOrder: number;
}

export interface RegistrationType extends RegistrationTypeRequest {
  id: string;
  eventId: string;
}

// ----- Speakers / sessions -----

export interface SpeakerRequest {
  name: string;
  title: string;
  organization: string;
  bio: string;
  photoUrl?: string;
}

export interface Speaker extends SpeakerRequest {
  id: string;
  eventId: string;
}

export interface SessionRequest {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  roomName: string;
  capacity: number;
  status: EventStatus;
  speakerIds?: string[];
}

export interface Session extends Omit<SessionRequest, 'speakerIds'> {
  id: string;
  eventId: string;
  speakers: Speaker[];
}

// ----- Surveys -----

export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface SurveyQuestionRequest {
  questionText: string;
  questionType: QuestionType;
  required: boolean;
  sortOrder: number;
}

export interface SurveyQuestion extends SurveyQuestionRequest {
  id: string;
  surveyId: string;
}

export interface SurveyRequest {
  title: string;
  status: SurveyStatus;
  questions: SurveyQuestionRequest[];
}

export interface Survey {
  id: string;
  eventId: string;
  title: string;
  status: SurveyStatus;
  questions: SurveyQuestion[];
}

export interface SurveyAnswer {
  questionId: string;
  answerText?: string | null;
  ratingValue?: number | null;
}

export interface SurveySubmissionRequest {
  answers: SurveyAnswer[];
}

export interface SurveySubmission {
  submissionId: string;
  surveyId: string;
  eventId: string;
  attendeeId: string;
  submittedAt: string;
  answers: SurveyAnswer[];
}

// ----- Registrations / tickets / check-in / analytics -----

export type RegistrationStatus = 'CONFIRMED' | 'CANCELLED';
export type CheckInStatus = 'NOT_CHECKED_IN' | 'CHECKED_IN';

export interface RegistrationAnswer {
  questionId: string;
  answerText: string;
}

export interface RegistrationRequest {
  idempotencyKey: string;
  registrationTypeId?: string | null;
  answers?: RegistrationAnswer[];
}

export interface Registration {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  startsAt: string;
  attendeeId: string;
  attendeeEmail: string;
  attendeeDisplayNameSnapshot: string;
  registrationTypeId?: string | null;
  registrationTypeNameSnapshot?: string | null;
  status: RegistrationStatus;
  checkInStatus: CheckInStatus;
  createdAt: string;
  cancelledAt?: string | null;
  checkedInAt?: string | null;
  answers: RegistrationAnswer[];
}

export type OrganizerRegistration = Registration;

export interface Ticket {
  registrationId: string;
  eventId: string;
  ticketCode: string;
  issuedAt: string;
}

export interface CheckInResponse {
  status: CheckInStatus;
  registrationId: string;
  attendeeEmail: string;
  checkedInAt: string;
}

export interface RegistrationTypeBreakdown {
  registrationTypeName: string;
  confirmedCount: number;
}

export interface Analytics {
  capacity: number;
  confirmedRegistrations: number;
  cancelledRegistrations: number;
  availableSeats: number;
  checkIns: number;
  noShows: number;
  registrationTypeBreakdown: RegistrationTypeBreakdown[];
}

// Query params for the organizer attendee list.
export interface RegistrationListParams {
  status?: RegistrationStatus;
  registrationTypeId?: string;
  query?: string;
  sort?:
    | 'createdAtAsc'
    | 'createdAtDesc'
    | 'emailAsc'
    | 'emailDesc'
    | 'statusAsc'
    | 'statusDesc';
}
