import { MapPin } from 'lucide-react';
import type { Session } from '../../lib/types';
import { formatDate, formatTime } from '../../lib/format';

/** Sessions grouped by day, sorted chronologically, rendered as a timeline. */
export function AgendaList({ sessions, timezone }: { sessions: Session[]; timezone?: string }) {
  const sorted = sessions.slice().sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const groups = new Map<string, Session[]>();
  for (const s of sorted) {
    const day = formatDate(s.startsAt, timezone);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(s);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([day, items]) => (
        <div key={day}>
          <p className="mb-3 text-[13px] font-semibold text-gray-900">{day}</p>
          <div className="space-y-3">
            {items.map((s) => (
              <div key={s.id} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
                <div className="w-20 shrink-0 text-right">
                  <p className="text-[13px] font-semibold text-gray-900">{formatTime(s.startsAt, timezone)}</p>
                  <p className="text-[12px] text-gray-400">{formatTime(s.endsAt, timezone)}</p>
                </div>
                <div className="w-px shrink-0 bg-gray-100" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{s.title}</p>
                  {s.description && <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{s.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500">
                    {s.roomName && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {s.roomName}
                      </span>
                    )}
                    {s.speakers && s.speakers.length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="flex -space-x-1.5">
                          {s.speakers.slice(0, 3).map((sp) => (
                            <span
                              key={sp.id}
                              className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[9px] font-semibold text-white ring-2 ring-white"
                              title={sp.name}
                            >
                              {sp.name.charAt(0).toUpperCase()}
                            </span>
                          ))}
                        </span>
                        {s.speakers.map((sp) => sp.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
