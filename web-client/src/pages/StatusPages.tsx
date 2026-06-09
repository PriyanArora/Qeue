import { Compass, ShieldAlert } from 'lucide-react';
import { Container } from '../components/layout/Page';
import { ButtonLink } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <StatusShell
      icon={<Compass className="h-8 w-8" />}
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved."
      primary={{ label: 'Back to home', to: '/' }}
      secondary={{ label: 'Browse events', to: '/events' }}
    />
  );
}

export function ForbiddenPage() {
  return (
    <StatusShell
      icon={<ShieldAlert className="h-8 w-8" />}
      code="403"
      title="You don't have access"
      description="This area is for a different account role. Sign in with the right account to continue."
      primary={{ label: 'Back to home', to: '/' }}
      secondary={{ label: 'Sign in', to: '/login' }}
    />
  );
}

function StatusShell({
  icon,
  code,
  title,
  description,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  code: string;
  title: string;
  description: string;
  primary: { label: string; to: string };
  secondary: { label: string; to: string };
}) {
  return (
    <div className="flex min-h-[70vh] items-center bg-[#F5F5F5]">
      <Container className="text-center">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 text-white">
            {icon}
          </div>
          <p className="mt-6 text-[13px] font-semibold uppercase tracking-widest text-brand">{code}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{title}</h1>
          <p className="mt-3 text-sm text-gray-500">{description}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink to={primary.to}>{primary.label}</ButtonLink>
            <ButtonLink to={secondary.to} variant="outline">{secondary.label}</ButtonLink>
          </div>
        </div>
      </Container>
    </div>
  );
}
