import type {
  CheckInStatus,
  EventFormat,
  EventStatus,
  QuestionType,
  RegistrationStatus,
  SurveyStatus,
} from './types';

/** Format an ISO instant in a given IANA timezone (falls back to local). */
export function formatDateTime(iso: string, timezone?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone || undefined,
    timeZoneName: timezone ? 'short' : undefined,
  }).format(d);
}

export function formatDate(iso: string, timezone?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: timezone || undefined,
  }).format(d);
}

export function formatTime(iso: string, timezone?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone || undefined,
  }).format(d);
}

/** Compact day badge, e.g. { month: 'JUN', day: '20' }. */
export function dateParts(iso: string, timezone?: string): { month: string; day: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { month: '', day: '' };
  const month = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: timezone || undefined,
  })
    .format(d)
    .toUpperCase();
  const day = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    timeZone: timezone || undefined,
  }).format(d);
  return { month, day };
}

export function isPast(iso: string): boolean {
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

/** Convert an ISO instant to the value a datetime-local input expects (local time). */
export function toLocalInputValue(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** Convert a datetime-local input value back to an ISO instant. */
export function fromLocalInputValue(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

// ----- Labels & badge styling -----

export const eventFormatLabel: Record<EventFormat, string> = {
  IN_PERSON: 'In person',
  ONLINE: 'Online',
  HYBRID: 'Hybrid',
};

export const questionTypeLabel: Record<QuestionType, string> = {
  TEXT: 'Short text',
  LONG_TEXT: 'Long text',
  YES_NO: 'Yes / No',
  RATING_1_TO_5: 'Rating (1–5)',
};

type BadgeMeta = { label: string; className: string };

export const eventStatusMeta: Record<EventStatus, BadgeMeta> = {
  DRAFT: { label: 'Draft', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  PUBLISHED: { label: 'Published', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-rose-50 text-rose-700 ring-rose-600/20' },
};

export const surveyStatusMeta: Record<SurveyStatus, BadgeMeta> = {
  DRAFT: { label: 'Draft', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  ACTIVE: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  CLOSED: { label: 'Closed', className: 'bg-gray-100 text-gray-600 ring-gray-500/20' },
};

export const registrationStatusMeta: Record<RegistrationStatus, BadgeMeta> = {
  CONFIRMED: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-rose-50 text-rose-700 ring-rose-600/20' },
};

export const checkInMeta: Record<CheckInStatus, BadgeMeta> = {
  NOT_CHECKED_IN: { label: 'Not checked in', className: 'bg-gray-100 text-gray-600 ring-gray-500/20' },
  CHECKED_IN: { label: 'Checked in', className: 'bg-sky-50 text-sky-700 ring-sky-600/20' },
};

/** Stable per-event accent for banner-less cards (hashed from id). */
export function accentFor(seed: string): string {
  const palette = [
    'from-orange-400 to-rose-400',
    'from-violet-400 to-indigo-400',
    'from-emerald-400 to-teal-400',
    'from-sky-400 to-blue-400',
    'from-amber-400 to-orange-400',
    'from-fuchsia-400 to-pink-400',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

/** A short idempotency key for registration submissions. */
export function idempotencyKey(): string {
  return (
    'reg-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 10)
  );
}
