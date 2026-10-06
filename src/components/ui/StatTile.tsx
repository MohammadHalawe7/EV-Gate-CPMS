import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cx } from '@/lib/utils';

export function StatTile({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  icon,
  accent = 'brand',
  footer,
  to,
  className,
  invertDelta,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  icon?: ReactNode;
  accent?: 'brand' | 'accent' | 'success' | 'danger' | 'info' | 'plum' | 'neutral';
  footer?: ReactNode;
  to?: string;
  className?: string;
  /** When true a negative delta is good (e.g. faults down). */
  invertDelta?: boolean;
}) {
  const accents: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-800',
    accent: 'bg-accent-50 text-accent-700',
    success: 'bg-success-50 text-success-700',
    danger: 'bg-danger-50 text-danger-700',
    info: 'bg-info-50 text-info-700',
    plum: 'bg-plum-50 text-plum-700',
    neutral: 'bg-ink-100 text-ink-600',
  };

  const good = delta === undefined ? undefined : invertDelta ? delta <= 0 : delta >= 0;

  const body = (
    <div
      className={cx(
        'group flex h-full flex-col rounded-[10px] border border-ink-200 bg-white p-4 transition-colors',
        to && 'hover:border-brand-300 hover:bg-brand-50/25',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p dir="auto" className="text-[12.5px] font-medium text-ink-500">{label}</p>
        {icon && (
          <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] [&>svg]:h-4 [&>svg]:w-4', accents[accent])}>
            {icon}
          </span>
        )}
      </div>
      <div dir="auto" className="mt-2 flex items-baseline gap-1.5">
        <span className="tnum text-[24px] font-semibold leading-none tracking-tight text-ink-900">{value}</span>
        {unit && <span className="text-[12.5px] text-ink-500">{unit}</span>}
      </div>
      {(delta !== undefined || deltaLabel || footer) && (
        <div dir="auto" className="mt-2.5 flex items-center gap-2 text-[12px]">
          {delta !== undefined && (
            <span
              className={cx(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tnum',
                good ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700',
              )}
            >
              {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {deltaLabel && <span className="text-ink-400">{deltaLabel}</span>}
          {footer}
        </div>
      )}
    </div>
  );

  return to ? (
    <Link to={to} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
