import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerApi, ApiError } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import type { EventRequest } from '../../lib/types';
import { Container, PageHeader } from '../../components/layout/Page';
import { EventForm } from '../../components/organizer/EventForm';

export function EventCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const create = async (body: EventRequest) => {
    setServerErrors({});
    try {
      const created = await organizerApi.createEvent(body);
      toast.success('Event created as a draft.');
      navigate(`/organizer/events/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
        if (err.fields) setServerErrors(err.fields);
      } else {
        toast.error('Could not create the event.');
      }
    }
  };

  return (
    <div className="bg-[#F5F5F5] py-10 sm:py-14">
      <Container size="md">
        <PageHeader
          breadcrumbs={[{ label: 'Organizer', to: '/organizer' }, { label: 'New event' }]}
          title="Create an event"
          description="Start as a draft — you can add registration types, speakers, and an agenda before you publish."
        />
        <EventForm
          submitLabel="Create event"
          onSubmit={create}
          onCancel={() => navigate('/organizer')}
          serverErrors={serverErrors}
        />
      </Container>
    </div>
  );
}
