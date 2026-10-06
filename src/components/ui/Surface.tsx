import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

export function Panel({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cx('rounded-[10px] border border-ink-200 bg-white', padded && 'p-4', className)}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
  className,
  compact,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <header
      className={cx(
        'flex items-start justify-between gap-4',
        compact ? 'mb-3' : 'mb-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h3 dir="auto" className="text-[14px] font-semibold text-ink-900 leading-tight">{title}</h3>
        {subtitle && <p dir="auto" className="mt-0.5 text-[12.5px] text-ink-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </header>
  );
}

export function Divider({ className, vertical }: { className?: string; vertical?: boolean }) {
  return vertical ? (
    <span className={cx('inline-block w-px self-stretch bg-ink-200', className)} />
  ) : (
    <hr className={cx('border-0 border-t border-ink-200', className)} />
  );
}

export function DetailList({
  items,
  columns = 2,
  className,
}: {
  items: { label: ReactNode; value: ReactNode; span?: boolean }[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const grid = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
  return (
    <dl className={cx('grid grid-cols-1 gap-x-6 gap-y-3.5', grid, className)}>
      {items.map((item, i) => (
        <div key={i} className={cx('min-w-0', item.span && 'sm:col-span-full')}>
          <dt dir="auto" className="text-[11.5px] uppercase tracking-wide text-ink-500 font-medium">{item.label}</dt>
          <dd dir="auto" className="mt-0.5 text-[13px] text-ink-900 break-words">{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-400">
          {icon}
        </div>
      )}
      <h4 className="text-[14px] font-semibold text-ink-800">{title}</h4>
      {description && <p className="mt-1 max-w-sm text-[13px] text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cx('relative overflow-hidden rounded-[6px] bg-ink-100', className)}>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
        style={{ animation: 'eg-shimmer 1.4s infinite' }}
      />
    </div>
  );
}

export function Avatar({
  name,
  color,
  size = 'md',
  className,
  src,
}: {
  name: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  src?: string;
}) {
  const dims =
    size === 'xs' ? 'h-6 w-6 text-[10px]' : size === 'sm' ? 'h-7 w-7 text-[11px]' : size === 'lg' ? 'h-11 w-11 text-[15px]' : 'h-9 w-9 text-[12.5px]';
  const letters = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', dims, className)}
      style={{ backgroundColor: color ?? '#3B185F' }}
    >
      {src ? <img src={src} alt={name} className="h-full w-full rounded-full object-cover" /> : letters}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = 'brand',
  className,
  showLabel,
  height = 6,
}: {
  value: number;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'accent' | 'info';
  className?: string;
  showLabel?: boolean;
  height?: number;
}) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-700',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    accent: 'bg-accent-400',
    info: 'bg-info-500',
  };
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cx('flex items-center gap-2', className)}>
      <div className="flex-1 overflow-hidden rounded-full bg-ink-200" style={{ height }}>
        <div className={cx('h-full rounded-full transition-[width] duration-500', colors[tone])} style={{ width: `${clamped}%` }} />
      </div>
      {showLabel && <span className="tnum text-[12px] text-ink-600 w-9 text-end">{Math.round(clamped)}%</span>}
    </div>
  );
}
