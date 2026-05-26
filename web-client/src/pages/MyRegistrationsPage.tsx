import { useEffect, useState } from 'react';
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView';
import { ApiClientError, api } from '../services/api';
import { formatDate } from '../services/format';
import type { Registration } from '../services/types';
import { useAuth } from '../state/AuthContext';

export function MyRegistrationsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticketCode, setTicketCode] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }
    let active = true;
    api.listMyRegistrations(user.accessToken)
      .then(data => active && setRegistrations(data))
      .catch(err => active && setError(messageFor(err, 'Could not load registrations')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  async function cancel(registrationId: string) {
    if (!user) {
      return;
    }
    setError('');
    try {
      const updated = await api.cancelRegistration(registrationId, user.accessToken);
      setRegistrations(current => current.map(registration =>
        registration.registrationId === registrationId ? updated : registration
      ));
    } catch (err) {
      setError(messageFor(err, 'Cancellation failed'));
    }
  }

  async function viewTicket(registrationId: string) {
    if (!user) {
      return;
    }
    setError('');
    try {
      const ticket = await api.issueTicket(registrationId, user.accessToken);
      setTicketCode(ticket.ticketCode);
    } catch (err) {
      setError(messageFor(err, 'Ticket failed'));
    }
  }

  if (loading) {
    return <LoadingView label="Loading registrations" />;
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>My registrations</h1>
          <p>Your reserved seats.</p>
        </div>
      </div>
      {error && <ErrorView message={error} />}
      {ticketCode && <p className="success-text">Ticket code: {ticketCode}</p>}
      {registrations.length === 0 ? (
        <EmptyView title="No registrations" detail="Reserved seats will appear here." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(registration => (
                <tr key={registration.registrationId}>
                  <td>{registration.eventTitle}</td>
                  <td>{formatDate(registration.startsAt)}</td>
                  <td><span className={`status-pill ${registration.status.toLowerCase()}`}>{registration.status}</span></td>
                  <td className="row-actions">
                    {registration.status === 'CONFIRMED' && (
                      <>
                        <button className="button secondary" type="button" onClick={() => viewTicket(registration.registrationId)}>
                          View ticket
                        </button>
                        <button className="button danger" type="button" onClick={() => cancel(registration.registrationId)}>
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback;
}
