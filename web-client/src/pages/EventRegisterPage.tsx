import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Ticket } from 'lucide-react';
import { eventsApi, registrationsApi, ApiError } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/ui/Toast';
import { formatDate, formatTime, idempotencyKey } from '../lib/format';
import type { RegistrationAnswer } from '../lib/types';
import { Container, PageHeader } from '../components/layout/Page';
import { Card } from '../components/ui/Card';
import { Button, ButtonLink } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { QuestionField } from '../components/events/QuestionField';
import { LoadingBlock, ErrorState } from '../components/ui/States';

export function EventRegisterPage() {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: event, loading, error, reload } = useApi((s) => eventsApi.get(eventId, s), [eventId]);
  const { data: types } = useApi((s) => eventsApi.types(eventId, s), [eventId]);
  const { data: questions } = useApi((s) => eventsApi.questions(eventId, s), [eventId]);

  const activeTypes = useMemo(
    () => (types ?? []).filter((t) => t.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [types],
  );
  const activeQuestions = useMemo(
    () => (questions ?? []).filter((q) => q.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [questions],
  );

  const [typeId, setTypeId] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ registrationId: string } | null>(null);

  if (loading) return <LoadingBlock label="Loading registration…" />;
  if (error || !event)
    return (
      <Container className="py-16">
        <ErrorState message={error ?? 'Event not found.'} onRetry={reload} />
      </Container>
    );

  if (event.status === 'CANCELLED') {
    return (
      <Container size="md" className="py-16">
        <ErrorState message="This event has been cancelled and is no longer accepting registrations." />
        <div className="mt-4 text-center">
          <ButtonLink to={`/events/${eventId}`} variant="outline">Back to event</ButtonLink>
        </div>
      </Container>
    );
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (activeTypes.length > 0 && !typeId) errs.type = 'Please choose a registration type.';
    for (const q of activeQuestions) {
      if (q.required && !(answers[q.id] ?? '').trim()) {
        errs[q.id] = 'This question is required.';
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const answerList: RegistrationAnswer[] = activeQuestions
        .filter((q) => (answers[q.id] ?? '').trim())
        .map((q) => ({ questionId: q.id, answerText: answers[q.id].trim() }));

      const reg = await registrationsApi.register(eventId, {
        idempotencyKey: idempotencyKey(),
        registrationTypeId: typeId || null,
        answers: answerList,
      });
      setDone({ registrationId: reg.registrationId });
      toast.success("You're registered! Your ticket is ready.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not complete registration.';
      toast.error(message);
      if (err instanceof ApiError && err.fields) setFieldErrors(err.fields);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Container size="md" className="py-16">
        <Card className="mx-auto max-w-md p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-gray-900">You're registered!</h1>
          <p className="mt-2 text-sm text-gray-500">
            You're confirmed for <span className="font-medium text-gray-700">{event.title}</span>.
            Your ticket is available in your tickets.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <ButtonLink to="/my/registrations" leftIcon={<Ticket className="h-4 w-4" />}>
              View my tickets
            </ButtonLink>
            <ButtonLink to={`/events/${eventId}`} variant="ghost">
              Back to event
            </ButtonLink>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <div className="bg-[#F5F5F5] py-10 sm:py-14">
      <Container size="md">
        <PageHeader
          breadcrumbs={[
            { label: 'Events', to: '/events' },
            { label: event.title, to: `/events/${eventId}` },
            { label: 'Register' },
          ]}
          title="Complete your registration"
          description={`${formatDate(event.startsAt, event.timezone)} · ${formatTime(event.startsAt, event.timezone)}`}
        />

        <form onSubmit={submit} className="grid grid-cols-1 gap-6">
          {activeTypes.length > 0 && (
            <Card className="p-6">
              <Field label="Registration type" required error={fieldErrors.type}>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {activeTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTypeId(t.id)}
                      className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                        typeId === t.id
                          ? 'border-brand bg-brand-soft ring-2 ring-brand/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="text-sm font-semibold text-gray-900">{t.name}</span>
                      {t.description && <span className="mt-0.5 text-[12px] text-gray-500">{t.description}</span>}
                      <span className="mt-2 text-[11px] font-medium text-gray-400">{t.capacity} seats</span>
                    </button>
                  ))}
                </div>
              </Field>
            </Card>
          )}

          {activeQuestions.length > 0 && (
            <Card className="space-y-5 p-6">
              <h2 className="text-base font-semibold text-gray-900">A few questions</h2>
              {activeQuestions.map((q) => (
                <QuestionField
                  key={q.id}
                  id={`q-${q.id}`}
                  label={q.questionText}
                  type={q.questionType}
                  required={q.required}
                  value={answers[q.id] ?? ''}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                  error={fieldErrors[q.id]}
                />
              ))}
            </Card>
          )}

          <div className="flex items-center justify-between gap-4">
            <Link to={`/events/${eventId}`} className="text-sm text-gray-500 hover:text-gray-900">
              Cancel
            </Link>
            <Button type="submit" size="lg" loading={submitting} leftIcon={<Ticket className="h-4 w-4" />}>
              Confirm registration
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}
