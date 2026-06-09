import { Link } from 'react-router-dom';

export function Logo({ light = false, to = '/' }: { light?: boolean; to?: string }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 transition-transform group-hover:scale-105">
        <QMark />
      </span>
      <span
        className={`text-[17px] font-semibold tracking-tight ${light ? 'text-white' : 'text-gray-900'}`}
      >
        Qeue
      </span>
    </Link>
  );
}

function QMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="#F26522" strokeWidth="2.4" />
      <path d="M15 15l4 4" stroke="#F26522" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
