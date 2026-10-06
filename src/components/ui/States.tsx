import type { ReactNode } from 'react';
import { AlertOctagon, Loader2, ShieldAlert, WifiOff } from 'lucide-react';
import { cx } from '@/lib/utils';
import { Button } from './Button';
import { Skeleton } from './Surface';

/* -------------------------------------------------------------------------- */
/* Loading                                                                     */
/* -------------------------------------------------------------------------- */

/** Centred spinner for a whole panel or route. */
export function LoadingState({
  label = 'Loading…',
  compact,
  className,
}: {
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cx('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-16 px-6', className)}
    >
      <Loader2 className="h-5 w-5 animate-spin text-brand-700" />
      <p className="mt-2.5 text-[13px] text-ink-500">{label}</p>
    </div>
  );
}

/** Shimmer placeholders shaped like a table — keeps layout stable while loading. */
export function TableSkeleton({ rows = 5, columns = 5, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cx('overflow-hidden rounded-[10px] border border-ink-200 bg-white', className)}>
      <div className="flex gap-3 border-b border-ink-200 bg-ink-50/80 px-3.5 py-2.5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className={cx('h-3', i === 0 ? 'w-32' : 'w-20')} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 border-b border-ink-100 px-3.5 py-3 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cx('h-3.5', c === 0 ? 'w-40' : 'w-16')} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Placeholder for a KPI tile. */
export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cx('rounded-[10px] border border-ink-200 bg-white p-4', className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-6 w-20" />
      <Skeleton className="mt-3 h-3 w-28" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Error                                                                       */
/* -------------------------------------------------------------------------- */

export type ErrorKind = 'generic' | 'offline' | 'forbidden';

const ERROR_ICONS: Record<ErrorKind, ReactNode> = {
  generic: <AlertOctagon className="h-5 w-5" />,
  offline: <WifiOff className="h-5 w-5" />,
  forbidden: <ShieldAlert className="h-5 w-5" />,
};

/**
 * Full-panel failure. Always says what happened and offers the way out —
 * never a bare "Something went wrong".
 */
export function ErrorState({
  kind = 'generic',
  title = 'Could not load this view',
  description = 'The request did not complete. Retry, or contact platform support if it keeps happening.',
  detail,
  onRetry,
  retryLabel = 'Retry',
  action,
  compact,
  className,
}: {
  kind?: ErrorKind;
  title?: string;
  description?: string;
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cx('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-16 px-6', className)}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger-50 text-danger-500">
        {ERROR_ICONS[kind]}
      </div>
      <h4 className="text-[14px] font-semibold text-ink-800">{title}</h4>
      <p className="mt-1 max-w-sm text-[13px] text-ink-500">{description}</p>
      {detail && (
        <code className="mt-2.5 rounded-[6px] bg-ink-100 px-2 py-1 font-mono text-[11.5px] text-ink-600">{detail}</code>
      )}
      {(onRetry || action) && (
        <div className="mt-4 flex items-center gap-2">
          {onRetry && (
            <Button variant="primary" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
