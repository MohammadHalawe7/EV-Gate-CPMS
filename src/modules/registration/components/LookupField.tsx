/* =============================================================================
 * Lookup-backed controls.
 *
 * Thin adapters over the design system's `Autocomplete`, `MultiSelect` and
 * `Select` that read their options from the Configuration / Lookup registry
 * and localise the label through `ln()`. Screens name a lookup key; they never
 * hold an option list.
 * ========================================================================== */

import { useMemo, type ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Field, Select } from '@/components/ui/Field';
import { getDependentLookup, getLookup, type LookupKey } from '@/data/lookups';

function useOptions(key: LookupKey, parentId?: string | null, dependent = false) {
  const { ln, locale } = useI18n();
  return useMemo(() => {
    const rows = dependent ? getDependentLookup(key, parentId) : getLookup(key);
    return rows
      .map((o) => ({ value: o.id, label: ln(o) }))
      .sort((a, b) => a.label.localeCompare(b.label, locale === 'ar' ? 'ar' : 'en'));
  }, [key, parentId, dependent, ln, locale]);
}

/* -------------------------------------------------------------------------- */

/** Searchable single select over one lookup. */
export function LookupSelect({
  lookup,
  value,
  onChange,
  label,
  hint,
  error,
  required,
  placeholder,
  disabled,
  onBlur,
  className,
}: {
  lookup: LookupKey;
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onBlur?: () => void;
  className?: string;
}) {
  const options = useOptions(lookup);
  return (
    <Field label={label} hint={typeof hint === 'string' ? hint : undefined} error={error} required={required} className={className}>
      <div onBlur={onBlur}>
        <Autocomplete
          options={options}
          value={value || null}
          onChange={(v) => onChange(v ?? '')}
          placeholder={placeholder}
          disabled={disabled}
          invalid={Boolean(error)}
        />
      </div>
    </Field>
  );
}

/**
 * Searchable single select whose options depend on a parent selection. With no
 * parent chosen the control is disabled and says so, rather than opening onto
 * an empty list.
 */
export function DependentLookupSelect({
  lookup,
  parentId,
  value,
  onChange,
  label,
  error,
  required,
  placeholder,
  waitingHint,
  onBlur,
  className,
}: {
  lookup: LookupKey;
  parentId: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  waitingHint: string;
  onBlur?: () => void;
  className?: string;
}) {
  const options = useOptions(lookup, parentId, true);
  const waiting = !parentId;
  return (
    <Field
      label={label}
      hint={waiting ? waitingHint : undefined}
      error={error}
      required={required}
      className={className}
    >
      <div onBlur={onBlur}>
        <Autocomplete
          options={options}
          value={value || null}
          onChange={(v) => onChange(v ?? '')}
          placeholder={placeholder}
          disabled={waiting}
          invalid={Boolean(error)}
        />
      </div>
    </Field>
  );
}

/** Multi select over one lookup. */
export function LookupMultiSelect({
  lookup,
  value,
  onChange,
  label,
  hint,
  error,
  required,
  placeholder,
  onBlur,
  className,
}: {
  lookup: LookupKey;
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  onBlur?: () => void;
  className?: string;
}) {
  const options = useOptions(lookup);
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      <div onBlur={onBlur}>
        <MultiSelect
          options={options}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          invalid={Boolean(error)}
        />
      </div>
    </Field>
  );
}

/**
 * Native select over a short, ordered lookup — gender, employee band. A list of
 * three to eight fixed options does not need a type-ahead.
 */
export function LookupNativeSelect({
  lookup,
  value,
  onChange,
  label,
  hint,
  error,
  required,
  placeholder,
  onBlur,
  className,
}: {
  lookup: LookupKey;
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder: string;
  onBlur?: () => void;
  className?: string;
}) {
  const { ln } = useI18n();
  const options = getLookup(lookup);
  const id = `lk-${lookup}`;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={className}>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {ln(o)}
          </option>
        ))}
      </Select>
    </Field>
  );
}

/** Resolves a lookup id to its localised label, for read-only summaries. */
export function useLookupLabel() {
  const { ln } = useI18n();
  return (key: LookupKey, id: string | undefined | null): string => {
    if (!id) return '—';
    const found = getLookup(key).find((o) => o.id === id);
    return found ? ln(found) : id;
  };
}
