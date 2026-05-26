import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EventForm } from '../components/EventForm';
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView';
import { ApiClientError, api } from '../services/api';
import { formatDate, toDateTimeLocal } from '../services/format';
import type {
  Analytics,
  EventDetail,
  EventFormValues,
  EventSummary,
  Registration,
  RegistrationQuestion,
  RegistrationType,
  Session,
  Speaker,
  Survey,
  SurveySubmission
} from '../services/types';
import { useAuth } from '../state/AuthContext';

export function OrganizerEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }
    let active = true;
    api.listOrganizerEvents(user.accessToken)
      .then(data => active && setEvents(data))
      .catch(err => active && setError(messageFor(err, 'Could not load organizer events')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  async function publish(eventId: string) {
    if (!user) {
      return;
    }
    setError('');
    try {
      const updated = await api.publishEvent(eventId, user.accessToken);
      setEvents(current => current.map(event => event.id === eventId ? updated : event));
    } catch (err) {
      setError(messageFor(err, 'Publish failed'));
    }
  }

  async function cancel(eventId: string) {
    if (!user) {
      return;
    }
    setError('');
    try {
      const updated = await api.cancelEvent(eventId, user.accessToken);
      setEvents(current => current.map(event => event.id === eventId ? updated : event));
    } catch (err) {
      setError(messageFor(err, 'Cancel failed'));
    }
  }

  if (loading) {
    return <LoadingView label="Loading organizer events" />;
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>Organizer events</h1>
          <p>Manage event setup, attendees, and onsite operations.</p>
        </div>
        <Link className="button" to="/organizer/events/new">New event</Link>
      </div>
      {error && <ErrorView message={error} />}
      {events.length === 0 ? (
        <EmptyView title="No organizer events" detail="Create a draft to get started." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Status</th>
                <th>Date</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td><span className={`status-pill ${event.status.toLowerCase()}`}>{event.status}</span></td>
                  <td>{formatDate(event.startsAt)}</td>
                  <td>{event.capacity}</td>
                  <td className="row-actions">
                    {event.status === 'DRAFT' && <Link className="button secondary" to={`/organizer/events/${event.id}/edit`}>Edit</Link>}
                    {event.status === 'DRAFT' && <button className="button secondary" type="button" onClick={() => publish(event.id)}>Publish</button>}
                    <Link className="button secondary" to={`/organizer/events/${event.id}/attendees`}>Attendees</Link>
                    <Link className="button secondary" to={`/organizer/events/${event.id}/analytics`}>Analytics</Link>
                    <Link className="button secondary" to={`/organizer/events/${event.id}/check-in`}>Check-in</Link>
                    <Link className="button secondary" to={`/organizer/events/${event.id}/speakers`}>Speakers</Link>
                    <Link className="button secondary" to={`/organizer/events/${event.id}/sessions`}>Sessions</Link>
                    <Link className="button secondary" to={`/organizer/events/${event.id}/surveys`}>Surveys</Link>
                    {event.status !== 'CANCELLED' && <button className="button danger" type="button" onClick={() => cancel(event.id)}>Cancel</button>}
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

export function NewEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function create(values: EventFormValues) {
    if (!user) {
      return;
    }
    setError('');
    try {
      const event = await api.createEvent(values, user.accessToken);
      navigate(`/organizer/events/${event.id}/edit`);
    } catch (err) {
      setError(messageFor(err, 'Create event failed'));
    }
  }

  return (
    <section className="narrow-panel wide">
      <h1>New event</h1>
      <EventForm initialValues={defaultEventValues()} submitLabel="Create draft" error={error} onSubmit={create} />
    </section>
  );
}

export function EditEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !eventId) {
      return;
    }
    let active = true;
    api.getOrganizerEvent(eventId, user.accessToken)
      .then(data => active && setEvent(data))
      .catch(err => active && setError(messageFor(err, 'Could not load event')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [eventId, user]);

  async function update(values: EventFormValues) {
    if (!user || !event) {
      return;
    }
    setError('');
    try {
      const updated = await api.updateEvent(event.id, values, user.accessToken);
      setEvent(updated);
    } catch (err) {
      setError(messageFor(err, 'Update event failed'));
    }
  }

  async function publish() {
    if (!user || !event) {
      return;
    }
    setError('');
    try {
      await api.publishEvent(event.id, user.accessToken);
      navigate('/organizer/events');
    } catch (err) {
      setError(messageFor(err, 'Publish failed'));
    }
  }

  if (loading) {
    return <LoadingView label="Loading event" />;
  }

  if (!event) {
    return <ErrorView message={error || 'Event not found'} />;
  }

  return (
    <section className="stack">
      <div className="narrow-panel wide">
        <div className="page-title compact">
          <div>
            <h1>Edit event</h1>
            <p>{event.title}</p>
          </div>
          {event.status === 'DRAFT' && <button className="button secondary" type="button" onClick={publish}>Publish</button>}
        </div>
        {event.status !== 'DRAFT' ? (
          <ErrorView message="Only draft events can be edited." />
        ) : (
          <EventForm initialValues={toFormValues(event)} submitLabel="Save draft" error={error} onSubmit={update} />
        )}
      </div>
      <EventSetupPanels event={event} />
    </section>
  );
}

export function OrganizerAttendeesPage() {
  const { user } = useAuth();
  const { eventId } = useParams();
  const [attendees, setAttendees] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !eventId) {
      return;
    }
    let active = true;
    api.listAttendees(eventId, user.accessToken)
      .then(data => active && setAttendees(data))
      .catch(err => active && setError(messageFor(err, 'Could not load attendees')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [eventId, user]);

  async function exportCsv() {
    if (!user || !eventId) {
      return;
    }
    try {
      const blob = await api.exportAttendees(eventId, user.accessToken);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qeue-${eventId}-registrations.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(messageFor(err, 'Export failed'));
    }
  }

  if (loading) {
    return <LoadingView label="Loading attendees" />;
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>Attendees</h1>
          <p>Registrations and submitted answers.</p>
        </div>
        <button className="button" type="button" onClick={exportCsv}>Export CSV</button>
      </div>
      {error && <ErrorView message={error} />}
      {attendees.length === 0 ? (
        <EmptyView title="No attendees" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Check-in</th>
                <th>Registered</th>
                <th>Answers</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map(registration => (
                <tr key={registration.registrationId}>
                  <td>{registration.attendeeEmail}</td>
                  <td>{registration.registrationTypeNameSnapshot || 'General'}</td>
                  <td>{registration.status}</td>
                  <td>{registration.checkInStatus}</td>
                  <td>{formatDate(registration.createdAt)}</td>
                  <td>{registration.answers.map(answer => answer.answerText).join('; ') || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function CheckInPage() {
  const { user } = useAuth();
  const { eventId } = useParams();
  const [ticketCode, setTicketCode] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    if (!user || !eventId) {
      return;
    }
    setError('');
    setResult('');
    try {
      const checkedIn = await api.checkIn(eventId, ticketCode, user.accessToken);
      setResult(`${checkedIn.attendeeEmail} ${checkedIn.status}`);
      setTicketCode('');
    } catch (err) {
      setError(messageFor(err, 'Check-in failed'));
    }
  }

  return (
    <section className="narrow-panel">
      <h1>Check-in</h1>
      {error && <ErrorView message={error} />}
      {result && <p className="success-text">{result}</p>}
      <div className="form-grid">
        <label>
          Ticket code
          <input value={ticketCode} onChange={event => setTicketCode(event.target.value)} />
        </label>
        <button className="button" type="button" onClick={submit}>Check in</button>
      </div>
    </section>
  );
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const { eventId } = useParams();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !eventId) {
      return;
    }
    api.analytics(eventId, user.accessToken)
      .then(setAnalytics)
      .catch(err => setError(messageFor(err, 'Could not load analytics')));
  }, [eventId, user]);

  if (error) {
    return <ErrorView message={error} />;
  }
  if (!analytics) {
    return <LoadingView label="Loading analytics" />;
  }

  return (
    <section>
      <h1>Analytics</h1>
      <div className="metric-grid">
        <Metric label="Capacity" value={analytics.capacity} />
        <Metric label="Confirmed" value={analytics.confirmedRegistrations} />
        <Metric label="Cancelled" value={analytics.cancelledRegistrations} />
        <Metric label="Available" value={analytics.availableSeats} />
        <Metric label="Check-ins" value={analytics.checkIns} />
        <Metric label="No-shows" value={analytics.noShows} />
      </div>
      <h2>Registration types</h2>
      {analytics.registrationTypeBreakdown.length === 0 ? (
        <EmptyView title="No registration type data" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Type</th><th>Confirmed</th></tr></thead>
            <tbody>{analytics.registrationTypeBreakdown.map(row => <tr key={row.registrationTypeName}><td>{row.registrationTypeName}</td><td>{row.confirmedCount}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function SpeakersPage() {
  const { user } = useAuth();
  const { eventId } = useParams();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && eventId) {
      api.listOrganizerSpeakers(eventId, user.accessToken).then(setSpeakers).catch(err => setError(messageFor(err, 'Could not load speakers')));
    }
  }, [eventId, user]);

  async function create() {
    if (!user || !eventId || !name.trim()) {
      return;
    }
    try {
      const speaker = await api.createSpeaker(eventId, {
        name,
        title: 'Speaker',
        organization: 'Independent',
        bio: 'Bio pending',
        photoUrl: ''
      }, user.accessToken);
      setSpeakers(current => [...current, speaker]);
      setName('');
    } catch (err) {
      setError(messageFor(err, 'Create speaker failed'));
    }
  }

  return (
    <section className="stack">
      <h1>Speakers</h1>
      {error && <ErrorView message={error} />}
      <div className="form-grid inline-form">
        <input value={name} onChange={event => setName(event.target.value)} placeholder="Speaker name" />
        <button className="button" type="button" onClick={create}>Add speaker</button>
      </div>
      <SimpleList items={speakers.map(speaker => `${speaker.name} - ${speaker.organization}`)} empty="No speakers" />
    </section>
  );
}

export function SessionsPage() {
  const { user } = useAuth();
  const { eventId } = useParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && eventId) {
      api.listOrganizerSessions(eventId, user.accessToken).then(setSessions).catch(err => setError(messageFor(err, 'Could not load sessions')));
    }
  }, [eventId, user]);

  async function create() {
    if (!user || !eventId || !title.trim()) {
      return;
    }
    const startsAt = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    try {
      const session = await api.createSession(eventId, {
        title,
        description: 'Session details pending',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        roomName: 'Main room',
        capacity: 50,
        status: 'PUBLISHED',
        speakerIds: []
      }, user.accessToken);
      setSessions(current => [...current, session]);
      setTitle('');
    } catch (err) {
      setError(messageFor(err, 'Create session failed'));
    }
  }

  return (
    <section className="stack">
      <h1>Sessions</h1>
      {error && <ErrorView message={error} />}
      <div className="form-grid inline-form">
        <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Session title" />
        <button className="button" type="button" onClick={create}>Add session</button>
      </div>
      <SimpleList items={sessions.map(session => `${session.title} - ${formatDate(session.startsAt)}`)} empty="No sessions" />
    </section>
  );
}

export function SurveysPage() {
  const { user } = useAuth();
  const { eventId } = useParams();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<SurveySubmission[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && eventId) {
      api.listOrganizerSurveys(eventId, user.accessToken).then(setSurveys).catch(err => setError(messageFor(err, 'Could not load surveys')));
    }
  }, [eventId, user]);

  async function create() {
    if (!user || !eventId || !title.trim()) {
      return;
    }
    try {
      const survey = await api.createSurvey(eventId, {
        title,
        status: 'ACTIVE',
        questions: [{ questionText: 'How was the event?', questionType: 'TEXT', required: true, sortOrder: 1 }]
      }, user.accessToken);
      setSurveys(current => [survey, ...current]);
      setTitle('');
    } catch (err) {
      setError(messageFor(err, 'Create survey failed'));
    }
  }

  async function loadResponses(surveyId: string) {
    if (!user || !eventId) {
      return;
    }
    try {
      setResponses(await api.listSurveyResponses(eventId, surveyId, user.accessToken));
    } catch (err) {
      setError(messageFor(err, 'Could not load responses'));
    }
  }

  return (
    <section className="stack">
      <h1>Surveys</h1>
      {error && <ErrorView message={error} />}
      <div className="form-grid inline-form">
        <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Survey title" />
        <button className="button" type="button" onClick={create}>Add survey</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Survey</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{surveys.map(survey => <tr key={survey.id}><td>{survey.title}</td><td>{survey.status}</td><td><button className="button secondary" type="button" onClick={() => loadResponses(survey.id)}>Responses</button></td></tr>)}</tbody>
        </table>
      </div>
      <SimpleList items={responses.map(response => `${response.attendeeId} - ${formatDate(response.submittedAt)}`)} empty="No loaded responses" />
    </section>
  );
}

function EventSetupPanels({ event }: { event: EventDetail }) {
  return (
    <div className="setup-grid">
      <QuestionsPanel event={event} />
      <TypesPanel event={event} />
    </div>
  );
}

function QuestionsPanel({ event }: { event: EventDetail }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<RegistrationQuestion[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      api.listOrganizerQuestions(event.id, user.accessToken).then(setQuestions).catch(err => setError(messageFor(err, 'Could not load questions')));
    }
  }, [event.id, user]);

  async function add() {
    if (!user || !text.trim()) {
      return;
    }
    try {
      const question = await api.createQuestion(event.id, {
        questionText: text,
        questionType: 'TEXT',
        required: false,
        sortOrder: questions.length + 1,
        active: true
      }, user.accessToken);
      setQuestions(current => [...current, question]);
      setText('');
    } catch (err) {
      setError(messageFor(err, 'Create question failed'));
    }
  }

  return (
    <section className="narrow-panel wide">
      <h2>Registration questions</h2>
      {error && <ErrorView message={error} />}
      <div className="form-grid inline-form">
        <input value={text} onChange={event => setText(event.target.value)} placeholder="Question text" />
        <button className="button" type="button" onClick={add}>Add</button>
      </div>
      <SimpleList items={questions.map(question => question.questionText)} empty="No questions" />
    </section>
  );
}

function TypesPanel({ event }: { event: EventDetail }) {
  const { user } = useAuth();
  const [types, setTypes] = useState<RegistrationType[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      api.listOrganizerTypes(event.id, user.accessToken).then(setTypes).catch(err => setError(messageFor(err, 'Could not load registration types')));
    }
  }, [event.id, user]);

  async function add() {
    if (!user || !name.trim()) {
      return;
    }
    try {
      const type = await api.createType(event.id, {
        name,
        description: `${name} registration`,
        capacity: event.capacity,
        active: true,
        sortOrder: types.length + 1
      }, user.accessToken);
      setTypes(current => [...current, type]);
      setName('');
    } catch (err) {
      setError(messageFor(err, 'Create type failed'));
    }
  }

  return (
    <section className="narrow-panel wide">
      <h2>Registration types</h2>
      {error && <ErrorView message={error} />}
      <div className="form-grid inline-form">
        <input value={name} onChange={event => setName(event.target.value)} placeholder="Type name" />
        <button className="button" type="button" onClick={add}>Add</button>
      </div>
      <SimpleList items={types.map(type => `${type.name} (${type.capacity})`)} empty="No registration types" />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SimpleList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <EmptyView title={empty} />;
  }
  return (
    <ul className="plain-list">
      {items.map(item => <li key={item}>{item}</li>)}
    </ul>
  );
}

function defaultEventValues(): EventFormValues {
  const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
  return {
    title: '',
    description: '',
    eventFormat: 'IN_PERSON',
    category: 'Technology',
    bannerImageUrl: '',
    venueName: '',
    venueCity: '',
    venueAddress: '',
    timezone: 'UTC',
    startsAt: toDateTimeLocal(startsAt.toISOString()),
    endsAt: toDateTimeLocal(endsAt.toISOString()),
    capacity: 25
  };
}

function toFormValues(event: EventDetail): EventFormValues {
  return {
    title: event.title,
    description: event.description,
    eventFormat: event.eventFormat,
    category: event.category,
    bannerImageUrl: event.bannerImageUrl || '',
    venueName: event.venueName,
    venueCity: event.venueCity,
    venueAddress: event.venueAddress,
    timezone: event.timezone,
    startsAt: toDateTimeLocal(event.startsAt),
    endsAt: toDateTimeLocal(event.endsAt),
    capacity: event.capacity
  };
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback;
}
