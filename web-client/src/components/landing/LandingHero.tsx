import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, ScanLine, BarChart3 } from 'lucide-react';
import { RollButton } from '../ui/RollButton';
import { useAuth } from '../../lib/auth';

// The `shaders` package is heavy and only used here — load it lazily so it
// never weighs down the rest of the app. A soft gradient stands in until then.
const HeroShader = lazy(() =>
  import('./HeroShader').then((m) => ({ default: m.HeroShader })),
);

export function LandingHero() {
  const { isAuthenticated, isOrganizer } = useAuth();
  const primaryTo = !isAuthenticated
    ? '/signup'
    : isOrganizer
      ? '/organizer/events/new'
      : '/events';

  return (
    <section className="relative overflow-hidden bg-[#EFEFEF]">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(120%_120%_at_80%_0%,rgba(242,101,34,0.14),transparent_55%)]" />
      <ShaderErrorBoundary>
        <Suspense fallback={null}>
          <HeroShader />
        </Suspense>
      </ShaderErrorBoundary>

      <div className="relative z-20 mx-auto flex max-w-7xl flex-col px-5 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:px-12 lg:pb-28 lg:pt-28">
        <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-gray-900/10 bg-white/70 px-3 py-1 text-[12px] font-medium text-gray-700 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          The event platform for organizers and attendees
        </span>

        <h1 className="max-w-4xl font-semibold leading-[1.04] tracking-[-0.03em] text-gray-900 text-[clamp(2.1rem,7vw,4.6rem)]">
          Run events people
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          actually <span className="text-brand">show up</span> to.
        </h1>

        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-gray-600 sm:text-base">
          Build and publish events, register attendees without overselling, issue tickets, check
          people in, and measure it all — from one clean workspace.
        </p>

        <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
          <RollButton
            label={!isAuthenticated ? 'Get started free' : isOrganizer ? 'Create an event' : 'Find an event'}
            to={primaryTo}
            className="rounded-full bg-brand py-2.5 pl-6 pr-2.5 text-[14px] font-medium text-white transition-colors hover:bg-brand-hover"
            circleClassName="w-8 h-8 bg-white"
            arrowClassName="text-brand w-4 h-4"
          />
          <Link
            to="/events"
            className="group inline-flex items-center gap-2 rounded-full border border-gray-900/10 bg-white/80 px-5 py-2.5 text-[14px] font-medium text-gray-900 backdrop-blur transition-colors hover:bg-white"
          >
            Browse live events
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-14 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          <HeroFeature icon={<CalendarCheck className="h-4 w-4" />} title="Capacity-safe">
            Registration never oversells a sold-out event.
          </HeroFeature>
          <HeroFeature icon={<ScanLine className="h-4 w-4" />} title="Ticket check-in">
            Hashed ticket codes scanned at the door.
          </HeroFeature>
          <HeroFeature icon={<BarChart3 className="h-4 w-4" />} title="Live analytics">
            Confirmations, check-ins, and no-shows.
          </HeroFeature>
        </div>
      </div>
    </section>
  );
}

class ShaderErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.warn('Hero shader failed to render.', error, info);
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function HeroFeature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-900/5 bg-white/70 p-4 backdrop-blur">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white">
        {icon}
      </div>
      <h3 className="mt-3 text-[13px] font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-[12px] leading-snug text-gray-500">{children}</p>
    </div>
  );
}
