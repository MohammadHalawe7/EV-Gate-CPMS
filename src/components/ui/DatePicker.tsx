import { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/lib/utils';
import { CONTROL_BASE, CONTROL_FORCED, CONTROL_INTERACTIVE, type ControlState } from './Field';

/* -------------------------------------------------------------------------- */
/* Single date                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Date input. Uses the platform date control (so keyboard entry, locale
 * formatting and the OS picker all come for free) skinned with the shared
 * text-control tokens.
 */
export function DateInput({
  value,
  onChange,
  disabled,
  invalid,
  readOnly,
  state,
  min,
  max,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  readOnly?: boolean;
  state?: ControlState;
  min?: string;
  max?: string;
  className?: string;
}) {
  return (
    <div className={cx('relative', className)}>
      <Calendar className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          CONTROL_BASE,
          state ? CONTROL_FORCED[state] : CONTROL_INTERACTIVE,
          'h-9 ps-8.5 pe-2.5 text-[13px] [&::-webkit-calendar-picker-indicator]:opacity-60',
          readOnly && 'bg-ink-50 text-ink-600',
          invalid && 'border-danger-500 focus:border-danger-500',
        )}
      />
    </div>
  );
}

/** Two date inputs joined by an en dash — the pattern used by report filters. */
export function DateRangeInput({
  from,
  to,
  onChange,
  disabled,
  className,
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cx('flex items-center gap-2', className)}>
      <DateInput value={from} onChange={(v) => onChange({ from: v, to })} max={to || undefined} disabled={disabled} />
      <span className="text-[13px] text-ink-400">–</span>
      <DateInput value={to} onChange={(v) => onChange({ from, to: v })} min={from || undefined} disabled={disabled} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Calendar panel                                                              */
/* -------------------------------------------------------------------------- */

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function monthMatrix(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Inline month grid. Rendered on its own in the Design System so the day-cell
 * states (default / today / selected / in-range / disabled) are all visible
 * without hovering, and available to screens that want a calendar in a Popover.
 */
export function CalendarPanel({
  value,
  onSelect,
  month: controlledMonth,
  selectedRange,
  disabledBefore,
  className,
}: {
  value?: string;
  onSelect?: (iso: string) => void;
  month?: { year: number; month: number };
  selectedRange?: { from: string; to: string };
  disabledBefore?: string;
  className?: string;
}) {
  const initial = useMemo(() => {
    if (controlledMonth) return controlledMonth;
    const base = value ? new Date(`${value}T00:00:00Z`) : new Date();
    return { year: base.getUTCFullYear(), month: base.getUTCMonth() };
  }, [controlledMonth, value]);

  const [view, setView] = useState(initial);
  const cells = monthMatrix(view.year, view.month);
  const monthLabel = new Date(Date.UTC(view.year, view.month, 1)).toLocaleDateString('en-AE', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const todayIso = new Date().toISOString().slice(0, 10);

  function iso(day: number) {
    return `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return (
    <div className={cx('w-[260px] rounded-[10px] border border-ink-200 bg-white p-3', className)}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }))}
          className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-500 transition-colors hover:bg-ink-100"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <span className="text-[13px] font-semibold text-ink-900">{monthLabel}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }))}
          className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-500 transition-colors hover:bg-ink-100"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-center text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`e-${i}`} />;
          const dayIso = iso(day);
          const isSelected = dayIso === value;
          const inRange =
            selectedRange && dayIso >= selectedRange.from && dayIso <= selectedRange.to && dayIso !== selectedRange.from && dayIso !== selectedRange.to;
          const isEdge = selectedRange && (dayIso === selectedRange.from || dayIso === selectedRange.to);
          const isToday = dayIso === todayIso;
          const isDisabled = Boolean(disabledBefore && dayIso < disabledBefore);
          return (
            <button
              key={dayIso}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect?.(dayIso)}
              className={cx(
                'tnum mx-auto inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[12.5px] transition-colors',
                isDisabled && 'cursor-not-allowed text-ink-300',
                !isDisabled && !isSelected && !isEdge && !inRange && 'text-ink-700 hover:bg-ink-100',
                inRange && 'bg-brand-50 text-brand-900',
                (isSelected || isEdge) && 'bg-brand-900 font-medium text-white',
                isToday && !isSelected && !isEdge && 'ring-1 ring-inset ring-brand-300',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
