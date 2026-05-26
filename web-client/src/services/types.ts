export type UserRole = 'ORGANIZER' | 'ATTENDEE';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
export type EventFormat = 'IN_PERSON' | 'ONLINE' | 'HYBRID';
export type RegistrationStatus = 'CONFIRMED' | 'CANCELLED';
export type QuestionType = 'TEXT' | 'LONG_TEXT' | 'YES_NO' | 'RATING_1_TO_5';
export type SessionStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type CheckInStatus = 'NOT_CHECKED_IN' | 'CHECKED_IN';

export interface AuthResponse {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  tokenType: string;
  accessToken: string;
  expiresAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

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

export interface EventFormValues {
  title: string;
  description: string;
  eventFormat: EventFormat;
  category: string;
  bannerImageUrl: string;
  venueName: string;
  venueCity: string;
  venueAddress: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
}

export interface RegistrationAnswer {
  questionId: string;
  answerText: string;
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

export interface RegistrationQuestion {
  id: string;
  eventId: string;
  questionText: string;
  questionType: QuestionType;
  required: boolean;
  sortOrder: number;
  active: boolean;
}

export interface RegistrationType {
  id: string;
  eventId: string;
  name: string;
  description: string;
  capacity: number;
  active: boolean;
  sortOrder: number;
}

export interface Speaker {
  id: string;
  eventId: string;
  name: string;
  title: string;
  organization: string;
  bio: string;
  photoUrl?: string | null;
}

export interface Session {
  id: string;
  eventId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  roomName: string;
  capacity: number;
  status: SessionStatus;
  speakers: Speaker[];
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  questionText: string;
  questionType: QuestionType;
  required: boolean;
  sortOrder: number;
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
  answerText?: string;
  ratingValue?: number;
}

export interface SurveySubmission {
  submissionId: string;
  surveyId: string;
  eventId: string;
  attendeeId: string;
  submittedAt: string;
  answers: SurveyAnswer[];
}

export interface Ticket {
  registrationId: string;
  eventId: string;
  ticketCode: string;
  issuedAt: string;
}

export interface CheckInResult {
  status: CheckInStatus;
  registrationId: string;
  attendeeEmail: string;
  checkedInAt: string;
}

export interface Analytics {
  capacity: number;
  confirmedRegistrations: number;
  cancelledRegistrations: number;
  availableSeats: number;
  checkIns: number;
  noShows: number;
  registrationTypeBreakdown: Array<{
    registrationTypeName: string;
    confirmedCount: number;
  }>;
}

export interface ApiError {
  message?: string;
  error?: string;
  fields?: Record<string, string>;
}
