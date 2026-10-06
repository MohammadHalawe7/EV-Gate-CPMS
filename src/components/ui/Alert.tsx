import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cx } from '@/lib/utils';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<AlertTone, { wrap: string; icon: string; title: string }> = {
  info: { wrap: 'bg-info-50 border-info-100', icon: 'text-info-500', title: 'text-info-700' },
  success: { wrap: 'bg-success-50 border-success-100', icon: 'text-success-500', title: 'text-success-700' },
  warning: { wrap: 'bg-warning-50 border-warning-100', icon: 'text-warning-500', title: 'text-warning-700' },
  danger: { wrap: 'bg-danger-50 border-danger-100', icon: 'text-danger-500', title: 'text-danger-700' },
  neutral: { wrap: 'bg-ink-50 border-ink-200', icon: 'text-ink-500', title: 'text-ink-800' },
};

const ICONS: Record<AlertTone, ReactNode> = {
  info: <Info className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  danger: <XCircle className="h-4 w-4" />,
  neutral: <Info className="h-4 w-4" />,
};

/**
 * Inline banner. Use for state that belongs to the page (a tenant is suspended,
 * a charge point is offline, a form failed validation). Transient confirmation
 * of something the user just did belongs in a Toast instead.
 */
export function Alert({
  tone = 'info',
  title,
  children,
  icon,
  action,
  onDismiss,
  compact,
  className,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  compact?: boolean;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx('flex items-start gap-2.5 rounded-[10px] border', compact ? 'p-2.5' : 'p-3.5', t.wrap, className)}
    >
      <span className={cx('mt-px shrink-0 [&>svg]:h-4 [&>svg]:w-4', t.icon)}>{icon ?? ICONS[tone]}</span>
      <div className="min-w-0 flex-1">
        {title && <p className={cx('text-[13px] font-semibold', t.title)}>{title}</p>}
        {children && (
          <div className={cx('text-[12.5px] leading-relaxed text-ink-600', Boolean(title) && 'mt-0.5')} dir="auto">
            {children}
          </div>
        )}
        {action && <div className="mt-2.5 flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-me-0.5 shrink-0 text-ink-400 transition-colors hover:text-ink-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
