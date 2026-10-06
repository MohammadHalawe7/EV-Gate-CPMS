import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Download, SlidersHorizontal, X } from 'lucide-react';
import { cx, downloadFile, formatMoney, formatNumber, toCsv } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { SearchInput, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';

/* -------------------------------------------------------------------------- */
/* Filter bar                                                                  */
/* -------------------------------------------------------------------------- */

export interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  width?: string;
}

export function useFilters(defs: FilterDef[]) {
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const active = useMemo(() => Object.entries(values).filter(([, v]) => v !== '' && v !== undefined), [values]);
  return {
    search,
    setSearch,
    values,
    setValue: (key: string, value: string) => setValues((p) => ({ ...p, [key]: value })),
    reset: () => {
      setValues({});
      setSearch('');
    },
    activeCount: active.length + (search ? 1 : 0),
    defs,
    matches: (row: Record<string, string | undefined>) =>
      active.every(([key, value]) => (row[key] ?? '') === value),
  };
}

export function FilterBar({
  state,
  placeholder,
  actions,
  className,
}: {
  state: ReturnType<typeof useFilters>;
  placeholder?: string;
  actions?: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={cx('flex flex-wrap items-center gap-2', className)}>
      <SearchInput value={state.search} onChange={state.setSearch} placeholder={placeholder ?? `${t('common.search')}…`} className="w-full min-w-[200px] sm:w-64" />
      {state.defs.map((def) => (
        <div key={def.key} className={cx('shrink-0', def.width ?? 'w-[152px]')}>
          <Select value={state.values[def.key] ?? ''} onChange={(e) => state.setValue(def.key, e.target.value)} aria-label={def.label}>
            <option value="">{def.label}</option>
            {def.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      ))}
      {state.activeCount > 0 && (
        <Button size="sm" variant="ghost" icon={<X className="h-3.5 w-3.5" />} onClick={state.reset}>
          {t('common.clearAll')}
        </Button>
      )}
      {actions && <div className="ms-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function FilterCount({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[11.5px] font-medium text-brand-800">
      <SlidersHorizontal className="h-3 w-3" />
      {count}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Export                                                                      */
/* -------------------------------------------------------------------------- */

export function ExportButton<T extends Record<string, unknown>>({
  rows,
  filename,
  columns,
  label,
  size = 'sm',
}: {
  rows: T[];
  filename: string;
  columns?: { key: keyof T; label: string }[];
  label?: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  const { t } = useI18n();
  const toast = useToast();
  return (
    <Button
      size={size}
      icon={<Download className="h-3.5 w-3.5" />}
      onClick={() => {
        downloadFile(`${filename}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, columns));
        toast.success(t('toast.exported'), `${rows.length} rows exported`);
      }}
    >
      {label ?? t('common.exportCsv')}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* Cells                                                                       */
/* -------------------------------------------------------------------------- */

export function Money({ value, currency = 'AED', decimals = 2, muted }: { value: number; currency?: string; decimals?: number; muted?: boolean }) {
  return (
    <span className={cx('tnum whitespace-nowrap', muted ? 'text-ink-500' : 'font-medium text-ink-900')}>
      <span className="text-[11px] text-ink-400">{currency} </span>
      {formatNumber(value, decimals)}
    </span>
  );
}

export function Energy({ value }: { value: number }) {
  return (
    <span className="tnum whitespace-nowrap">
      {formatNumber(value, value < 100 ? 2 : 1)}
      <span className="ms-1 text-[11px] text-ink-400">kWh</span>
    </span>
  );
}

export function Power({ value }: { value: number }) {
  return (
    <span className="tnum whitespace-nowrap">
      {formatNumber(value, value < 100 ? 1 : 0)}
      <span className="ms-1 text-[11px] text-ink-400">kW</span>
    </span>
  );
}

export function RecordLink({ to, title, subtitle, color }: { to: string; title: ReactNode; subtitle?: ReactNode; color?: string }) {
  return (
    <Link to={to} className="group flex min-w-0 items-center gap-2.5">
      {color && <span className="h-6 w-1 shrink-0 rounded-full" style={{ background: color }} />}
      <span className="min-w-0">
        <span className="block truncate font-medium text-ink-900 group-hover:text-brand-800">{title}</span>
        {subtitle && <span className="block truncate text-[11.5px] text-ink-500">{subtitle}</span>}
      </span>
    </Link>
  );
}

export function MutedText({ children }: { children: ReactNode }) {
  return <span className="text-ink-400">{children}</span>;
}

export function KeyValueGrid({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <div className="divide-y divide-ink-100">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
          <span className="text-[12.5px] text-ink-500">{row.label}</span>
          <span className="text-end text-[12.5px] font-medium text-ink-900">{row.value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
}

export function TotalsRow({ items }: { items: { label: string; value: number; currency?: boolean; strong?: boolean }[] }) {
  return (
    <dl className="divide-y divide-ink-100">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between py-1.5">
          <dt dir="auto" className={cx('text-[12.5px]', item.strong ? 'font-medium text-ink-800' : 'text-ink-500')}>{item.label}</dt>
          <dd dir="auto" className={cx('tnum text-[12.5px]', item.strong ? 'font-semibold text-ink-900' : 'text-ink-700')}>
            {item.currency === false ? formatNumber(item.value, 2) : formatMoney(item.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
