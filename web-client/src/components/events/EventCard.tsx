import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import type { EventSummary } from '../../lib/types';
import { dateParts, eventFormatLabel, formatTime } from '../../lib/format';
import { EventBanner } from './EventBanner';

export function EventCard({ event }: { event: EventSummary }) {
  const { month, day } = dateParts(event.startsAt, event.timezone);
  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <EventBanner event={event} rounded="rounded-none" className="transition-transform duration-500 group-hover:scale-[1.04]" />
        <div className="absolute left-3 top-3 flex flex-col items-center rounded-xl bg-white/95 px-2.5 py-1.5 text-center shadow-sm backdrop-blur">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand">{month}</span>
          <span className="text-base font-bold leading-none text-gray-900">{day}</span>
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-gray-900/80 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
          {eventFormatLabel[event.eventFormat]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-brand">{event.category}</p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-gray-900">
          {event.title}
        </h3>
        <div className="mt-3 flex flex-col gap-1.5 text-[13px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {formatTime(event.startsAt, event.timezone)} · {event.timezone.split('/').pop()?.replace('_', ' ')}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate">
              {event.eventFormat === 'ONLINE' ? 'Online event' : `${event.venueName}, ${event.venueCity}`}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {event.capacity} capacity
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
      <div className="skeleton aspect-[16/10]" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}
