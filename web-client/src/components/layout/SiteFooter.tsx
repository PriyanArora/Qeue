import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Build, publish, and run events end to end — registration, tickets, check-in,
              analytics, and surveys in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterCol
              title="Product"
              links={[
                ['Browse events', '/events'],
                ['Create an event', '/organizer/events/new'],
                ['Organizer dashboard', '/organizer'],
              ]}
            />
            <FooterCol
              title="Account"
              links={[
                ['Sign in', '/login'],
                ['Get started', '/signup'],
                ['My tickets', '/my/registrations'],
              ]}
            />
            <FooterCol
              title="Platform"
              links={[
                ['In-person events', '/events'],
                ['Online events', '/events'],
                ['Hybrid events', '/events'],
              ]}
            />
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 text-xs text-gray-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Qeue. A learning portfolio project.</p>
          <p>Made for organizers and attendees.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-[13px] font-semibold text-gray-900">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map(([label, to]) => (
          <li key={label + to}>
            <Link to={to} className="text-[13px] text-gray-500 transition-colors hover:text-gray-900">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
