import type { ReactNode } from 'react';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';
import { Button } from './Button';

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-gray-400 ${className}`} />;
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-rose-400" />
      <p className="max-w-sm text-sm text-rose-700">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white/60 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
