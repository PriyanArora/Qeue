import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Ticket, Ban, MessageSquareText, CalendarSearch } from 'lucide-react';
import { registrationsApi, ApiError } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';
import type { Registration } from '../../lib/types';
import {
  checkInMeta,
  formatDate,
  formatTime,
  isPast,
  registrationStatusMeta,
} from '../../lib/format';
import { Container, PageHeader } from '../../components/layout/Page';
import { Card } from '../../components/ui/Card';
import { Button, ButtonLink } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { LoadingBlock, ErrorState, EmptyState } from '../../components/ui/States';
import { TicketModal } from '../../components/events/TicketModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export function MyRegistrationsPage() {
  const { data, loading, error, reload, setData } = useApi((s) => registrationsApi.mine(s), []);
  const toast = useToast();
  const [ticketFor, setTicketFor] = useState<Registration | null>(null);
  const [cancelFor, setCancelFor] = useState<Registration | null>(null);

  const { upcoming, past } = useMemo(() => {
    const list = (data ?? []).slice().sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));
    return {
      upcoming: list.filter((r) => !isPast(r.startsAt)).reverse(),
      past: list.filter((r) => isPast(r.startsAt)),
    };
  }, [data]);

  const doCancel = async () => {
    if (!cancelFor) return;
    try {
      const updated = await registrationsApi.cancel(cancelFor.registrationId);
      setData((prev) =>
        (prev ?? []).map((r) => (r.registrationId === updated.registrationId ? updated : r)),
      );
      toast.success('Registration cancelled.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not cancel.');
    }
  };

  return (
    <div className="bg-[#F5F5F5] py-10 sm:py-14">
      <Container>
        <PageHeader
          eyebrow="My account"
          title="My tickets"
          description="Your event registrations, tickets, and feedback in one place."
          actions={<ButtonLink to="/events" variant="outline" leftIcon={<CalendarSearch className="h-4 w-4" />}>Find events</ButtonLink>}
        />

        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (data ?? []).length === 0 ? (
          <EmptyState
            icon={<Ticket className="h-6 w-6" />}
            title="No registrations yet"
            description="When you register for an event, your tickets will show up here."
            action={<ButtonLink to="/events" size="sm">Browse events</ButtonLink>}
          />
        ) : (
          <div className="space-y-10">
            <RegSection
              title="Upcoming"
              count={upcoming.length}
              regs={upcoming}
              onTicket={setTicketFor}
              onCancel={setCancelFor}
            />
            {past.length > 0 && (
              <RegSection
                title="Past"
                count={past.length}
                regs={past}
                onTicket={setTicketFor}
                onCancel={setCancelFor}
                past
              />
            )}
          </div>
        )}
      </Container>

      <TicketModal registration={ticketFor} open={!!ticketFor} onClose={() => setTicketFor(null)} />
      <ConfirmDialog
        open={!!cancelFor}
        onClose={() => setCancelFor(null)}
        onConfirm={doCancel}
        title="Cancel registration?"
        message={`This frees up your seat for ${cancelFor?.eventTitle}. You can register again later if seats remain.`}
        confirmLabel="Cancel registration"
        destructive
      />
    </div>
  );
}

function RegSection({
  title,
  count,
  regs,
  onTicket,
  onCancel,
  past = false,
}: {
  title: string;
  count: number;
  regs: Registration[];
  onTicket: (r: Registration) => void;
  onCancel: (r: Registration) => void;
  past?: boolean;
}) {
  if (count === 0) return null;
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
        {title}
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-600">{count}</span>
      </h2>
      <div className="space-y-3">
        {regs.map((r) => {
          const cancelled = r.status === 'CANCELLED';
          return (
            <Card key={r.registrationId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge meta={registrationStatusMeta[r.status]} />
                  <StatusBadge meta={checkInMeta[r.checkInStatus]} />
                  {r.registrationTypeNameSnapshot && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                      {r.registrationTypeNameSnapshot}
                    </span>
                  )}
                </div>
                <Link to={`/events/${r.eventId}`} className="mt-2 block text-base font-semibold text-gray-900 hover:text-brand">
                  {r.eventTitle}
                </Link>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-gray-500">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                  {formatDate(r.startsAt)} · {formatTime(r.startsAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {!cancelled && (
                  <Button size="sm" variant="dark" onClick={() => onTicket(r)} leftIcon={<Ticket className="h-4 w-4" />}>
                    Ticket
                  </Button>
                )}
                {past ? (
                  <ButtonLink to={`/events/${r.eventId}/survey`} size="sm" variant="outline" leftIcon={<MessageSquareText className="h-4 w-4" />}>
                    Survey
                  </ButtonLink>
                ) : (
                  !cancelled && (
                    <Button size="sm" variant="danger" onClick={() => onCancel(r)} leftIcon={<Ban className="h-4 w-4" />}>
                      Cancel
                    </Button>
                  )
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
