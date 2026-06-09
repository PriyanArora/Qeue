import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Ticket,
  Armchair,
  ClipboardList,
  CalendarRange,
  MessageSquareText,
  ChevronRight,
  Mic2,
} from 'lucide-react';
import { organizerApi } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import { useEventContext } from '../EventManageLayout';
import { eventFormatLabel, formatDateTime } from '../../../lib/format';
import { Card } from '../../../components/ui/Card';
import { Stat } from '../../../components/ui/Stat';
import { EventBanner } from '../../../components/events/EventBanner';

export function OverviewTab() {
  const { event } = useEventContext();
  const { data: analytics } = useApi((s) => organizerApi.analytics(event.id, s), [event.id]);
  const { data: types } = useApi((s) => organizerApi.types(event.id, s), [event.id]);
  const { data: questions } = useApi((s) => organizerApi.questions(event.id, s), [event.id]);
  const { data: speakers } = useApi((s) => organizerApi.speakers(event.id, s), [event.id]);
  const { data: sessions } = useApi((s) => organizerApi.sessions(event.id, s), [event.id]);
  const { data: surveys } = useApi((s) => organizerApi.surveys(event.id, s), [event.id]);

  const checklist = [
    { label: 'Registration types', count: types?.length ?? 0, to: 'registration', icon: ClipboardList },
    { label: 'Registration questions', count: questions?.length ?? 0, to: 'registration', icon: ClipboardList },
    { label: 'Speakers', count: speakers?.length ?? 0, to: 'agenda', icon: Mic2 },
    { label: 'Agenda sessions', count: sessions?.length ?? 0, to: 'agenda', icon: CalendarRange },
    { label: 'Surveys', count: surveys?.length ?? 0, to: 'surveys', icon: MessageSquareText },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Confirmed" value={analytics?.confirmedRegistrations ?? '—'} icon={<Users className="h-4 w-4" />} accent="brand" />
          <Stat label="Seats left" value={analytics?.availableSeats ?? '—'} icon={<Armchair className="h-4 w-4" />} accent="sky" />
          <Stat label="Checked in" value={analytics?.checkIns ?? '—'} icon={<CheckCircle2 className="h-4 w-4" />} accent="emerald" />
          <Stat label="No-shows" value={analytics?.noShows ?? '—'} icon={<Ticket className="h-4 w-4" />} accent="amber" />
        </div>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900">Setup checklist</h2>
          <p className="mt-1 text-[13px] text-gray-500">Build out your event before publishing.</p>
          <ul className="mt-4 divide-y divide-gray-100">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link to={c.to} className="group flex items-center justify-between py-3">
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-brand-soft group-hover:text-brand">
                      <c.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-gray-800">{c.label}</span>
                  </span>
                  <span className="flex items-center gap-2 text-[13px] text-gray-400">
                    <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${c.count > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {c.count}
                    </span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="h-32">
            <EventBanner event={event} rounded="rounded-none" />
          </div>
          <div className="space-y-3 p-5 text-[13px]">
            <Row label="Format">{eventFormatLabel[event.eventFormat]}</Row>
            <Row label="Category">{event.category}</Row>
            <Row label="Capacity">{event.capacity}</Row>
            <Row label="Venue">
              {event.eventFormat === 'ONLINE' ? 'Online' : `${event.venueName}, ${event.venueCity}`}
            </Row>
            <Row label="Created">{formatDateTime(event.createdAt)}</Row>
            <Row label="Updated">{formatDateTime(event.updatedAt)}</Row>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="text-right font-medium text-gray-800">{children}</span>
    </div>
  );
}
