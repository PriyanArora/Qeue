import { Users, CheckCircle2, Armchair, UserX, Ban, Gauge } from 'lucide-react';
import { organizerApi } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';
import { useEventContext } from '../EventManageLayout';
import { SectionHeading, Card } from '../../../components/ui/Card';
import { Stat } from '../../../components/ui/Stat';
import { LoadingBlock, ErrorState, EmptyState } from '../../../components/ui/States';

export function AnalyticsTab() {
  const { event } = useEventContext();
  const { data, loading, error, reload } = useApi((s) => organizerApi.analytics(event.id, s), [event.id]);

  if (loading) return <LoadingBlock />;
  if (error || !data) return <ErrorState message={error ?? 'Could not load analytics.'} onRetry={reload} />;

  const fillPct = data.capacity > 0 ? Math.min(100, Math.round((data.confirmedRegistrations / data.capacity) * 100)) : 0;
  const checkInPct = data.confirmedRegistrations > 0 ? Math.round((data.checkIns / data.confirmedRegistrations) * 100) : 0;
  const maxType = Math.max(1, ...data.registrationTypeBreakdown.map((t) => t.confirmedCount));

  return (
    <div className="space-y-6">
      <SectionHeading title="Analytics" description="Live registration and attendance metrics for this event." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Capacity" value={data.capacity} icon={<Gauge className="h-4 w-4" />} />
        <Stat label="Confirmed" value={data.confirmedRegistrations} icon={<Users className="h-4 w-4" />} accent="brand" />
        <Stat label="Available seats" value={data.availableSeats} icon={<Armchair className="h-4 w-4" />} accent="sky" />
        <Stat label="Checked in" value={data.checkIns} icon={<CheckCircle2 className="h-4 w-4" />} accent="emerald" />
        <Stat label="No-shows" value={data.noShows} icon={<UserX className="h-4 w-4" />} accent="amber" />
        <Stat label="Cancelled" value={data.cancelledRegistrations} icon={<Ban className="h-4 w-4" />} accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-gray-900">Capacity utilization</h3>
          <p className="mt-1 text-[13px] text-gray-500">
            {data.confirmedRegistrations} of {data.capacity} seats confirmed
          </p>
          <div className="mt-5">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-semibold text-gray-900">{fillPct}%</span>
              <span className="text-[13px] text-gray-400">{data.availableSeats} seats left</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-hover transition-all" style={{ width: `${fillPct}%` }} />
            </div>
          </div>

          <h3 className="mt-8 text-base font-semibold text-gray-900">Check-in rate</h3>
          <p className="mt-1 text-[13px] text-gray-500">
            {data.checkIns} of {data.confirmedRegistrations} confirmed attendees
          </p>
          <div className="mt-5">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-semibold text-gray-900">{checkInPct}%</span>
              <span className="text-[13px] text-gray-400">{data.noShows} no-shows</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all" style={{ width: `${checkInPct}%` }} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-gray-900">Registration types</h3>
          <p className="mt-1 text-[13px] text-gray-500">Confirmed registrations by type</p>
          {data.registrationTypeBreakdown.length === 0 ? (
            <EmptyState title="No type breakdown" description="This event doesn't use registration types, or has no confirmed registrations yet." />
          ) : (
            <ul className="mt-5 space-y-4">
              {data.registrationTypeBreakdown.map((t) => (
                <li key={t.registrationTypeName}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-gray-800">{t.registrationTypeName}</span>
                    <span className="text-gray-500">{t.confirmedCount}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gray-900 transition-all"
                      style={{ width: `${Math.round((t.confirmedCount / maxType) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
