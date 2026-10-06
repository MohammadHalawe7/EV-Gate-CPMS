import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

export type Tone =
  | 'neutral'
  | 'brand'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'plum'
  | 'purple';

const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  brand: 'bg-brand-50 text-brand-800 ring-brand-100',
  accent: 'bg-accent-50 text-accent-800 ring-accent-200',
  success: 'bg-success-50 text-success-700 ring-success-100',
  warning: 'bg-warning-50 text-warning-700 ring-warning-100',
  danger: 'bg-danger-50 text-danger-700 ring-danger-100',
  info: 'bg-info-50 text-info-700 ring-info-100',
  plum: 'bg-plum-50 text-plum-700 ring-plum-100',
  purple: 'bg-brand-100 text-brand-800 ring-brand-200',
};

const DOTS: Record<Tone, string> = {
  neutral: 'bg-ink-400',
  brand: 'bg-brand-700',
  accent: 'bg-accent-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-info-500',
  plum: 'bg-plum-600',
  purple: 'bg-brand-600',
};

export function Badge({
  tone = 'neutral',
  children,
  dot,
  pulse,
  size = 'md',
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset whitespace-nowrap',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-[12px]',
        TONES[tone],
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={cx('h-1.5 w-1.5 rounded-full', DOTS[tone], pulse && 'eg-live-dot')} />
        </span>
      )}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Status → tone mapping shared across the whole application                   */
/* -------------------------------------------------------------------------- */

const STATUS_TONES: Record<string, Tone> = {
  // Connector / EVSE
  Available: 'success',
  Preparing: 'info',
  Charging: 'info',
  SuspendedEV: 'warning',
  SuspendedEVSE: 'warning',
  Finishing: 'purple',
  Reserved: 'accent',
  Unavailable: 'neutral',
  Faulted: 'danger',
  // Station
  Online: 'success',
  Offline: 'neutral',
  Maintenance: 'warning',
  Provisioning: 'info',
  // Onboarding / registration lifecycle
  Submitted: 'info',
  UnderReview: 'warning',
  Demo: 'accent',
  Converted: 'success',
  Withdrawn: 'neutral',
  // Entity
  Active: 'success',
  Suspended: 'warning',
  Draft: 'neutral',
  Archived: 'neutral',
  Blocked: 'danger',
  Invited: 'info',
  Frozen: 'danger',
  // Sessions
  Starting: 'info',
  Stopping: 'purple',
  Completed: 'success',
  Failed: 'danger',
  // Transactions / payments
  InProgress: 'info',
  PendingSettlement: 'warning',
  Refunded: 'plum',
  PartiallyRefunded: 'plum',
  Disputed: 'danger',
  Authorized: 'info',
  Captured: 'info',
  Settled: 'success',
  Voided: 'neutral',
  // Invoices
  Issued: 'info',
  Paid: 'success',
  Overdue: 'danger',
  Void: 'neutral',
  // Settlements
  Pending: 'warning',
  Approved: 'info',
  Processing: 'info',
  OnHold: 'danger',
  // Reservations
  Used: 'success',
  Expired: 'neutral',
  Cancelled: 'neutral',
  Rejected: 'danger',
  // RFID
  Accepted: 'success',
  Invalid: 'danger',
  // Alerts
  Open: 'danger',
  Acknowledged: 'warning',
  Resolved: 'success',
  Suppressed: 'neutral',
  // Tickets
  Scheduled: 'info',
  AwaitingParts: 'warning',
  Closed: 'success',
  // Commands
  Queued: 'neutral',
  Sent: 'info',
  TimedOut: 'warning',
  // Firmware
  Idle: 'neutral',
  Downloading: 'info',
  Downloaded: 'info',
  Installing: 'info',
  Installed: 'success',
  DownloadFailed: 'danger',
  InstallationFailed: 'danger',
  Uploading: 'info',
  Uploaded: 'success',
  UploadFailed: 'danger',
  // Health
  Operational: 'success',
  Degraded: 'warning',
  Down: 'danger',
  // Severity
  Critical: 'danger',
  Major: 'warning',
  Minor: 'info',
  Info: 'neutral',
  // Roaming / releases
  Connected: 'success',
  Live: 'success',
  Rollout: 'info',
  Review: 'warning',
  Deprecated: 'neutral',
  Processed: 'success',
};

export function statusTone(status: string): Tone {
  return STATUS_TONES[status] ?? 'neutral';
}

export function StatusBadge({
  status,
  label,
  size = 'md',
  pulse,
  className,
}: {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}) {
  return (
    <Badge tone={statusTone(status)} dot size={size} pulse={pulse} className={className}>
      {label ?? humanise(status)}
    </Badge>
  );
}

export function humanise(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

export function SeverityDot({ severity }: { severity: string }) {
  const tone = statusTone(severity);
  return <span className={cx('inline-block h-2 w-2 rounded-full', DOTS[tone])} />;
}
