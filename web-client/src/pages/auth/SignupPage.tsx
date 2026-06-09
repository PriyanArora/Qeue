import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCog, Ticket } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { useAuth } from '../../lib/auth';
import { ApiError } from '../../lib/api';
import type { Role } from '../../lib/types';

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>('ATTENDEE');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFields({});
    setLoading(true);
    try {
      const user = await register({ email, password, displayName, role });
      navigate(user.role === 'ORGANIZER' ? '/organizer' : '/events', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) setFields(err.fields);
      } else {
        setError('Could not create your account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        <>
          Already have one?{' '}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">
            {error}
          </div>
        )}

        <div>
          <p className="mb-2 text-[13px] font-medium text-gray-700">I want to…</p>
          <div className="grid grid-cols-2 gap-3">
            <RoleOption
              active={role === 'ATTENDEE'}
              onClick={() => setRole('ATTENDEE')}
              icon={<Ticket className="h-5 w-5" />}
              title="Attend events"
              desc="Register & get tickets"
            />
            <RoleOption
              active={role === 'ORGANIZER'}
              onClick={() => setRole('ORGANIZER')}
              icon={<CalendarCog className="h-5 w-5" />}
              title="Organize events"
              desc="Build & run events"
            />
          </div>
        </div>

        <Field label="Full name" htmlFor="name" required error={fields.displayName}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jane Doe"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </Field>
        <Field label="Email" htmlFor="email" required error={fields.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          required
          hint="At least 8 characters."
          error={fields.password}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </Field>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

function RoleOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all ${
        active
          ? 'border-brand bg-brand-soft ring-2 ring-brand/20'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          active ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {icon}
      </span>
      <span>
        <span className="block text-[13px] font-semibold text-gray-900">{title}</span>
        <span className="block text-[11px] text-gray-500">{desc}</span>
      </span>
    </button>
  );
}
