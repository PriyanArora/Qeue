import { useEffect, useState } from 'react';
import { EventCard } from '../components/EventCard';
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView';
import { ApiClientError, api } from '../services/api';
import type { EventSummary } from '../services/types';

export function EventListPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.listEvents()
      .then(data => {
        if (active) {
          setEvents(data);
          setError('');
        }
      })
      .catch(err => active && setError(messageFor(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingView label="Loading events" />;
  }

  if (error) {
    return <ErrorView message={error} />;
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>Published events</h1>
          <p>Browse upcoming events.</p>
        </div>
      </div>
      {events.length === 0 ? (
        <EmptyView title="No published events" detail="Check back after an organizer publishes an event." />
      ) : (
        <div className="event-grid">
          {events.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </section>
  );
}

function messageFor(error: unknown) {
  return error instanceof ApiClientError ? error.message : 'Could not load events';
}
