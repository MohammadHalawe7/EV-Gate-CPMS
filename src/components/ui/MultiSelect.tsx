import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cx } from '@/lib/utils';
import { CONTROL_BASE, CONTROL_FORCED, CONTROL_INTERACTIVE, type ControlState } from './Field';

export interface MultiSelectOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

/**
 * Type-ahead multiple select. The sibling of `Autocomplete` — same control
 * skin, same listbox surface — differing only in that selections accumulate
 * as removable chips inside the control.
 *
 * `openPanel` pins the popup open for the catalogue. `max` caps the number of
 * selections; `summaryThreshold` collapses a long selection into a count so
 * the control never grows unbounded inside a form grid.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  disabled,
  invalid,
  state,
  openPanel,
  emptyLabel = 'No matches',
  max,
  summaryThreshold = 4,
  className,
}: {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  state?: ControlState;
  openPanel?: boolean;
  emptyLabel?: ReactNode;
  max?: number;
  summaryThreshold?: number;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = openPanel ?? focused;
  const selected = useMemo(
    () => value.map((v) => options.find((o) => o.value === v)).filter(Boolean) as MultiSelectOption[],
    [value, options],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (option: MultiSelectOption) => {
    if (option.disabled) return;
    if (value.includes(option.value)) {
      onChange(value.filter((v) => v !== option.value));
    } else {
      if (max && value.length >= max) return;
      onChange([...value, option.value]);
    }
  };

  const collapsed = selected.length > summaryThreshold;
  const chips = collapsed ? selected.slice(0, summaryThreshold) : selected;

  return (
    <div className={cx('relative', className)}>
      <div
        onClick={() => !disabled && inputRef.current?.focus()}
        className={cx(
          CONTROL_BASE,
          state ? CONTROL_FORCED[state] : CONTROL_INTERACTIVE,
          'flex min-h-9 w-full flex-wrap items-center gap-1.5 py-1 ps-2.5 pe-8 text-[13px]',
          disabled ? 'cursor-not-allowed' : 'cursor-text',
          invalid && 'border-danger-500 focus-within:border-danger-500',
        )}
      >
        {chips.map((option) => (
          <span
            key={option.value}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-50 py-0.5 ps-2 pe-1 text-[12px] font-medium text-brand-800 ring-1 ring-inset ring-brand-100"
          >
            <span dir="auto" className="truncate">{option.label}</span>
            {!disabled && (
              <button
                type="button"
                aria-label={`Remove ${option.label}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(value.filter((v) => v !== option.value));
                }}
                className="rounded-full p-0.5 text-brand-500 transition-colors hover:bg-brand-100 hover:text-brand-900"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {collapsed && (
          <span className="tnum rounded-full bg-ink-100 px-2 py-0.5 text-[12px] font-medium text-ink-600">
            +{selected.length - summaryThreshold}
          </span>
        )}
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          disabled={disabled}
          value={query}
          placeholder={selected.length === 0 ? placeholder : ''}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && query === '' && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          className="min-w-24 flex-1 bg-transparent py-1 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 disabled:cursor-not-allowed"
        />
        <ChevronDown className="pointer-events-none absolute end-2.5 top-2.5 h-4 w-4 text-ink-400" />
      </div>

      {open && (
        <div className="eg-scroll absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-[10px] border border-ink-200 bg-white p-1 shadow-[var(--shadow-overlay)]">
          {filtered.length === 0 ? (
            <p className="flex items-center gap-2 px-2.5 py-2 text-[12.5px] text-ink-400">
              <Search className="h-3.5 w-3.5" />
              {emptyLabel}
            </p>
          ) : (
            filtered.map((option) => {
              const isSelected = value.includes(option.value);
              const blocked = !isSelected && Boolean(max) && value.length >= (max as number);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled || blocked}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(option)}
                  className={cx(
                    'flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-start text-[13px] transition-colors disabled:cursor-not-allowed disabled:text-ink-300',
                    isSelected ? 'bg-brand-50 text-brand-900' : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
                  )}
                >
                  <span
                    className={cx(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border',
                      isSelected ? 'border-brand-800 bg-brand-800 text-white' : 'border-ink-300 bg-white',
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </span>
                  <span dir="auto" className="min-w-0 flex-1 truncate">
                    {option.label}
                    {option.hint && <span className="ms-1.5 text-[11.5px] text-ink-400">{option.hint}</span>}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
