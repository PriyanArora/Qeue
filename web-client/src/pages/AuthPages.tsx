import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiClientError, api } from '../services/api';
import type { UserRole } from '../services/types';
import { useAuth } from '../state/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const response = await api.login({ email, password });
      login(response);
      navigate(response.role === 'ORGANIZER' ? '/organizer/events' : location.state?.from ?? '/events');
    } catch (err) {
      setError(messageFor(err, 'Login failed'));
    }
  }

  return (
    <section className="narrow-panel">
      <h1>Log in</h1>
      <form className="form-grid" onSubmit={handleSubmit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <label>
          Email
          <input type="email" value={email} onChange={event => setEmail(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={event => setPassword(event.target.value)} required />
        </label>
        <button className="button" type="submit">Log in</button>
      </form>
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
    </section>
  );
}

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('ATTENDEE');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const response = await api.register({ email, password, displayName, role });
      login(response);
      navigate(response.role === 'ORGANIZER' ? '/organizer/events' : '/events');
    } catch (err) {
      setError(messageFor(err, 'Registration failed'));
    }
  }

  return (
    <section className="narrow-panel">
      <h1>Register</h1>
      <form className="form-grid" onSubmit={handleSubmit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <label>
          Display name
          <input value={displayName} onChange={event => setDisplayName(event.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={event => setEmail(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} />
        </label>
        <label>
          Role
          <select value={role} onChange={event => setRole(event.target.value as UserRole)}>
            <option value="ATTENDEE">Attendee</option>
            <option value="ORGANIZER">Organizer</option>
          </select>
        </label>
        <button className="button" type="submit">Create account</button>
      </form>
    </section>
  );
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback;
}
