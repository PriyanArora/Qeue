import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Ticket,
  X,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Logo } from './Logo';
import { ButtonLink } from '../ui/Button';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition-colors ${
    isActive ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'
  }`;

export function SiteHeader() {
  const { isAuthenticated, isOrganizer, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/events" className={navLinkClass}>
              Browse events
            </NavLink>
            {isAuthenticated && !isOrganizer && (
              <NavLink to="/my/registrations" className={navLinkClass}>
                My tickets
              </NavLink>
            )}
            {isOrganizer && (
              <NavLink to="/organizer" className={navLinkClass}>
                Organizer
              </NavLink>
            )}
          </nav>
        </div>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Sign in
              </Link>
              <ButtonLink to="/signup" size="sm">
                Get started
              </ButtonLink>
            </>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-1.5 pr-3 transition-colors hover:border-gray-300"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold text-white">
                  {initials(user?.displayName || user?.email || '?')}
                </span>
                <span className="max-w-[120px] truncate text-[13px] font-medium text-gray-800">
                  {user?.displayName}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-100 bg-white p-1.5 shadow-pop animate-scale-in">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-medium text-gray-900">{user?.displayName}</p>
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-ink">
                      {user?.role === 'ORGANIZER' ? 'Organizer' : 'Attendee'}
                    </span>
                  </div>
                  <div className="my-1 h-px bg-gray-100" />
                  {isOrganizer ? (
                    <MenuItem to="/organizer" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                      Organizer dashboard
                    </MenuItem>
                  ) : (
                    <MenuItem to="/my/registrations" icon={<Ticket className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                      My tickets
                    </MenuItem>
                  )}
                  <MenuItem to="/events" icon={<CalendarDays className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                    Browse events
                  </MenuItem>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-full bg-gray-900 p-2.5 text-white md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            <MobileLink to="/events" onClick={() => setMobileOpen(false)}>Browse events</MobileLink>
            {isAuthenticated && !isOrganizer && (
              <MobileLink to="/my/registrations" onClick={() => setMobileOpen(false)}>My tickets</MobileLink>
            )}
            {isOrganizer && (
              <MobileLink to="/organizer" onClick={() => setMobileOpen(false)}>Organizer dashboard</MobileLink>
            )}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
            {!isAuthenticated ? (
              <>
                <ButtonLink to="/login" variant="outline" onClick={() => setMobileOpen(false)}>
                  Sign in
                </ButtonLink>
                <ButtonLink to="/signup" onClick={() => setMobileOpen(false)}>
                  Get started
                </ButtonLink>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold text-white">
                    {initials(user?.displayName || '?')}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.displayName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuItem({
  to,
  icon,
  children,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
    >
      {icon}
      {children}
    </Link>
  );
}

function MobileLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-xl px-3 py-2.5 text-[15px] ${
          isActive ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-700'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
