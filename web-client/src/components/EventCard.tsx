import { Link } from 'react-router-dom';
import type { EventSummary } from '../services/types';
import { formatDateRange } from '../services/format';

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <article className="event-card">
      <div>
        <span className={`status-pill ${event.status.toLowerCase()}`}>{event.status}</span>
        <h2>{event.title}</h2>
      </div>
      <p>{event.venueName}, {event.venueCity}</p>
      <p>{formatDateRange(event.startsAt, event.endsAt)}</p>
      <div className="card-footer">
        <span>{event.capacity} seats</span>
        <Link className="button secondary" to={`/events/${event.id}`}>View</Link>
      </div>
    </article>
  );
}
