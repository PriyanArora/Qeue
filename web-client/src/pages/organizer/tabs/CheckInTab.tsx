import { useRef, useState, type FormEvent } from 'react';
import { ScanLine, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { organizerApi, ApiError } from '../../../lib/api';
import type { CheckInResponse } from '../../../lib/types';
import { formatTime } from '../../../lib/format';
import { useEventContext } from '../EventManageLayout';
import { Card, SectionHeading } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Field';

type Outcome = 'CHECKED_IN' | 'ALREADY' | 'ERROR';
interface LogEntry {
  outcome: Outcome;
  email?: string;
  message: string;
  at: string;
}

export function CheckInTab() {
  const { event } = useEventContext();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ outcome: Outcome; data?: CheckInResponse; message: string } | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ticketCode = code.trim();
    if (!ticketCode) return;
    setBusy(true);
    try {
      const res = await organizerApi.checkIn(event.id, ticketCode);
      const outcome: Outcome = res.status === 'CHECKED_IN' ? 'CHECKED_IN' : 'ALREADY';
      const message = outcome === 'CHECKED_IN' ? 'Checked in successfully' : 'Already checked in';
      setLast({ outcome, data: res, message });
      setLog((prev) => [{ outcome, email: res.attendeeEmail, message, at: res.checkedInAt }, ...prev].slice(0, 12));
    } catch (err) {
      const isConflict = err instanceof ApiError && err.status === 409;
      const message = err instanceof ApiError ? err.message : 'Check-in failed.';
      const outcome: Outcome = isConflict ? 'ALREADY' : 'ERROR';
      setLast({ outcome, message });
      setLog((prev) => [{ outcome, message, at: new Date().toISOString() }, ...prev].slice(0, 12));
    } finally {
      setBusy(false);
      setCode('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <SectionHeading title="Check-in" description="Enter or scan an attendee's ticket code to check them in." />
        <Card className="p-6">
          <form onSubmit={submit}>
            <label className="text-[13px] font-medium text-gray-700">Ticket code</label>
            <div className="mt-2 flex gap-2.5">
              <Input
                ref={inputRef}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD-1234"
                autoFocus
                autoComplete="off"
                className="font-mono text-lg tracking-widest"
              />
              <Button type="submit" loading={busy} leftIcon={<ScanLine className="h-4 w-4" />}>
                Check in
              </Button>
            </div>
          </form>

          {last && (
            <div
              className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${
                last.outcome === 'CHECKED_IN'
                  ? 'border-emerald-200 bg-emerald-50'
                  : last.outcome === 'ALREADY'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-rose-200 bg-rose-50'
              }`}
            >
              {last.outcome === 'CHECKED_IN' ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              ) : last.outcome === 'ALREADY' ? (
                <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
              ) : (
                <XCircle className="h-6 w-6 shrink-0 text-rose-600" />
              )}
              <div>
                <p
                  className={`text-sm font-semibold ${
                    last.outcome === 'CHECKED_IN'
                      ? 'text-emerald-800'
                      : last.outcome === 'ALREADY'
                        ? 'text-amber-800'
                        : 'text-rose-800'
                  }`}
                >
                  {last.message}
                </p>
                {last.data?.attendeeEmail && <p className="text-[13px] text-gray-600">{last.data.attendeeEmail}</p>}
                {last.data?.checkedInAt && (
                  <p className="text-[12px] text-gray-500">at {formatTime(last.data.checkedInAt, event.timezone)}</p>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div>
        <SectionHeading title="Recent activity" description="Check-ins from this session." />
        <Card className="p-2">
          {log.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-400">No check-ins yet this session.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {log.map((e, i) => (
                <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                  {e.outcome === 'CHECKED_IN' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : e.outcome === 'ALREADY' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-gray-800">{e.email ?? e.message}</p>
                    {e.email && <p className="text-[11px] text-gray-400">{e.message}</p>}
                  </div>
                  <span className="text-[11px] text-gray-400">{formatTime(e.at, event.timezone)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
