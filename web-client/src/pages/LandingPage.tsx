import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarPlus,
  ClipboardList,
  LayoutList,
  ListChecks,
  Mic2,
  ScanLine,
  Ticket,
  BarChart3,
  Bell,
} from 'lucide-react';
import { eventsApi } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { LandingHero } from '../components/landing/LandingHero';
import { Container } from '../components/layout/Page';
import { EventCard, EventCardSkeleton } from '../components/events/EventCard';
import { ButtonLink } from '../components/ui/Button';
import { EmptyState, ErrorState } from '../components/ui/States';

const FEATURES = [
  { icon: CalendarPlus, title: 'Event builder', desc: 'Format, category, banner, venue, timezone, schedule, capacity — with draft, publish, and cancel lifecycle.' },
  { icon: ClipboardList, title: 'Registration forms', desc: 'Custom questions and registration types with per-type capacity enforcement.' },
  { icon: Ticket, title: 'Tickets', desc: 'Every confirmed attendee gets a ticket with a securely hashed code.' },
  { icon: ScanLine, title: 'Check-in', desc: 'Scan or key in ticket codes at the door and track who actually showed up.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Capacity, confirmations, cancellations, check-ins, no-shows, and type breakdowns.' },
  { icon: ListChecks, title: 'Surveys', desc: 'Publish post-event surveys and collect attendee responses.' },
  { icon: Mic2, title: 'Speakers & agenda', desc: 'Add speakers and build a multi-session agenda mapped to rooms.' },
  { icon: Bell, title: 'Notifications', desc: 'Templated emails fire on registration and check-in events.' },
];

export function LandingPage() {
  const { data: events, loading, error, reload } = useApi(
    (signal) => eventsApi.listPublished(signal),
    [],
  );
  const upcoming = (events ?? [])
    .slice()
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
    .slice(0, 6);

  return (
    <>
      <LandingHero />

      {/* Upcoming events */}
      <section className="bg-[#F5F5F5] py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-brand">
                Happening soon
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                Upcoming events
              </h2>
            </div>
            <Link
              to="/events"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-900"
            >
              View all events
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : upcoming.length === 0 ? (
            <EmptyState
              title="No published events yet"
              description="Once organizers publish events, they'll appear here for everyone to browse."
              action={<ButtonLink to="/signup" size="sm">Become an organizer</ButtonLink>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Features */}
      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="max-w-2xl">
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-brand">
              One platform, end to end
            </p>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-[2rem]">
              Everything you need to run an event
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              From the first draft to the post-event survey, Qeue covers the whole lifecycle so you
              never duct-tape five tools together again.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-gray-100 bg-[#FAFAFA] p-5 transition-colors hover:border-gray-200 hover:bg-white"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white transition-colors group-hover:bg-brand">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Split audience CTA */}
      <section className="bg-[#F5F5F5] py-16 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <AudienceCard
              tone="dark"
              eyebrow="For organizers"
              title="Launch your next event in minutes"
              points={['Build & publish events', 'Manage attendees & check-in', 'Track live analytics']}
              cta={{ label: 'Start organizing', to: '/signup' }}
              icon={<LayoutList className="h-6 w-6" />}
            />
            <AudienceCard
              tone="light"
              eyebrow="For attendees"
              title="Find events and keep your tickets in one place"
              points={['Register in a few clicks', 'Access tickets anytime', 'Take post-event surveys']}
              cta={{ label: 'Browse events', to: '/events' }}
              icon={<Ticket className="h-6 w-6" />}
            />
          </div>
        </Container>
      </section>
    </>
  );
}

function AudienceCard({
  tone,
  eyebrow,
  title,
  points,
  cta,
  icon,
}: {
  tone: 'dark' | 'light';
  eyebrow: string;
  title: string;
  points: string[];
  cta: { label: string; to: string };
  icon: React.ReactNode;
}) {
  const dark = tone === 'dark';
  return (
    <div
      className={`flex flex-col justify-between gap-8 overflow-hidden rounded-3xl p-8 sm:p-10 ${
        dark ? 'bg-gray-900 text-white' : 'border border-gray-200 bg-white text-gray-900'
      }`}
    >
      <div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            dark ? 'bg-white/10 text-white' : 'bg-brand-soft text-brand'
          }`}
        >
          {icon}
        </div>
        <p className={`mt-5 text-[12px] font-semibold uppercase tracking-wide ${dark ? 'text-brand' : 'text-brand'}`}>
          {eyebrow}
        </p>
        <h3 className="mt-2 max-w-sm text-2xl font-semibold tracking-tight">{title}</h3>
        <ul className="mt-5 space-y-2">
          {points.map((p) => (
            <li key={p} className={`flex items-center gap-2.5 text-sm ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dark ? 'bg-brand' : 'bg-brand'}`} />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <ButtonLink to={cta.to} variant={dark ? 'primary' : 'dark'} className="w-fit" rightIcon={<ArrowRight className="h-4 w-4" />}>
        {cta.label}
      </ButtonLink>
    </div>
  );
}
