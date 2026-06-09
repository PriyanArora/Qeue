import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, CalendarX2 } from 'lucide-react';
import { eventsApi } from '../lib/api';
import { useApi } from '../hooks/useApi';
import type { EventFormat } from '../lib/types';
import { eventFormatLabel } from '../lib/format';
import { Container, PageHeader } from '../components/layout/Page';
import { EventCard, EventCardSkeleton } from '../components/events/EventCard';
import { EmptyState, ErrorState } from '../components/ui/States';
import { Input, Select } from '../components/ui/Field';

const FORMATS: (EventFormat | 'ALL')[] = ['ALL', 'IN_PERSON', 'ONLINE', 'HYBRID'];

export function BrowseEventsPage() {
  const { data, loading, error, reload } = useApi((signal) => eventsApi.listPublished(signal), []);
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<EventFormat | 'ALL'>('ALL');
  const [category, setCategory] = useState('ALL');

  const categories = useMemo(() => {
    const set = new Set((data ?? []).map((e) => e.category).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? [])
      .filter((e) => format === 'ALL' || e.eventFormat === format)
      .filter((e) => category === 'ALL' || e.category === category)
      .filter(
        (e) =>
          !q ||
          e.title.toLowerCase().includes(q) ||
          e.venueCity.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q),
      )
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  }, [data, query, format, category]);

  return (
    <div className="bg-[#F5F5F5] py-10 sm:py-14">
      <Container>
        <PageHeader
          eyebrow="Discover"
          title="Browse events"
          description="Find published events to register for — filter by format, category, or search."
        />

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-card sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, city, or category"
              className="border-transparent bg-gray-50 pl-10"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="hidden h-4 w-4 text-gray-400 sm:block" />
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value as EventFormat | 'ALL')}
              className="w-auto border-transparent bg-gray-50"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f === 'ALL' ? 'All formats' : eventFormatLabel[f]}
                </option>
              ))}
            </Select>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-auto border-transparent bg-gray-50"
            >
              <option value="ALL">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarX2 className="h-6 w-6" />}
            title={data && data.length > 0 ? 'No events match your filters' : 'No published events yet'}
            description={
              data && data.length > 0
                ? 'Try clearing your search or changing the format and category.'
                : 'Check back soon — organizers are still preparing events.'
            }
          />
        ) : (
          <>
            <p className="mb-4 text-[13px] text-gray-500">
              {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
