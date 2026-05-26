import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/events');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/events" className="brand">Qeue</Link>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/events">Events</NavLink>
          {user?.role === 'ORGANIZER' && <NavLink to="/organizer/events">Organizer</NavLink>}
          {user?.role === 'ATTENDEE' && <NavLink to="/me/registrations">My registrations</NavLink>}
        </nav>
        <div className="session">
          {user ? (
            <>
              <span>{user.displayName}</span>
              <button type="button" className="button secondary" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link className="button secondary" to="/login">Log in</Link>
              <Link className="button" to="/register">Register</Link>
            </>
          )}
        </div>
      </header>
      <main className="page-frame">
        <Outlet />
      </main>
    </div>
  );
}
