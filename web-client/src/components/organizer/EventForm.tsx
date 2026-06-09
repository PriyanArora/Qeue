import { useState, type FormEvent } from 'react';
import type { EventDetail, EventFormat, EventRequest } from '../../lib/types';
import { fromLocalInputValue, toLocalInputValue } from '../../lib/format';
import { Card } from '../ui/Card';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { Button } from '../ui/Button';

const FORMATS: EventFormat[] = ['IN_PERSON', 'ONLINE', 'HYBRID'];
const TIMEZONES = [
  'America/Halifax',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
];

function guessTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Shared create/edit form. Calls onSubmit with a validated EventRequest. */
export function EventForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  serverErrors,
}: {
  initial?: EventDetail;
  submitLabel: string;
  onSubmit: (body: EventRequest) => Promise<void>;
  onCancel?: () => void;
  serverErrors?: Record<string, string>;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    eventFormat: initial?.eventFormat ?? ('IN_PERSON' as EventFormat),
    category: initial?.category ?? '',
    bannerImageUrl: initial?.bannerImageUrl ?? '',
    venueName: initial?.venueName ?? '',
    venueCity: initial?.venueCity ?? '',
    venueAddress: initial?.venueAddress ?? '',
    timezone: initial?.timezone ?? guessTz(),
    startsAt: toLocalInputValue(initial?.startsAt),
    endsAt: toLocalInputValue(initial?.endsAt),
    capacity: initial?.capacity ? String(initial.capacity) : '100',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const validate = (): EventRequest | null => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.category.trim()) e.category = 'Category is required.';
    if (!form.venueName.trim()) e.venueName = 'Venue name is required.';
    if (!form.venueCity.trim()) e.venueCity = 'City is required.';
    if (!form.venueAddress.trim()) e.venueAddress = 'Address is required.';
    if (!form.timezone.trim()) e.timezone = 'Timezone is required.';
    if (!form.startsAt) e.startsAt = 'Start time is required.';
    if (!form.endsAt) e.endsAt = 'End time is required.';
    if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt))
      e.endsAt = 'End must be after start.';
    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) e.capacity = 'Capacity must be at least 1.';
    setErrors(e);
    if (Object.keys(e).length > 0) return null;
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      eventFormat: form.eventFormat,
      category: form.category.trim(),
      bannerImageUrl: form.bannerImageUrl.trim() || null,
      venueName: form.venueName.trim(),
      venueCity: form.venueCity.trim(),
      venueAddress: form.venueAddress.trim(),
      timezone: form.timezone.trim(),
      startsAt: fromLocalInputValue(form.startsAt),
      endsAt: fromLocalInputValue(form.endsAt),
      capacity,
    };
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const body = validate();
    if (!body) return;
    setBusy(true);
    try {
      await onSubmit(body);
    } finally {
      setBusy(false);
    }
  };

  const err = (k: string) => errors[k] ?? serverErrors?.[k];

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card className="space-y-5 p-6">
        <h2 className="text-base font-semibold text-gray-900">Basics</h2>
        <Field label="Event title" required error={err('title')}>
          <Input value={form.title} onChange={(e) => set('title')(e.target.value)} placeholder="Qeue Launch Night" />
        </Field>
        <Field label="Description" required error={err('description')}>
          <Textarea
            rows={5}
            value={form.description}
            onChange={(e) => set('description')(e.target.value)}
            placeholder="Tell attendees what to expect…"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Format" required>
            <Select value={form.eventFormat} onChange={(e) => set('eventFormat')(e.target.value)}>
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f === 'IN_PERSON' ? 'In person' : f === 'ONLINE' ? 'Online' : 'Hybrid'}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category" required error={err('category')}>
            <Input value={form.category} onChange={(e) => set('category')(e.target.value)} placeholder="Product, Music, Tech…" />
          </Field>
        </div>
        <Field label="Banner image URL" hint="Optional — leave blank for a generated cover." error={err('bannerImageUrl')}>
          <Input value={form.bannerImageUrl} onChange={(e) => set('bannerImageUrl')(e.target.value)} placeholder="https://…" />
        </Field>
      </Card>

      <Card className="space-y-5 p-6">
        <h2 className="text-base font-semibold text-gray-900">Schedule & capacity</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Starts at" required error={err('startsAt')}>
            <Input type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt')(e.target.value)} />
          </Field>
          <Field label="Ends at" required error={err('endsAt')}>
            <Input type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt')(e.target.value)} />
          </Field>
          <Field label="Timezone" required error={err('timezone')}>
            <Input list="tz-list" value={form.timezone} onChange={(e) => set('timezone')(e.target.value)} placeholder="America/Halifax" />
            <datalist id="tz-list">
              {TIMEZONES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Capacity" required error={err('capacity')}>
            <Input type="number" min={1} value={form.capacity} onChange={(e) => set('capacity')(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="space-y-5 p-6">
        <h2 className="text-base font-semibold text-gray-900">Venue</h2>
        <Field label="Venue name" required error={err('venueName')}>
          <Input value={form.venueName} onChange={(e) => set('venueName')(e.target.value)} placeholder="Community Hall" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Address" required error={err('venueAddress')}>
            <Input value={form.venueAddress} onChange={(e) => set('venueAddress')(e.target.value)} placeholder="1 Water Street" />
          </Field>
          <Field label="City" required error={err('venueCity')}>
            <Input value={form.venueCity} onChange={(e) => set('venueCity')(e.target.value)} placeholder="Halifax" />
          </Field>
        </div>
        {form.eventFormat === 'ONLINE' && (
          <p className="text-[12px] text-gray-400">
            For online events, venue fields are still stored — use them for the platform name or a note.
          </p>
        )}
      </Card>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="lg" loading={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
