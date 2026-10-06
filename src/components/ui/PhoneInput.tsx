import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/lib/utils';
import { CONTROL_BASE, CONTROL_FORCED, CONTROL_INTERACTIVE, type ControlState } from './Field';

export interface DialCode {
  /** ISO 3166-1 alpha-2, used as the option key. */
  code: string;
  label: string;
  dial: string;
}

export interface PhoneValue {
  /** ISO country code of the selected dial code. */
  country: string;
  /** National number, digits only. */
  number: string;
}

/**
 * A phone number is two fields that read as one control: a country dial code
 * and a national number. They share a single border and focus ring, with a
 * `border-e` between them so the pair mirrors in RTL without a second rule.
 *
 * The number is always laid out left-to-right — `dir="ltr"` on the input —
 * because a phone number is a Latin figure sequence even in Arabic prose.
 */
export function PhoneInput({
  value,
  onChange,
  codes,
  disabled,
  invalid,
  state,
  placeholder = '50 123 4567',
  className,
  id,
}: {
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  codes: DialCode[];
  disabled?: boolean;
  invalid?: boolean;
  state?: ControlState;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const [focused, setFocused] = useState(false);
  const active = codes.find((c) => c.code === value.country) ?? codes[0];

  const sorted = useMemo(
    () => [...codes].sort((a, b) => a.label.localeCompare(b.label)),
    [codes],
  );

  return (
    <div
      className={cx(
        CONTROL_BASE,
        state ? CONTROL_FORCED[state] : focused ? 'border-brand-500 ring-2 ring-brand-500/15' : CONTROL_INTERACTIVE,
        'flex h-9 w-full items-stretch p-0',
        invalid && 'border-danger-500',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <div className="relative flex shrink-0 items-center border-e border-ink-200">
        <select
          aria-label="Country dial code"
          disabled={disabled}
          value={active?.code ?? ''}
          onChange={(e) => onChange({ ...value, country: e.target.value })}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="h-full cursor-pointer appearance-none bg-transparent ps-2.5 pe-7 text-[13px] text-ink-800 outline-none disabled:cursor-not-allowed"
        >
          {sorted.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} {c.dial}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        dir="ltr"
        disabled={disabled}
        value={value.number}
        placeholder={placeholder}
        onChange={(e) => onChange({ ...value, number: e.target.value.replace(/[^\d\s-]/g, '') })}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="tnum min-w-0 flex-1 bg-transparent px-2.5 text-start text-[13px] text-ink-900 outline-none placeholder:text-ink-400 disabled:cursor-not-allowed"
      />
    </div>
  );
}

/** `+971 50 123 4567` — the display form, for tables and summaries. */
export function formatPhone(value: PhoneValue, codes: DialCode[]): string {
  const dial = codes.find((c) => c.code === value.country)?.dial ?? '';
  return value.number ? `${dial} ${value.number}`.trim() : '';
}
