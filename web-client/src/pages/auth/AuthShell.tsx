import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '../../components/layout/Logo';

/** Two-pane auth layout: form on the left, brand panel on the right. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <Logo />
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm py-10">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gray-900 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-[#2a1206]" />
        <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="relative flex h-full flex-col justify-between p-14">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Event management, end to end
          </span>
          <div>
            <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
              The clean way to build, publish, and run your events.
            </h2>
            <ul className="mt-8 space-y-3">
              {[
                'Publish events and never oversell capacity',
                'Issue tickets and check attendees in at the door',
                'Measure turnout with live analytics and surveys',
              ].map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-white/40">© {new Date().getFullYear()} Qeue</p>
        </div>
      </div>
    </div>
  );
}
