import { useState } from 'react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { organizerApi, ApiError } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import { useToast } from '../../../components/ui/Toast';
import type {
  QuestionType,
  RegistrationQuestion,
  RegistrationQuestionRequest,
  RegistrationType,
  RegistrationTypeRequest,
} from '../../../lib/types';
import { questionTypeLabel } from '../../../lib/format';
import { useEventContext } from '../EventManageLayout';
import { Card, SectionHeading } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Field, Input, Select, Textarea, Toggle } from '../../../components/ui/Field';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { LoadingBlock, ErrorState, EmptyState } from '../../../components/ui/States';

export function RegistrationTab() {
  return (
    <div className="space-y-12">
      <TypesSection />
      <QuestionsSection />
    </div>
  );
}

const QUESTION_TYPES: QuestionType[] = ['TEXT', 'LONG_TEXT', 'YES_NO', 'RATING_1_TO_5'];

/* -------------------------------------------------------- registration types */
function TypesSection() {
  const { event } = useEventContext();
  const toast = useToast();
  const { data, loading, error, reload } = useApi((s) => organizerApi.types(event.id, s), [event.id]);
  const [editing, setEditing] = useState<RegistrationType | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<RegistrationType | null>(null);

  const list = (data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const remove = async () => {
    if (!removing) return;
    try {
      await organizerApi.deleteType(event.id, removing.id);
      toast.success('Registration type removed.');
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove type.');
    }
  };

  return (
    <section>
      <SectionHeading
        title="Registration types"
        description="Offer tiers like General, VIP, or Student — each with its own capacity."
        action={
          <Button size="sm" onClick={() => setCreating(true)} leftIcon={<Plus className="h-4 w-4" />}>
            Add type
          </Button>
        }
      />
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState
          title="No registration types"
          description="Add at least one type if you want tiered registration. Otherwise attendees register without choosing a type."
          action={<Button size="sm" onClick={() => setCreating(true)}>Add your first type</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {list.map((t) => (
            <Card key={t.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-start gap-3">
                <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    {!t.active && <Badge className="bg-gray-100 text-gray-500 ring-gray-200">Inactive</Badge>}
                  </div>
                  {t.description && <p className="text-[13px] text-gray-500">{t.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-brand-soft text-brand ring-brand/20">{t.capacity} seats</Badge>
                <button onClick={() => setEditing(t)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setRemoving(t)} className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <TypeModal
          eventId={event.id}
          existing={editing}
          nextSort={list.length}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={reload}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        title="Remove registration type?"
        message={`"${removing?.name}" will be deactivated and hidden from new registrations.`}
        confirmLabel="Remove type"
        destructive
      />
    </section>
  );
}

function TypeModal({
  eventId,
  existing,
  nextSort,
  onClose,
  onSaved,
}: {
  eventId: string;
  existing: RegistrationType | null;
  nextSort: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<RegistrationTypeRequest>({
    name: existing?.name ?? '',
    description: existing?.description ?? '',
    capacity: existing?.capacity ?? 50,
    active: existing?.active ?? true,
    sortOrder: existing?.sortOrder ?? nextSort,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    setBusy(true);
    try {
      if (existing) await organizerApi.updateType(eventId, existing.id, form);
      else await organizerApi.createType(eventId, form);
      toast.success(existing ? 'Type updated.' : 'Type added.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save type.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? 'Edit registration type' : 'New registration type'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} loading={busy}>{existing ? 'Save' : 'Add type'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="General Admission" />
        </Field>
        <Field label="Description">
          <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this tier includes" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Capacity" required>
            <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </Field>
          <Field label="Sort order">
            <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </Field>
        </div>
        <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active (available to attendees)" />
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------- registration questions */
function QuestionsSection() {
  const { event } = useEventContext();
  const toast = useToast();
  const { data, loading, error, reload } = useApi((s) => organizerApi.questions(event.id, s), [event.id]);
  const [editing, setEditing] = useState<RegistrationQuestion | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<RegistrationQuestion | null>(null);

  const list = (data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const remove = async () => {
    if (!removing) return;
    try {
      await organizerApi.deleteQuestion(event.id, removing.id);
      toast.success('Question removed.');
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove question.');
    }
  };

  return (
    <section>
      <SectionHeading
        title="Registration questions"
        description="Collect extra info from attendees during registration."
        action={
          <Button size="sm" onClick={() => setCreating(true)} leftIcon={<Plus className="h-4 w-4" />}>
            Add question
          </Button>
        }
      />
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="Add questions to gather dietary needs, t-shirt sizes, or anything else."
          action={<Button size="sm" onClick={() => setCreating(true)}>Add your first question</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {list.map((q) => (
            <Card key={q.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-start gap-3">
                <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-gray-900">{q.questionText}</p>
                    {q.required && <Badge className="bg-brand-soft text-brand ring-brand/20">Required</Badge>}
                    {!q.active && <Badge className="bg-gray-100 text-gray-500 ring-gray-200">Inactive</Badge>}
                  </div>
                  <p className="text-[13px] text-gray-500">{questionTypeLabel[q.questionType]}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(q)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setRemoving(q)} className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <QuestionModal
          eventId={event.id}
          existing={editing}
          nextSort={list.length}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={reload}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        title="Remove question?"
        message="This question will be deactivated and hidden from new registrations."
        confirmLabel="Remove question"
        destructive
      />
    </section>
  );
}

function QuestionModal({
  eventId,
  existing,
  nextSort,
  onClose,
  onSaved,
}: {
  eventId: string;
  existing: RegistrationQuestion | null;
  nextSort: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<RegistrationQuestionRequest>({
    questionText: existing?.questionText ?? '',
    questionType: existing?.questionType ?? 'TEXT',
    required: existing?.required ?? false,
    sortOrder: existing?.sortOrder ?? nextSort,
    active: existing?.active ?? true,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!form.questionText.trim()) {
      toast.error('Question text is required.');
      return;
    }
    setBusy(true);
    try {
      if (existing) await organizerApi.updateQuestion(eventId, existing.id, form);
      else await organizerApi.createQuestion(eventId, form);
      toast.success(existing ? 'Question updated.' : 'Question added.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save question.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? 'Edit question' : 'New question'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} loading={busy}>{existing ? 'Save' : 'Add question'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Question" required>
          <Input value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} placeholder="Any dietary restrictions?" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Answer type" required>
            <Select value={form.questionType} onChange={(e) => setForm({ ...form, questionType: e.target.value as QuestionType })}>
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>{questionTypeLabel[t]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Sort order">
            <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Toggle checked={form.required} onChange={(v) => setForm({ ...form, required: v })} label="Required" />
          <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
        </div>
      </div>
    </Modal>
  );
}
