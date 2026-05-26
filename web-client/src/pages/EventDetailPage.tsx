import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView';
import { ApiClientError, api } from '../services/api';
import { formatDateRange } from '../services/format';
import type { EventDetail, RegistrationAnswer, RegistrationQuestion, RegistrationType, Session, Survey, SurveyAnswer } from '../services/types';
import { useAuth } from '../state/AuthContext';

export function EventDetailPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [questions, setQuestions] = useState<RegistrationQuestion[]>([]);
  const [types, setTypes] = useState<RegistrationType[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reserveState, setReserveState] = useState('');
  const [surveyState, setSurveyState] = useState('');
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setError('Event not found');
      setLoading(false);
      return;
    }
    let active = true;
    Promise.all([
      api.getEvent(eventId),
      api.listPublicQuestions(eventId).catch(() => []),
      api.listPublicTypes(eventId).catch(() => []),
      api.listPublicSessions(eventId).catch(() => []),
      api.getActiveSurvey(eventId).catch(() => null)
    ])
      .then(([eventData, questionData, typeData, sessionData, surveyData]) => {
        if (!active) {
          return;
        }
        setEvent(eventData);
        setQuestions(questionData);
        setTypes(typeData);
        setSessions(sessionData);
        setSurvey(surveyData);
        setSelectedTypeId(typeData[0]?.id ?? '');
        setError('');
      })
      .catch(err => active && setError(messageFor(err, 'Could not load event')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [eventId]);

  async function reserveSeat() {
    if (!event || !user || user.role !== 'ATTENDEE') {
      setReserveState('Attendee login is required to reserve a seat.');
      return;
    }
    for (const question of questions) {
      if (question.required && !answers[question.id]?.trim()) {
        setReserveState(`${question.questionText} is required.`);
        return;
      }
    }
    setReserving(true);
    setReserveState('');
    try {
      const answerPayload: RegistrationAnswer[] = questions
        .filter(question => answers[question.id] !== undefined)
        .map(question => ({ questionId: question.id, answerText: answers[question.id] ?? '' }));
      await api.reserveSeat(event.id, crypto.randomUUID(), user.accessToken, selectedTypeId || undefined, answerPayload);
      setReserveState('Seat reserved.');
    } catch (err) {
      setReserveState(messageFor(err, 'Reservation failed'));
    } finally {
      setReserving(false);
    }
  }

  async function submitSurvey() {
    if (!event || !survey || !user || user.role !== 'ATTENDEE') {
      setSurveyState('Attendee login is required to submit a survey.');
      return;
    }
    for (const question of survey.questions) {
      if (question.required && !surveyAnswers[question.id]?.trim()) {
        setSurveyState(`${question.questionText} is required.`);
        return;
      }
    }
    try {
      const payload: SurveyAnswer[] = survey.questions
        .filter(question => surveyAnswers[question.id] !== undefined)
        .map(question => ({ questionId: question.id, answerText: surveyAnswers[question.id] ?? '' }));
      await api.submitSurvey(event.id, survey.id, payload, user.accessToken);
      setSurveyState('Survey submitted.');
    } catch (err) {
      setSurveyState(messageFor(err, 'Survey submission failed'));
    }
  }

  if (loading) {
    return <LoadingView label="Loading event" />;
  }

  if (error) {
    return <ErrorView message={error} />;
  }

  if (!event) {
    return <EmptyView title="Event not found" />;
  }

  return (
    <section className="detail-layout">
      <article className="detail-main stack">
        {event.bannerImageUrl && <img className="event-banner" src={event.bannerImageUrl} alt="" />}
        <span className={`status-pill ${event.status.toLowerCase()}`}>{event.status}</span>
        <h1>{event.title}</h1>
        <p className="lead">{event.description}</p>
        <dl className="detail-list">
          <div>
            <dt>Venue</dt>
            <dd>{event.venueName}, {event.venueCity}<br />{event.venueAddress}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{formatDateRange(event.startsAt, event.endsAt)} ({event.timezone})</dd>
          </div>
          <div>
            <dt>Format</dt>
            <dd>{event.eventFormat} · {event.category}</dd>
          </div>
          <div>
            <dt>Capacity</dt>
            <dd>{event.capacity} seats</dd>
          </div>
        </dl>
        <section>
          <h2>Agenda</h2>
          {sessions.length === 0 ? <p className="muted">No sessions published.</p> : (
            <ul className="plain-list">
              {sessions.map(session => <li key={session.id}>{session.title} · {formatDateRange(session.startsAt, session.endsAt)} · {session.roomName}</li>)}
            </ul>
          )}
        </section>
        {survey && (
          <section className="narrow-panel wide">
            <h2>{survey.title}</h2>
            <div className="form-grid">
              {survey.questions.map(question => (
                <label key={question.id}>
                  {question.questionText}{question.required ? ' *' : ''}
                  <input value={surveyAnswers[question.id] ?? ''} onChange={event => setSurveyAnswers(current => ({ ...current, [question.id]: event.target.value }))} />
                </label>
              ))}
              <button className="button secondary" type="button" onClick={submitSurvey}>Submit survey</button>
              {surveyState && <p className={surveyState === 'Survey submitted.' ? 'success-text' : 'form-error'}>{surveyState}</p>}
            </div>
          </section>
        )}
      </article>
      <aside className="action-panel">
        {types.length > 0 && (
          <label>
            Registration type
            <select value={selectedTypeId} onChange={event => setSelectedTypeId(event.target.value)}>
              {types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </label>
        )}
        {questions.map(question => (
          <label key={question.id}>
            {question.questionText}{question.required ? ' *' : ''}
            {question.questionType === 'LONG_TEXT' ? (
              <textarea value={answers[question.id] ?? ''} onChange={event => setAnswers(current => ({ ...current, [question.id]: event.target.value }))} />
            ) : question.questionType === 'YES_NO' ? (
              <select value={answers[question.id] ?? ''} onChange={event => setAnswers(current => ({ ...current, [question.id]: event.target.value }))}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            ) : (
              <input value={answers[question.id] ?? ''} onChange={event => setAnswers(current => ({ ...current, [question.id]: event.target.value }))} />
            )}
          </label>
        ))}
        {user?.role === 'ATTENDEE' ? (
          <button className="button" type="button" onClick={reserveSeat} disabled={reserving}>
            {reserving ? 'Reserving' : 'Reserve seat'}
          </button>
        ) : user ? (
          <p className="muted">Organizer accounts cannot reserve seats.</p>
        ) : (
          <Link className="button" to="/login">Log in to reserve</Link>
        )}
        {reserveState && <p className={reserveState === 'Seat reserved.' ? 'success-text' : 'form-error'}>{reserveState}</p>}
      </aside>
    </section>
  );
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback;
}
