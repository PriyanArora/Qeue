import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, MessageSquareText } from 'lucide-react';
import { eventsApi, registrationsApi, ApiError } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/ui/Toast';
import type { SurveyAnswer } from '../lib/types';
import { Container, PageHeader } from '../components/layout/Page';
import { Card } from '../components/ui/Card';
import { Button, ButtonLink } from '../components/ui/Button';
import { QuestionField } from '../components/events/QuestionField';
import { LoadingBlock, EmptyState } from '../components/ui/States';

export function EventSurveyPage() {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, isAttendee } = useAuth();

  const { data: survey, loading, error } = useApi((s) => eventsApi.activeSurvey(eventId, s), [eventId]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (loading) return <LoadingBlock label="Loading survey…" />;

  if (error || !survey) {
    return (
      <Container size="md" className="py-16">
        <EmptyState
          icon={<MessageSquareText className="h-6 w-6" />}
          title="No active survey"
          description="There isn't an open survey for this event right now. Check back after the event."
          action={<ButtonLink to={`/events/${eventId}`} size="sm" variant="outline">Back to event</ButtonLink>}
        />
      </Container>
    );
  }

  const questions = survey.questions.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !isAttendee) {
      navigate('/login', { state: { from: `/events/${eventId}/survey` } });
      return;
    }
    const errs: Record<string, string> = {};
    for (const q of questions) {
      if (q.required && !(answers[q.id] ?? '').trim()) errs[q.id] = 'This question is required.';
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const answerList: SurveyAnswer[] = questions
        .filter((q) => (answers[q.id] ?? '').trim())
        .map((q) => {
          const raw = answers[q.id].trim();
          return q.questionType === 'RATING_1_TO_5'
            ? { questionId: q.id, ratingValue: Number(raw) }
            : { questionId: q.id, answerText: raw };
        });
      await registrationsApi.submitSurvey(eventId, survey.id, { answers: answerList });
      setDone(true);
      toast.success('Thanks for your feedback!');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not submit your response.');
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
          <h1 className="mt-5 text-xl font-semibold text-gray-900">Thank you!</h1>
          <p className="mt-2 text-sm text-gray-500">Your feedback has been recorded.</p>
          <div className="mt-6">
            <ButtonLink to={`/events/${eventId}`} variant="outline">Back to event</ButtonLink>
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
            { label: 'Event', to: `/events/${eventId}` },
            { label: 'Survey' },
          ]}
          eyebrow="Feedback"
          title={survey.title}
          description="Help the organizer improve future events — it only takes a minute."
        />
        <form onSubmit={submit}>
          <Card className="space-y-6 p-6">
            {questions.map((q) => (
              <QuestionField
                key={q.id}
                id={`sq-${q.id}`}
                label={q.questionText}
                type={q.questionType}
                required={q.required}
                value={answers[q.id] ?? ''}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                error={fieldErrors[q.id]}
              />
            ))}
          </Card>
          <div className="mt-5 flex justify-end">
            <Button type="submit" size="lg" loading={submitting}>
              {isAuthenticated ? 'Submit feedback' : 'Sign in to submit'}
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}
