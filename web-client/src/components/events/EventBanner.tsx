import { accentFor } from '../../lib/format';

/** Event banner image with a deterministic gradient fallback. */
export function EventBanner({
  event,
  className = '',
  rounded = 'rounded-2xl',
}: {
  event: { id: string; title: string; bannerImageUrl?: string | null; category?: string };
  className?: string;
  rounded?: string;
}) {
  if (event.bannerImageUrl) {
    return (
      <img
        src={event.bannerImageUrl}
        alt={event.title}
        loading="lazy"
        className={`h-full w-full object-cover ${rounded} ${className}`}
      />
    );
  }
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${accentFor(
        event.id,
      )} ${rounded} ${className}`}
    >
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
      <span className="relative px-6 text-center text-lg font-semibold tracking-tight text-white drop-shadow-sm">
        {event.title}
      </span>
    </div>
  );
}
