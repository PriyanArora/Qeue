import { useState } from 'react';
import {
  NavLink,
  Outlet,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import {
  LayoutDashboard,
  Settings2,
  ClipboardList,
  CalendarRange,
  Users,
  ScanLine,
  BarChart3,
  MessageSquareText,
  ExternalLink,
  Send,
  Ban,
} from 'lucide-react';
import { organizerApi, ApiError } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';
import type { EventDetail } from '../../lib/types';
import { eventFormatLabel, eventStatusMeta, formatDate, formatTime } from '../../lib/format';
import { Container, Breadcrumbs } from '../../components/layout/Page';
import { Button, ButtonLink } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { LoadingBlock, ErrorState } from '../../components/ui/States';

export interface EventContext {
  event: EventDetail;
  reload: () => void;
}

export function useEventContext() {
  return useOutletContext<EventContext>();
}

const TABS = [
  { to: '.', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: 'details', label: 'Details', icon: Settings2 },
  { to: 'registration', label: 'Registration', icon: ClipboardList },
  { to: 'agenda', label: 'Agenda', icon: CalendarRange },
  { to: 'attendees', label: 'Attendees', icon: Users },
  { to: 'check-in', label: 'Check-in', icon: ScanLine },
  { to: 'analytics', label: 'Analytics', icon: BarChart3 },
  { to: 'surveys', label: 'Surveys', icon: MessageSquareText },
];

export function EventManageLayout() {
  const { eventId = '' } = useParams();
  const toast = useToast();
  const { data: event, loading, error, reload } = useApi(
    (s) => organizerApi.getEvent(eventId, s),
    [eventId],
  );
  const [publishOpen, setPublishOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (loading) return <LoadingBlock label="Loading event…" />;
  if (error || !event)
    return (
      <Container className="py-16">
        <ErrorState message={error ?? 'Event not found.'} onRetry={reload} />
      </Container>
    );

  const publish = async () => {
    try {
      await organizerApi.publish(eventId);
      toast.success('Event published — it’s now public.');
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not publish.');
    }
  };
  const cancelEvent = async () => {
    try {
      await organizerApi.cancel(eventId);
      toast.success('Event cancelled.');
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not cancel.');
    }
  };

  return (
    <div className="bg-[#F5F5F5] pb-16">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <Container className="pt-8">
          <Breadcrumbs items={[{ label: 'Organizer', to: '/organizer' }, { label: event.title }]} />
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusBadge meta={eventStatusMeta[event.status]} />
                <span className="text-[12px] font-medium text-gray-400">
                  {eventFormatLabel[event.eventFormat]} · {event.category}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{event.title}</h1>
              <p className="mt-1 text-[13px] text-gray-500">
                {formatDate(event.startsAt, event.timezone)} · {formatTime(event.startsAt, event.timezone)}–
                {formatTime(event.endsAt, event.timezone)} · {event.timezone}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {event.status === 'PUBLISHED' && (
                <ButtonLink
                  to={`/events/${event.id}`}
                  variant="outline"
                  size="sm"
                  rightIcon={<ExternalLink className="h-4 w-4" />}
                >
                  View public page
                </ButtonLink>
              )}
              {event.status === 'DRAFT' && (
                <Button size="sm" onClick={() => setPublishOpen(true)} leftIcon={<Send className="h-4 w-4" />}>
                  Publish
                </Button>
              )}
              {event.status !== 'CANCELLED' && (
                <Button size="sm" variant="danger" onClick={() => setCancelOpen(true)} leftIcon={<Ban className="h-4 w-4" />}>
                  Cancel event
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <nav className="no-scrollbar -mb-px flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <NavLink
                key={t.label}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'border-brand text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`
                }
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </NavLink>
            ))}
          </nav>
        </Container>
      </div>

      <Container className="pt-8">
        <Outlet context={{ event, reload } satisfies EventContext} />
      </Container>

      <ConfirmDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onConfirm={publish}
        title="Publish this event?"
        message="Publishing makes the event public and opens registration. You can still edit details afterward."
        confirmLabel="Publish event"
      />
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelEvent}
        title="Cancel this event?"
        message="Cancelling closes registration and marks the event as cancelled for everyone. This cannot be undone."
        confirmLabel="Cancel event"
        destructive
      />
    </div>
  );
}
