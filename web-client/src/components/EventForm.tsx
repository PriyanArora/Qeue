import { useState } from 'react';
import type { FormEvent } from 'react';
import type { EventFormValues } from '../services/types';

interface EventFormProps {
  initialValues: EventFormValues;
  submitLabel: string;
  error?: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
}

export function EventForm({ initialValues, submitLabel, error, onSubmit }: EventFormProps) {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  }

  function update(field: keyof EventFormValues, value: string) {
    setValues(current => ({
      ...current,
      [field]: field === 'capacity' ? Number(value) : value
    }));
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {error && <div className="form-error" role="alert">{error}</div>}
      <label>
        Title
        <input value={values.title} onChange={event => update('title', event.target.value)} required maxLength={120} />
      </label>
      <label>
        Description
        <textarea value={values.description} onChange={event => update('description', event.target.value)} required rows={5} />
      </label>
      <div className="two-column">
        <label>
          Format
          <select value={values.eventFormat} onChange={event => update('eventFormat', event.target.value)} required>
            <option value="IN_PERSON">In person</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </label>
        <label>
          Category
          <input value={values.category} onChange={event => update('category', event.target.value)} required maxLength={80} />
        </label>
      </div>
      <label>
        Banner image URL
        <input value={values.bannerImageUrl} onChange={event => update('bannerImageUrl', event.target.value)} maxLength={500} />
      </label>
      <div className="two-column">
        <label>
          Venue
          <input value={values.venueName} onChange={event => update('venueName', event.target.value)} required />
        </label>
        <label>
          City
          <input value={values.venueCity} onChange={event => update('venueCity', event.target.value)} required />
        </label>
      </div>
      <label>
        Address
        <input value={values.venueAddress} onChange={event => update('venueAddress', event.target.value)} required maxLength={240} />
      </label>
      <label>
        Timezone
        <input value={values.timezone} onChange={event => update('timezone', event.target.value)} required maxLength={80} />
      </label>
      <div className="two-column">
        <label>
          Starts
          <input type="datetime-local" value={values.startsAt} onChange={event => update('startsAt', event.target.value)} required />
        </label>
        <label>
          Ends
          <input type="datetime-local" value={values.endsAt} onChange={event => update('endsAt', event.target.value)} required />
        </label>
      </div>
      <label>
        Capacity
        <input type="number" min={1} value={values.capacity} onChange={event => update('capacity', event.target.value)} required />
      </label>
      <button className="button" type="submit" disabled={saving}>{saving ? 'Saving' : submitLabel}</button>
    </form>
  );
}
