import { useState } from 'react';
import { organizerApi, ApiError } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';
import type { EventRequest } from '../../../lib/types';
import { useEventContext } from '../EventManageLayout';
import { SectionHeading } from '../../../components/ui/Card';
import { EventForm } from '../../../components/organizer/EventForm';

export function EventEditTab() {
  const { event, reload } = useEventContext();
  const toast = useToast();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const save = async (body: EventRequest) => {
    setServerErrors({});
    try {
      await organizerApi.updateEvent(event.id, body);
      toast.success('Event details saved.');
      reload();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
        if (err.fields) setServerErrors(err.fields);
      } else {
        toast.error('Could not save changes.');
      }
    }
  };

  return (
    <div className="max-w-3xl">
      <SectionHeading title="Event details" description="Update the core information attendees see." />
      <EventForm key={event.updatedAt} initial={event} submitLabel="Save changes" onSubmit={save} serverErrors={serverErrors} />
    </div>
  );
}
