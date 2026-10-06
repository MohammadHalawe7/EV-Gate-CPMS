import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cx } from '@/lib/utils';
import { CONTROL_BASE, CONTROL_FORCED, CONTROL_INTERACTIVE, type ControlState } from './Field';

export interface AutocompleteOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * Type-ahead single select. Shares the text-control skin with `Input` /
 * `Select` (`CONTROL_BASE`) so there is one border, radius and focus ring in
 * the product; the listbox reuses the Menu surface language.
 *
 * `openPanel` pins the popup open — the Design System renders the open state
 * statically rather than hiding it behind an interaction.
 */
export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = 'Search…',
  disabled,
  invalid,
  state,
  openPanel,
  emptyLabel = 'No matches',
  className,
}: {
  options: AutocompleteOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  state?: ControlState;
  openPanel?: boolean;
  emptyLabel?: ReactNode;
  className?: string;
}) {
  const selected = options.find((o) => o.value === value) ?? null;
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const open = openPanel ?? focused;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={wrapRef} className={cx('relative', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          disabled={disabled}
          value={focused || openPanel ? query : (selected?.label ?? '')}
          placeholder={selected ? selected.label : placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          className={cx(
            CONTROL_BASE,
            state ? CONTROL_FORCED[state] : CONTROL_INTERACTIVE,
            'h-9 ps-8.5 pe-8 text-[13px]',
            invalid && 'border-danger-500 focus:border-danger-500',
          )}
        />
        {selected ? (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={() => {
              onChange(null);
              setQuery('');
            }}
            className="absolute end-2 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        )}
      </div>

      {open && (
        <div className="eg-scroll absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-[10px] border border-ink-200 bg-white p-1 shadow-[var(--shadow-overlay)]">
          {filtered.length === 0 ? (
            <p className="px-2.5 py-2 text-[12.5px] text-ink-400">{emptyLabel}</p>
          ) : (
            filtered.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(option.value);
                    setQuery('');
                    setFocused(false);
                  }}
                  className={cx(
                    'flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-start text-[13px] transition-colors',
                    isSelected ? 'bg-brand-50 text-brand-900' : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                    {option.hint && <span className="ms-1.5 text-[11.5px] text-ink-400">{option.hint}</span>}
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-brand-700" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
