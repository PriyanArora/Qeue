import { useEffect, useState } from 'react';
import { Copy, Check, Loader2, Ticket as TicketIcon } from 'lucide-react';
import { registrationsApi, ApiError } from '../../lib/api';
import type { Registration, Ticket } from '../../lib/types';
import { formatDateTime } from '../../lib/format';
import { Modal } from '../ui/Modal';

/** Issues and displays a fresh ticket code for a confirmed registration. */
export function TicketModal({
  registration,
  open,
  onClose,
}: {
  registration: Registration | null;
  open: boolean;
  onClose: () => void;
}) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !registration) return;
    setTicket(null);
    setError(null);
    let cancelled = false;
    registrationsApi
      .ticket(registration.registrationId)
      .then((t) => !cancelled && setTicket(t))
      .catch((err) =>
        !cancelled && setError(err instanceof ApiError ? err.message : 'Could not issue ticket.'),
      );
    return () => {
      cancelled = true;
    };
  }, [open, registration]);

  const copy = () => {
    if (!ticket) return;
    navigator.clipboard?.writeText(ticket.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Modal open={open} onClose={onClose} title="Your ticket" description={registration?.eventTitle}>
      {!ticket && !error && (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Issuing ticket…
        </div>
      )}
      {error && <p className="py-8 text-center text-sm text-rose-600">{error}</p>}
      {ticket && (
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3 bg-gray-900 px-5 py-4 text-white">
            <TicketIcon className="h-5 w-5 text-brand" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{registration?.eventTitle}</p>
              <p className="text-[12px] text-white/60">
                {registration?.attendeeDisplayNameSnapshot}
              </p>
            </div>
          </div>
          <div className="relative bg-white px-5 py-6">
            {/* perforated edge */}
            <div className="absolute -top-2.5 left-0 right-0 flex justify-between px-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="h-5 w-5 -translate-y-1/2 rounded-full bg-gray-900/0" />
              ))}
            </div>
            <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Ticket code
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <code className="select-all rounded-lg bg-gray-50 px-4 py-2 font-mono text-2xl font-bold tracking-[0.2em] text-gray-900">
                {ticket.ticketCode}
              </code>
              <button
                onClick={copy}
                className="rounded-lg border border-gray-200 p-2.5 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900"
                aria-label="Copy ticket code"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <FakeBarcode seed={ticket.ticketCode} />
            <p className="mt-4 text-center text-[12px] text-gray-400">
              Issued {formatDateTime(ticket.issuedAt)} · Present this code at check-in
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Deterministic decorative barcode derived from the ticket code. */
function FakeBarcode({ seed }: { seed: string }) {
  const bars: number[] = [];
  for (let i = 0; i < 48; i++) {
    const c = seed.charCodeAt(i % seed.length);
    bars.push(((c >> i % 5) & 3) + 1);
  }
  return (
    <div className="mt-5 flex h-12 items-end justify-center gap-[2px]">
      {bars.map((w, i) => (
        <span key={i} className="bg-gray-900" style={{ width: w, height: `${60 + ((w * 13) % 40)}%` }} />
      ))}
    </div>
  );
}
