import type { ReactNode } from 'react';

export function Stat({
  label,
  value,
  icon,
  hint,
  accent = 'gray',
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  accent?: 'gray' | 'brand' | 'emerald' | 'sky' | 'rose' | 'amber';
}) {
  const accents: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600',
    brand: 'bg-brand-soft text-brand',
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
        {icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accents[accent]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-gray-400">{hint}</p>}
    </div>
  );
}
