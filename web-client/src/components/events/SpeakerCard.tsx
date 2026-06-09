import type { Speaker } from '../../lib/types';

export function SpeakerCard({ speaker }: { speaker: Speaker }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
      {speaker.photoUrl ? (
        <img
          src={speaker.photoUrl}
          alt={speaker.name}
          loading="lazy"
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 text-lg font-semibold text-white">
          {speakerInitials(speaker.name)}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold text-gray-900">{speaker.name}</p>
        <p className="text-[13px] text-brand">{speaker.title}</p>
        {speaker.organization && <p className="text-[12px] text-gray-500">{speaker.organization}</p>}
        {speaker.bio && <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-gray-500">{speaker.bio}</p>}
      </div>
    </div>
  );
}

function speakerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
