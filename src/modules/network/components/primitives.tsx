/* =============================================================================
 * Network module — shared primitives.
 *
 * Composed entirely from the EV Gate Design System. Nothing here introduces a
 * colour, radius or shadow: these are arrangements of existing components that
 * recur across Locations, Stations, Connectors and OCPP, lifted so that the
 * screens stay short and cannot drift apart.
 * ========================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CornerDownRight,
  Info,
  RotateCcw,
  Save,
} from 'lucide-react';
import { cx, formatNumber } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { Badge, StatusBadge, type Tone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel, PanelHeader } from '@/components/ui/Surface';
import { Tooltip } from '@/components/ui/Tooltip';
import type { ConnectorStatus, PowerType, TariffSource } from '@/domain/network';

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

/** A titled panel with consistent internal rhythm. The module's workhorse. */
export function Section({
  title,
  subtitle,
  action,
  children,
  className,
  padded = true,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <Panel className={className} padded={padded}>
      <div className={cx(!padded && 'p-4 pb-0')}>
        <PanelHeader title={title} subtitle={subtitle} action={action} />
      </div>
      {children}
    </Panel>
  );
}

/** Responsive form grid. One column on a phone, two from `sm`. */
export function FormGrid({
  children,
  columns = 2,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const cols =
    columns === 1 ? '' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2';
  return <div className={cx('grid grid-cols-1 gap-4', cols, className)}>{children}</div>;
}

/** Makes a field span the full width of a `FormGrid`. */
export function Span({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('sm:col-span-full', className)}>{children}</div>;
}

/* -------------------------------------------------------------------------- */
/* Inheritance                                                                 */
/* -------------------------------------------------------------------------- */

const SOURCE_KEY: Record<TariffSource, string> = {
  connector: 'inherit.connector',
  evse: 'inherit.evse',
  station: 'inherit.station',
  location: 'inherit.location',
  company: 'inherit.company',
  none: 'inherit.none',
};

/**
 * Says where a value came from. The single most useful thing an operations
 * product can tell somebody looking at a price they did not set.
 */
export function InheritedFrom({
  source,
  own,
  onOverride,
  onClear,
  className,
}: {
  source: TariffSource;
  /** True when this level sets the value itself rather than inheriting it. */
  own: boolean;
  onOverride?: () => void;
  onClear?: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <span className={cx('inline-flex flex-wrap items-center gap-2 text-[11.5px]', className)}>
      {own ? (
        <Badge tone="brand" size="sm">{t('inherit.overridden')}</Badge>
      ) : (
        <span className="inline-flex items-center gap-1 text-ink-500">
          <CornerDownRight className="h-3 w-3 text-ink-400 rtl:-scale-x-100" />
          {t('inherit.from', { level: t(SOURCE_KEY[source] as never) })}
        </span>
      )}
      {own && onClear && (
        <button type="button" onClick={onClear} className="font-medium text-brand-700 hover:text-brand-900">
          {t('inherit.revert')}
        </button>
      )}
      {!own && onOverride && (
        <button type="button" onClick={onOverride} className="font-medium text-brand-700 hover:text-brand-900">
          {t('inherit.override')}
        </button>
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Charging-specific display                                                   */
/* -------------------------------------------------------------------------- */

/** Connector status as a dot. Always paired with a label by its caller. */
export function ConnectorDot({ status, className }: { status: ConnectorStatus; className?: string }) {
  const map: Record<ConnectorStatus, string> = {
    Available: 'bg-success-500',
    Preparing: 'bg-info-500',
    Charging: 'bg-info-600',
    SuspendedEV: 'bg-warning-500',
    SuspendedEVSE: 'bg-warning-500',
    Finishing: 'bg-brand-500',
    Reserved: 'bg-accent-500',
    Unavailable: 'bg-ink-400',
    Faulted: 'bg-danger-500',
  };
  return <span className={cx('inline-block h-2 w-2 shrink-0 rounded-full', map[status], className)} />;
}

/** A compact connector chip — number, type and live status in one unit. */
export function ConnectorChip({
  number,
  type,
  status,
  powerKw,
  onClick,
}: {
  number: number;
  type: string;
  status: ConnectorStatus;
  powerKw?: number;
  onClick?: () => void;
}) {
  const { t } = useI18n();
  const content = (
    <span className="flex items-center gap-2 rounded-[7px] border border-ink-200 bg-white px-2 py-1">
      <span className="tnum flex h-5 w-5 items-center justify-center rounded-[5px] bg-ink-100 text-[10.5px] font-semibold text-ink-600">
        {number}
      </span>
      <span className="text-[12px] font-medium text-ink-800">{type}</span>
      {powerKw !== undefined && <span className="tnum text-[11px] text-ink-400">{formatNumber(powerKw)} kW</span>}
      <ConnectorDot status={status} />
    </span>
  );
  if (!onClick) return <Tooltip label={t(`status.${status}` as never)}>{content}</Tooltip>;
  return (
    <button type="button" onClick={onClick} className="transition-opacity hover:opacity-80">
      <Tooltip label={t(`status.${status}` as never)}>{content}</Tooltip>
    </button>
  );
}

export function PowerTypeLabel({ value }: { value: PowerType }) {
  const { t } = useI18n();
  return <span className="text-[12.5px] text-ink-700">{t(`power.${value}` as never)}</span>;
}

/**
 * The site power budget. A location whose chargers can draw more than its
 * grid feed is a real operational hazard, so it is shown rather than implied.
 */
export function PowerBudget({
  installedKw,
  limitKw,
  gridKw,
  compact,
}: {
  installedKw: number;
  limitKw: number;
  gridKw: number;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const denominator = Math.max(gridKw, installedKw, 1);
  const installedPct = Math.min(100, (installedKw / denominator) * 100);
  const limitPct = Math.min(100, (limitKw / denominator) * 100);
  const over = installedKw > gridKw && gridKw > 0;

  return (
    <div className={cx('w-full', compact ? 'space-y-1.5' : 'space-y-2')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[12px] text-ink-500">{t('power.installed')}</span>
        <span className="tnum text-[12.5px] font-medium text-ink-900">
          {formatNumber(installedKw)} / {formatNumber(gridKw)} kW
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className={cx('absolute inset-y-0 start-0 rounded-full', over ? 'bg-danger-500' : 'bg-brand-700')}
          style={{ width: `${installedPct}%` }}
        />
        {limitKw > 0 && (
          <span
            className="absolute inset-y-0 w-px bg-accent-600"
            style={{ insetInlineStart: `${limitPct}%` }}
            aria-hidden
          />
        )}
      </div>
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
          <span className="inline-flex items-center gap-1.5 text-ink-400">
            <span className="inline-block h-2 w-px bg-accent-600" aria-hidden />
            {t('power.siteLimit', { value: formatNumber(limitKw) })}
          </span>
          {over ? (
            <span className="inline-flex items-center gap-1 font-medium text-danger-700">
              <AlertTriangle className="h-3 w-3" />
              {t('power.overSubscribed')}
            </span>
          ) : (
            <span className="tnum text-ink-400">{t('power.headroom', { value: formatNumber(gridKw - installedKw) })}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small display helpers                                                       */
/* -------------------------------------------------------------------------- */

/** Label over value. Used anywhere a `DetailList` would be too heavy. */
export function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: 'default' | 'danger' | 'success' | 'muted';
  hint?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p dir="auto" className="text-[11.5px] font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p
        dir="auto"
        className={cx(
          'mt-0.5 truncate text-[14px] font-semibold',
          tone === 'danger' ? 'text-danger-700' : tone === 'success' ? 'text-success-700' : tone === 'muted' ? 'text-ink-500' : 'text-ink-900',
        )}
      >
        {value}
      </p>
      {hint && <p dir="auto" className="mt-0.5 text-[11.5px] text-ink-400">{hint}</p>}
    </div>
  );
}

/** A row of counts with a leading dot — the status breakdown pattern. */
export function CountRow({ items }: { items: { label: string; value: number; tone: Tone }[] }) {
  const dots: Record<Tone, string> = {
    neutral: 'bg-ink-400', brand: 'bg-brand-700', accent: 'bg-accent-500', success: 'bg-success-500',
    warning: 'bg-warning-500', danger: 'bg-danger-500', info: 'bg-info-500', plum: 'bg-plum-600', purple: 'bg-brand-600',
  };
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-[12px]">
          <span className={cx('h-1.5 w-1.5 rounded-full', dots[item.tone])} />
          <span className="tnum font-semibold text-ink-900">{item.value}</span>
          <span className="text-ink-500">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

/** A compact two-line link used inside tables. */
export function RecordCell({
  to,
  title,
  subtitle,
  badge,
}: {
  to?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
}) {
  const body = (
    <span className="flex min-w-0 flex-col">
      <span className="flex items-center gap-1.5">
        <span dir="auto" className="truncate text-[13px] font-medium text-ink-900">{title}</span>
        {badge}
      </span>
      {subtitle && <span dir="auto" className="truncate text-[11.5px] text-ink-500">{subtitle}</span>}
    </span>
  );
  if (!to) return body;
  return (
    <Link to={to} className="group flex min-w-0 items-center gap-2 hover:text-brand-800">
      {body}
    </Link>
  );
}

/** A short explanatory strip. Lighter than an `Alert`, heavier than a hint. */
export function Hint({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'warning' }) {
  const styles = {
    neutral: 'border-ink-200 bg-ink-50 text-ink-600',
    brand: 'border-brand-100 bg-brand-50 text-brand-800',
    warning: 'border-warning-100 bg-warning-50 text-warning-700',
  };
  return (
    <p dir="auto" className={cx('flex items-start gap-2 rounded-[8px] border px-3 py-2 text-[12px] leading-relaxed', styles[tone])}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
      <span>{children}</span>
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Activity timeline                                                           */
/* -------------------------------------------------------------------------- */

export function Timeline({
  items,
  emptyLabel,
}: {
  items: { id: string; action: string; detail: string; actorName: string; at: string; tone: string }[];
  emptyLabel: string;
}) {
  const { locale } = useI18n();
  if (items.length === 0) return <p className="py-6 text-center text-[12.5px] text-ink-400">{emptyLabel}</p>;

  const dot: Record<string, string> = {
    neutral: 'bg-ink-300', success: 'bg-success-500', warning: 'bg-warning-500', danger: 'bg-danger-500', info: 'bg-info-500',
  };

  return (
    <ol className="relative space-y-0">
      {items.map((item, i) => (
        <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 && <span className="absolute inset-y-0 start-[3.5px] top-4 w-px bg-ink-200" aria-hidden />}
          <span className={cx('relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full', dot[item.tone] ?? dot.neutral)} />
          <div className="min-w-0 flex-1">
            <p dir="auto" className="text-[12.5px] font-medium text-ink-900">{item.action}</p>
            {item.detail && <p dir="auto" className="text-[12px] text-ink-500">{item.detail}</p>}
            <p className="mt-0.5 text-[11px] text-ink-400">
              {item.actorName} · {new Date(item.at).toLocaleString(locale === 'ar' ? 'ar-AE' : 'en-AE', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/* Unsaved changes                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Tracks a working copy against its last saved value.
 *
 * Configuration screens in this module edit a draft and commit explicitly —
 * silently autosaving an operational setting that changes how a charger
 * behaves in the field is the wrong default.
 */
export function useDraft<T>(initial: T) {
  const [saved, setSaved] = useState<T>(initial);
  const [draft, setDraft] = useState<T>(initial);
  const baseline = useRef(initial);

  /* Adopt a new upstream value only while the draft is clean, so a background
     update can never silently discard what somebody is typing. */
  const serialisedInitial = JSON.stringify(initial);
  const serialisedSaved = JSON.stringify(saved);
  useEffect(() => {
    if (serialisedInitial !== serialisedSaved && JSON.stringify(draft) === serialisedSaved) {
      setSaved(initial);
      setDraft(initial);
      baseline.current = initial;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialisedInitial]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  const patch = useCallback((next: Partial<T>) => setDraft((prev) => ({ ...prev, ...next })), []);
  const reset = useCallback(() => setDraft(saved), [saved]);
  const commit = useCallback(
    (persist?: (value: T) => void) => {
      persist?.(draft);
      setSaved(draft);
    },
    [draft],
  );

  return { draft, setDraft, patch, dirty, reset, commit, saved };
}

/** The sticky bar that appears while a configuration draft is dirty. */
export function UnsavedBar({
  dirty,
  onSave,
  onDiscard,
  saving,
  label,
}: {
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
  label?: string;
}) {
  const { t } = useI18n();
  if (!dirty) return null;
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-4 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[12.5px] text-ink-600">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          {label ?? t('form.unsaved')}
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onDiscard} icon={<RotateCcw className="h-3.5 w-3.5" />}>
            {t('form.discard')}
          </Button>
          <Button size="sm" variant="primary" loading={saving} onClick={onSave} icon={<Save className="h-3.5 w-3.5" />}>
            {t('form.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Wizard summary                                                              */
/* -------------------------------------------------------------------------- */

/** A read-back row used in creation flows before the committing action. */
export function SummaryRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-2 last:border-0">
      <span dir="auto" className="text-[12.5px] text-ink-500">{label}</span>
      <span dir="auto" className="text-end text-[12.5px] font-medium text-ink-900">{value}</span>
    </div>
  );
}

/** A forward link rendered as a full-width card. Used in empty states. */
export function NextStepCard({
  to,
  title,
  description,
  icon,
}: {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-[9px] border border-ink-200 bg-white p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-brand-50 text-brand-700">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-ink-900">{title}</span>
        <span className="block text-[12px] text-ink-500">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
    </Link>
  );
}

/** Capability ticks on a hardware profile. */
export function CapabilityList({ items }: { items: { label: string; on: boolean }[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-[12.5px]">
          <span
            className={cx(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
              item.on ? 'bg-success-50 text-success-700' : 'bg-ink-100 text-ink-300',
            )}
          >
            {item.on ? <Check className="h-2.5 w-2.5" /> : <span className="h-px w-1.5 bg-current" />}
          </span>
          <span className={item.on ? 'text-ink-800' : 'text-ink-400'}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export { StatusBadge };
