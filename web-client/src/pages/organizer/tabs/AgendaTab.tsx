import { useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Clock } from 'lucide-react';
import { organizerApi, ApiError } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import { useToast } from '../../../components/ui/Toast';
import type {
  EventStatus,
  Session,
  SessionRequest,
  Speaker,
  SpeakerRequest,
} from '../../../lib/types';
import { fromLocalInputValue, toLocalInputValue, formatTime, formatDate } from '../../../lib/format';
import { useEventContext } from '../EventManageLayout';
import { Card, SectionHeading } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Field, Input, Select, Textarea } from '../../../components/ui/Field';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { LoadingBlock, ErrorState, EmptyState } from '../../../components/ui/States';
import { SpeakerCard } from '../../../components/events/SpeakerCard';

const SESSION_STATUSES: EventStatus[] = ['DRAFT', 'PUBLISHED', 'CANCELLED'];

export function AgendaTab() {
  const { event } = useEventContext();
  const speakersState = useApi((s) => organizerApi.speakers(event.id, s), [event.id]);
  const sessionsState = useApi((s) => organizerApi.sessions(event.id, s), [event.id]);

  return (
    <div className="space-y-12">
      <SpeakersSection eventId={event.id} state={speakersState} onChange={() => sessionsState.reload()} />
      <SessionsSection eventId={event.id} timezone={event.timezone} state={sessionsState} speakers={speakersState.data ?? []} />
    </div>
  );
}

/* ------------------------------------------------------------------ speakers */
function SpeakersSection({
  eventId,
  state,
  onChange,
}: {
  eventId: string;
  state: ReturnType<typeof useApi<Speaker[]>>;
  onChange: () => void;
}) {
  const toast = useToast();
  const { data, loading, error, reload } = state;
  const [editing, setEditing] = useState<Speaker | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Speaker | null>(null);

  const remove = async () => {
    if (!removing) return;
    try {
      await organizerApi.deleteSpeaker(eventId, removing.id);
      toast.success('Speaker removed.');
      reload();
      onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove speaker.');
    }
  };

  return (
    <section>
      <SectionHeading
        title="Speakers"
        description="Add the people presenting at your event, then assign them to sessions."
        action={<Button size="sm" onClick={() => setCreating(true)} leftIcon={<Plus className="h-4 w-4" />}>Add speaker</Button>}
      />
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="No speakers yet" description="Add speakers to feature them on the public event page." action={<Button size="sm" onClick={() => setCreating(true)}>Add your first speaker</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(data ?? []).map((sp) => (
            <div key={sp.id} className="group relative">
              <SpeakerCard speaker={sp} />
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => setEditing(sp)} className="rounded-lg bg-white p-1.5 text-gray-400 shadow-sm hover:text-gray-700" aria-label="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setRemoving(sp)} className="rounded-lg bg-white p-1.5 text-gray-400 shadow-sm hover:text-rose-600" aria-label="Remove">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <SpeakerModal
          eventId={eventId}
          existing={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { reload(); onChange(); }}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        title="Remove speaker?"
        message={`${removing?.name} will be removed and unassigned from any sessions.`}
        confirmLabel="Remove speaker"
        destructive
      />
    </section>
  );
}

function SpeakerModal({
  eventId,
  existing,
  onClose,
  onSaved,
}: {
  eventId: string;
  existing: Speaker | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<SpeakerRequest>({
    name: existing?.name ?? '',
    title: existing?.title ?? '',
    organization: existing?.organization ?? '',
    bio: existing?.bio ?? '',
    photoUrl: existing?.photoUrl ?? '',
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, photoUrl: form.photoUrl?.trim() || undefined };
      if (existing) await organizerApi.updateSpeaker(eventId, existing.id, payload);
      else await organizerApi.createSpeaker(eventId, payload);
      toast.success(existing ? 'Speaker updated.' : 'Speaker added.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save speaker.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? 'Edit speaker' : 'New speaker'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} loading={busy}>{existing ? 'Save' : 'Add speaker'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ada Lovelace" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Principal Engineer" />
          </Field>
          <Field label="Organization">
            <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="Qeue" />
          </Field>
        </div>
        <Field label="Photo URL" hint="Optional — initials are shown if blank.">
          <Input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://…" />
        </Field>
        <Field label="Bio">
          <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A short bio…" />
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ sessions */
function SessionsSection({
  eventId,
  timezone,
  state,
  speakers,
}: {
  eventId: string;
  timezone: string;
  state: ReturnType<typeof useApi<Session[]>>;
  speakers: Speaker[];
}) {
  const toast = useToast();
  const { data, loading, error, reload } = state;
  const [editing, setEditing] = useState<Session | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Session | null>(null);

  const list = (data ?? []).slice().sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));

  const remove = async () => {
    if (!removing) return;
    try {
      await organizerApi.deleteSession(eventId, removing.id);
      toast.success('Session removed.');
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove session.');
    }
  };

  return (
    <section>
      <SectionHeading
        title="Sessions"
        description="Build your agenda. Only published sessions show on the public page."
        action={<Button size="sm" onClick={() => setCreating(true)} leftIcon={<Plus className="h-4 w-4" />}>Add session</Button>}
      />
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState title="No sessions yet" description="Add talks, workshops, and breaks to build your agenda." action={<Button size="sm" onClick={() => setCreating(true)}>Add your first session</Button>} />
      ) : (
        <div className="space-y-2.5">
          {list.map((s) => (
            <Card key={s.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-gray-900">{s.title}</p>
                  <Badge className={s.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : s.status === 'DRAFT' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 'bg-rose-50 text-rose-700 ring-rose-600/20'}>
                    {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {formatDate(s.startsAt, timezone)} · {formatTime(s.startsAt, timezone)}–{formatTime(s.endsAt, timezone)}
                  </span>
                  {s.roomName && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />{s.roomName}
                    </span>
                  )}
                  <span>Cap. {s.capacity}</span>
                </div>
                {s.speakers && s.speakers.length > 0 && (
                  <p className="mt-1.5 text-[12px] text-gray-500">
                    Speakers: {s.speakers.map((sp) => sp.name).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => setEditing(s)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setRemoving(s)} className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <SessionModal
          eventId={eventId}
          existing={editing}
          speakers={speakers}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={reload}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        title="Remove session?"
        message={`"${removing?.title}" will be permanently removed from the agenda.`}
        confirmLabel="Remove session"
        destructive
      />
    </section>
  );
}

function SessionModal({
  eventId,
  existing,
  speakers,
  onClose,
  onSaved,
}: {
  eventId: string;
  existing: Session | null;
  speakers: Speaker[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: existing?.title ?? '',
    description: existing?.description ?? '',
    startsAt: toLocalInputValue(existing?.startsAt),
    endsAt: toLocalInputValue(existing?.endsAt),
    roomName: existing?.roomName ?? '',
    capacity: existing?.capacity ?? 50,
    status: existing?.status ?? ('DRAFT' as EventStatus),
    speakerIds: existing?.speakers?.map((s) => s.id) ?? [],
  });
  const [busy, setBusy] = useState(false);

  const toggleSpeaker = (id: string) =>
    setForm((p) => ({
      ...p,
      speakerIds: p.speakerIds.includes(id) ? p.speakerIds.filter((x) => x !== id) : [...p.speakerIds, id],
    }));

  const save = async () => {
    if (!form.title.trim()) return toast.error('Title is required.');
    if (!form.startsAt || !form.endsAt) return toast.error('Start and end times are required.');
    if (new Date(form.endsAt) <= new Date(form.startsAt)) return toast.error('End must be after start.');
    setBusy(true);
    try {
      const payload: SessionRequest = {
        title: form.title.trim(),
        description: form.description.trim(),
        startsAt: fromLocalInputValue(form.startsAt),
        endsAt: fromLocalInputValue(form.endsAt),
        roomName: form.roomName.trim(),
        capacity: Number(form.capacity),
        status: form.status,
        speakerIds: form.speakerIds,
      };
      if (existing) await organizerApi.updateSession(eventId, existing.id, payload);
      else await organizerApi.createSession(eventId, payload);
      toast.success(existing ? 'Session updated.' : 'Session added.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save session.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={existing ? 'Edit session' : 'New session'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} loading={busy}>{existing ? 'Save' : 'Add session'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Opening keynote" />
        </Field>
        <Field label="Description">
          <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Starts at" required>
            <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </Field>
          <Field label="Ends at" required>
            <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </Field>
          <Field label="Room">
            <Input value={form.roomName} onChange={(e) => setForm({ ...form, roomName: e.target.value })} placeholder="Main Hall" />
          </Field>
          <Field label="Capacity">
            <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}>
            {SESSION_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </Select>
        </Field>
        <Field label="Speakers" hint={speakers.length === 0 ? 'Add speakers first to assign them here.' : undefined}>
          {speakers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {speakers.map((sp) => {
                const on = form.speakerIds.includes(sp.id);
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => toggleSpeaker(sp.id)}
                    className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all ${
                      on ? 'border-brand bg-brand-soft text-brand-ink' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {sp.name}
                  </button>
                );
              })}
            </div>
          )}
        </Field>
      </div>
    </Modal>
  );
}
