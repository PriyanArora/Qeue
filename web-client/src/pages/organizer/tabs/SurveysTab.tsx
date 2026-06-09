import { useState } from 'react';
import { Plus, Trash2, MessageSquareText, BarChart3, Star } from 'lucide-react';
import { organizerApi, ApiError } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import { useToast } from '../../../components/ui/Toast';
import type {
  QuestionType,
  Survey,
  SurveyQuestionRequest,
  SurveyStatus,
} from '../../../lib/types';
import { questionTypeLabel, surveyStatusMeta, formatDateTime } from '../../../lib/format';
import { useEventContext } from '../EventManageLayout';
import { Card, SectionHeading } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Field, Input, Select } from '../../../components/ui/Field';
import { LoadingBlock, ErrorState, EmptyState } from '../../../components/ui/States';

const QUESTION_TYPES: QuestionType[] = ['TEXT', 'LONG_TEXT', 'YES_NO', 'RATING_1_TO_5'];
const SURVEY_STATUSES: SurveyStatus[] = ['DRAFT', 'ACTIVE', 'CLOSED'];

export function SurveysTab() {
  const { event } = useEventContext();
  const { data, loading, error, reload } = useApi((s) => organizerApi.surveys(event.id, s), [event.id]);
  const [creating, setCreating] = useState(false);
  const [responsesFor, setResponsesFor] = useState<Survey | null>(null);

  return (
    <div>
      <SectionHeading
        title="Surveys"
        description="Collect post-event feedback. Only one survey should be ACTIVE at a time for the public page."
        action={<Button size="sm" onClick={() => setCreating(true)} leftIcon={<Plus className="h-4 w-4" />}>Create survey</Button>}
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={<MessageSquareText className="h-6 w-6" />}
          title="No surveys yet"
          description="Create a survey to gather feedback after your event."
          action={<Button size="sm" onClick={() => setCreating(true)}>Create your first survey</Button>}
        />
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((s) => (
            <Card key={s.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{s.title}</p>
                  <StatusBadge meta={surveyStatusMeta[s.status]} />
                </div>
                <p className="mt-1 text-[13px] text-gray-500">{s.questions.length} question(s)</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setResponsesFor(s)} leftIcon={<BarChart3 className="h-4 w-4" />}>
                View responses
              </Button>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <CreateSurveyModal eventId={event.id} onClose={() => setCreating(false)} onSaved={reload} />
      )}
      {responsesFor && (
        <ResponsesModal eventId={event.id} survey={responsesFor} onClose={() => setResponsesFor(null)} />
      )}
    </div>
  );
}

function CreateSurveyModal({
  eventId,
  onClose,
  onSaved,
}: {
  eventId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<SurveyStatus>('DRAFT');
  const [questions, setQuestions] = useState<SurveyQuestionRequest[]>([
    { questionText: '', questionType: 'RATING_1_TO_5', required: true, sortOrder: 0 },
  ]);
  const [busy, setBusy] = useState(false);

  const addQuestion = () =>
    setQuestions((q) => [...q, { questionText: '', questionType: 'TEXT', required: false, sortOrder: q.length }]);
  const removeQuestion = (i: number) =>
    setQuestions((q) => q.filter((_, idx) => idx !== i).map((x, idx) => ({ ...x, sortOrder: idx })));
  const update = (i: number, patch: Partial<SurveyQuestionRequest>) =>
    setQuestions((q) => q.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const save = async () => {
    if (!title.trim()) return toast.error('Survey title is required.');
    const cleaned = questions.filter((q) => q.questionText.trim());
    if (cleaned.length === 0) return toast.error('Add at least one question.');
    setBusy(true);
    try {
      await organizerApi.createSurvey(eventId, {
        title: title.trim(),
        status,
        questions: cleaned.map((q, i) => ({ ...q, questionText: q.questionText.trim(), sortOrder: i })),
      });
      toast.success('Survey created.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not create survey.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Create survey"
      description="Build a post-event feedback form."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} loading={busy}>Create survey</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="Survey title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post-event feedback" />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as SurveyStatus)}>
              {SURVEY_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-medium text-gray-700">Questions</p>
            <Button size="sm" variant="ghost" onClick={addQuestion} leftIcon={<Plus className="h-4 w-4" />}>Add question</Button>
          </div>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-3.5">
                <div className="flex items-start gap-2">
                  <span className="mt-2.5 text-[13px] font-semibold text-gray-400">{i + 1}</span>
                  <div className="flex-1 space-y-3">
                    <Input value={q.questionText} onChange={(e) => update(i, { questionText: e.target.value })} placeholder="How would you rate the event?" />
                    <div className="flex flex-wrap items-center gap-3">
                      <Select value={q.questionType} onChange={(e) => update(i, { questionType: e.target.value as QuestionType })} className="w-auto">
                        {QUESTION_TYPES.map((t) => (
                          <option key={t} value={t}>{questionTypeLabel[t]}</option>
                        ))}
                      </Select>
                      <label className="flex items-center gap-2 text-[13px] text-gray-600">
                        <input type="checkbox" checked={q.required} onChange={(e) => update(i, { required: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" />
                        Required
                      </label>
                    </div>
                  </div>
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(i)} className="mt-1 rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove question">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ResponsesModal({
  eventId,
  survey,
  onClose,
}: {
  eventId: string;
  survey: Survey;
  onClose: () => void;
}) {
  const { data, loading, error, reload } = useApi(
    (s) => organizerApi.surveyResponses(eventId, survey.id, s),
    [eventId, survey.id],
  );
  const questionText = (id: string) => survey.questions.find((q) => q.id === id)?.questionText ?? 'Question';
  const questionType = (id: string) => survey.questions.find((q) => q.id === id)?.questionType;

  return (
    <Modal open onClose={onClose} size="lg" title={survey.title} description={`${data?.length ?? 0} response(s)`}>
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={<MessageSquareText className="h-6 w-6" />} title="No responses yet" description="Responses will appear here once attendees submit the survey." />
      ) : (
        <div className="space-y-4">
          {(data ?? []).map((sub) => (
            <div key={sub.submissionId} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="mb-2.5 text-[12px] text-gray-400">Submitted {formatDateTime(sub.submittedAt)}</p>
              <ul className="space-y-2.5">
                {sub.answers.map((a, i) => (
                  <li key={i}>
                    <p className="text-[12px] font-medium text-gray-500">{questionText(a.questionId)}</p>
                    {questionType(a.questionId) === 'RATING_1_TO_5' && a.ratingValue != null ? (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-sm text-gray-800">
                        {Array.from({ length: 5 }).map((_, n) => (
                          <Star key={n} className={`h-4 w-4 ${n < (a.ratingValue ?? 0) ? 'fill-brand text-brand' : 'fill-transparent text-gray-300'}`} />
                        ))}
                        <span className="ml-1 text-gray-500">{a.ratingValue}/5</span>
                      </span>
                    ) : (
                      <p className="mt-0.5 text-sm text-gray-800">{a.answerText || '—'}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
