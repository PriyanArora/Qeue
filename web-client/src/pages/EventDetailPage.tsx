import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Globe,
  Ticket,
  ClipboardList,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { eventsApi } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../lib/auth';
import {
  eventFormatLabel,
  eventStatusMeta,
  formatDate,
  formatTime,
  formatDateTime,
} from '../lib/format';
import type { Session, Speaker } from '../lib/types';
import { Container } from '../components/layout/Page';
import { EventBanner } from '../components/events/EventBanner';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingBlock, ErrorState, EmptyState } from '../components/ui/States';
import { SpeakerCard } from '../components/events/SpeakerCard';
import { AgendaList } from '../components/events/AgendaList';

export function EventDetailPage() {
  const { eventId = '' } = useParams();
  const { isAuthenticated, isAttendee } = useAuth();
  const navigate = useNavigate();

  const { data: event, loading, error, reload } = useApi(
    (s) => eventsApi.get(eventId, s),
    [eventId],
  );
  const { data: speakers } = useApi((s) => eventsApi.speakers(eventId, s), [eventId]);
  const { data: sessions } = useApi((s) => eventsApi.sessions(eventId, s), [eventId]);
  const { data: types } = useApi((s) => eventsApi.types(eventId, s), [eventId]);

  if (loading) return <LoadingBlock label="Loading event…" />;
  if (error || !event)
    return (
      <Container className="py-16">
        <ErrorState message={error ?? 'Event not found.'} onRetry={reload} />
      </Container>
    );

  const cancelled = event.status === 'CANCELLED';
  const activeTypes = (types ?? []).filter((t) => t.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const publishedSpeakers = (speakers ?? []) as Speaker[];
  const publishedSessions = ((sessions ?? []) as Session[]).filter((s) => s.status !== 'DRAFT');

  const onRegister = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${eventId}/register` } });
    } else {
      navigate(`/events/${eventId}/register`);
    }
  };

  return (
    <div className="bg-[#F5F5F5] pb-20">
      {/* Banner */}
      <div className="bg-white">
        <Container className="pt-8">
          <Link to="/events" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900">
            ← Back to events
          </Link>
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl">
            <EventBanner event={event} rounded="rounded-3xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
                  {event.category}
                </span>
                <span className="rounded-full bg-gray-900/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                  {eventFormatLabel[event.eventFormat]}
                </span>
                {event.status !== 'PUBLISHED' && <StatusBadge meta={eventStatusMeta[event.status]} />}
              </div>
              <h1 className="mt-3 max-w-3xl text-[clamp(1.6rem,4vw,2.75rem)] font-semibold leading-tight tracking-tight text-white">
                {event.title}
              </h1>
            </div>
          </div>
        </Container>
      </div>

      <Container className="mt-8">
        {cancelled && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            This event has been cancelled by the organizer.
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main column */}
          <div className="space-y-10">
            <section>
              <h2 className="text-lg font-semibold text-gray-900">About this event</h2>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-600">
                {event.description}
              </p>
            </section>

            {publishedSessions.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Agenda</h2>
                <AgendaList sessions={publishedSessions} timezone={event.timezone} />
              </section>
            )}

            {publishedSpeakers.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Speakers</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {publishedSpeakers.map((sp) => (
                    <SpeakerCard key={sp.id} speaker={sp} />
                  ))}
                </div>
              </section>
            )}

            {publishedSessions.length === 0 && publishedSpeakers.length === 0 && (
              <EmptyState
                icon={<ClipboardList className="h-6 w-6" />}
                title="Agenda coming soon"
                description="The organizer hasn't published sessions or speakers for this event yet."
              />
            )}
          </div>

          {/* Sticky registration panel */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden">
              <div className="space-y-4 p-5">
                <MetaRow icon={<CalendarDays className="h-4 w-4" />} label="Date">
                  {formatDate(event.startsAt, event.timezone)}
                </MetaRow>
                <MetaRow icon={<Clock className="h-4 w-4" />} label="Time">
                  {formatTime(event.startsAt, event.timezone)} – {formatTime(event.endsAt, event.timezone)}
                  <span className="block text-xs text-gray-400">{event.timezone}</span>
                </MetaRow>
                {event.eventFormat === 'ONLINE' ? (
                  <MetaRow icon={<Globe className="h-4 w-4" />} label="Location">
                    Online event
                  </MetaRow>
                ) : (
                  <MetaRow icon={<MapPin className="h-4 w-4" />} label="Venue">
                    <span className="font-medium text-gray-900">{event.venueName}</span>
                    <span className="block text-xs text-gray-500">
                      {event.venueAddress}, {event.venueCity}
                    </span>
                  </MetaRow>
                )}
                <MetaRow icon={<Users className="h-4 w-4" />} label="Capacity">
                  {event.capacity} attendees
                </MetaRow>
              </div>

              {activeTypes.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-gray-400">
                    Registration types
                  </p>
                  <ul className="space-y-2">
                    {activeTypes.map((t) => (
                      <li key={t.id} className="flex items-start justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                        <div>
                          <p className="text-[13px] font-medium text-gray-900">{t.name}</p>
                          {t.description && <p className="text-[12px] text-gray-500">{t.description}</p>}
                        </div>
                        <Badge className="bg-white text-gray-500 ring-gray-200">{t.capacity} seats</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-gray-100 p-5">
                {cancelled ? (
                  <Button disabled className="w-full" size="lg">
                    Registration closed
                  </Button>
                ) : !isAuthenticated ? (
                  <>
                    <Button onClick={onRegister} className="w-full" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      Sign in to register
                    </Button>
                    <p className="mt-2.5 text-center text-[12px] text-gray-400">
                      New here?{' '}
                      <Link to="/signup" className="font-medium text-brand hover:underline">
                        Create an account
                      </Link>
                    </p>
                  </>
                ) : isAttendee ? (
                  <Button onClick={onRegister} className="w-full" size="lg" leftIcon={<Ticket className="h-4 w-4" />}>
                    Register for this event
                  </Button>
                ) : (
                  <div className="rounded-xl bg-gray-50 px-4 py-3 text-center text-[13px] text-gray-500">
                    <Building2 className="mx-auto mb-1.5 h-4 w-4 text-gray-400" />
                    You're signed in as an organizer. Switch to an attendee account to register.
                  </div>
                )}
              </div>
            </Card>

            <div className="mt-4 text-center">
              <ButtonLink to={`/events/${eventId}/survey`} variant="ghost" size="sm">
                Took part already? Leave feedback
              </ButtonLink>
            </div>

            <p className="mt-3 text-center text-[11px] text-gray-400">
              Updated {formatDateTime(event.updatedAt)}
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        {icon}
      </span>
      <div className="text-[13px] text-gray-600">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}
