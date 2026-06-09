import { useMemo, useState } from 'react';
import { Search, Download, Users, Eye } from 'lucide-react';
import { organizerApi, ApiError } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import { useToast } from '../../../components/ui/Toast';
import type {
  OrganizerRegistration,
  RegistrationListParams,
  RegistrationStatus,
} from '../../../lib/types';
import { checkInMeta, formatDateTime, registrationStatusMeta } from '../../../lib/format';
import { useEventContext } from '../EventManageLayout';
import { SectionHeading, Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/Badge';
import { Input, Select } from '../../../components/ui/Field';
import { Modal } from '../../../components/ui/Modal';
import { LoadingBlock, ErrorState, EmptyState } from '../../../components/ui/States';

const SORTS: { value: NonNullable<RegistrationListParams['sort']>; label: string }[] = [
  { value: 'createdAtDesc', label: 'Newest first' },
  { value: 'createdAtAsc', label: 'Oldest first' },
  { value: 'emailAsc', label: 'Email A–Z' },
  { value: 'emailDesc', label: 'Email Z–A' },
  { value: 'statusAsc', label: 'Status A–Z' },
  { value: 'statusDesc', label: 'Status Z–A' },
];

export function AttendeesTab() {
  const { event } = useEventContext();
  const toast = useToast();

  const [status, setStatus] = useState<'' | RegistrationStatus>('');
  const [typeId, setTypeId] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<RegistrationListParams['sort']>('createdAtDesc');
  const [detail, setDetail] = useState<OrganizerRegistration | null>(null);
  const [exporting, setExporting] = useState(false);

  const params = useMemo<RegistrationListParams>(
    () => ({
      status: status || undefined,
      registrationTypeId: typeId || undefined,
      query: query.trim() || undefined,
      sort,
    }),
    [status, typeId, query, sort],
  );

  const { data: types } = useApi((s) => organizerApi.types(event.id, s), [event.id]);
  const { data, loading, error, reload } = useApi(
    (s) => organizerApi.registrations(event.id, params, s),
    [event.id, params],
  );

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await organizerApi.exportRegistrationsCsv(event.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-${event.id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not export CSV.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <SectionHeading
        title="Attendees"
        description="Everyone registered for this event. Filter, search, and export the list."
        action={
          <Button size="sm" variant="outline" onClick={exportCsv} loading={exporting} leftIcon={<Download className="h-4 w-4" />}>
            Export CSV
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-card lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email" className="border-transparent bg-gray-50 pl-10" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={status} onChange={(e) => setStatus(e.target.value as '' | RegistrationStatus)} className="w-auto border-transparent bg-gray-50">
            <option value="">All statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
          <Select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="w-auto border-transparent bg-gray-50">
            <option value="">All types</option>
            {(types ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as RegistrationListParams['sort'])} className="w-auto border-transparent bg-gray-50">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No attendees found" description="No registrations match your current filters." />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[12px] uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Attendee</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Check-in</th>
                  <th className="px-5 py-3 font-medium">Registered</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data ?? []).map((r) => (
                  <tr key={r.registrationId} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{r.attendeeDisplayNameSnapshot}</p>
                      <p className="text-[12px] text-gray-500">{r.attendeeEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{r.registrationTypeNameSnapshot ?? '—'}</td>
                    <td className="px-5 py-3.5"><StatusBadge meta={registrationStatusMeta[r.status]} /></td>
                    <td className="px-5 py-3.5"><StatusBadge meta={checkInMeta[r.checkInStatus]} /></td>
                    <td className="px-5 py-3.5 text-[12px] text-gray-500">{formatDateTime(r.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => setDetail(r)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="View detail">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-100 md:hidden">
            {(data ?? []).map((r) => (
              <button key={r.registrationId} onClick={() => setDetail(r)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{r.attendeeDisplayNameSnapshot}</p>
                  <p className="truncate text-[12px] text-gray-500">{r.attendeeEmail}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <StatusBadge meta={registrationStatusMeta[r.status]} />
                    <StatusBadge meta={checkInMeta[r.checkInStatus]} />
                  </div>
                </div>
                <Eye className="h-4 w-4 shrink-0 text-gray-300" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {(data ?? []).length > 0 && (
        <p className="mt-3 text-[12px] text-gray-400">{(data ?? []).length} registration(s)</p>
      )}

      <RegistrationDetailModal registration={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function RegistrationDetailModal({
  registration,
  onClose,
}: {
  registration: OrganizerRegistration | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!registration} onClose={onClose} title="Registration detail" description={registration?.attendeeEmail}>
      {registration && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Info label="Name">{registration.attendeeDisplayNameSnapshot}</Info>
            <Info label="Email">{registration.attendeeEmail}</Info>
            <Info label="Type">{registration.registrationTypeNameSnapshot ?? '—'}</Info>
            <Info label="Registered">{formatDateTime(registration.createdAt)}</Info>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge meta={registrationStatusMeta[registration.status]} />
            <StatusBadge meta={checkInMeta[registration.checkInStatus]} />
          </div>
          {registration.checkedInAt && (
            <p className="text-[13px] text-gray-500">Checked in at {formatDateTime(registration.checkedInAt)}</p>
          )}
          {registration.cancelledAt && (
            <p className="text-[13px] text-rose-600">Cancelled at {formatDateTime(registration.cancelledAt)}</p>
          )}
          {registration.answers.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-gray-400">Answers</p>
              <ul className="space-y-2">
                {registration.answers.map((a, i) => (
                  <li key={i} className="rounded-xl bg-gray-50 px-3.5 py-2.5">
                    <p className="text-[12px] text-gray-400">Question {i + 1}</p>
                    <p className="text-sm text-gray-800">{a.answerText}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-gray-800">{children}</p>
    </div>
  );
}
