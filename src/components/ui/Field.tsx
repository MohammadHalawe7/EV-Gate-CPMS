import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Search, X } from 'lucide-react';
import { cx } from '@/lib/utils';

/** Visual state a control specimen can be pinned to (Design System only). */
export type ControlState = 'hover' | 'focus';

/** Always applied to every text-like control. */
export const CONTROL_BASE =
  'w-full rounded-[7px] border border-ink-300 bg-white text-ink-900 placeholder:text-ink-400 ' +
  'transition-colors duration-100 disabled:bg-ink-100 disabled:text-ink-400 disabled:cursor-not-allowed';

/** The real pointer/keyboard behaviour. */
export const CONTROL_INTERACTIVE =
  'hover:border-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 focus:outline-none';

/**
 * The same colours without the pseudo-class prefix so a state can be rendered
 * statically. Written out literally — Tailwind extracts class names from source.
 */
export const CONTROL_FORCED: Record<ControlState, string> = {
  hover: 'border-ink-400',
  focus: 'border-brand-500 ring-2 ring-brand-500/15',
};

const controlBase = `${CONTROL_BASE} ${CONTROL_INTERACTIVE}`;

function controlClasses(state?: ControlState) {
  return state ? `${CONTROL_BASE} ${CONTROL_FORCED[state]}` : controlBase;
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-ink-700">
          {label}
          {required && <span className="text-danger-500 ms-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[12px] text-danger-700">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; state?: ControlState }
>(function Input({ className, invalid, state, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cx(
        controlClasses(state),
        'h-9 px-3 text-[13px]',
        invalid && 'border-danger-500 focus:border-danger-500',
        className,
      )}
      {...rest}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean; state?: ControlState }
>(function Textarea({ className, rows = 3, invalid, state, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cx(
        controlClasses(state),
        'px-3 py-2 text-[13px] resize-y',
        invalid && 'border-danger-500 focus:border-danger-500',
        className,
      )}
      {...rest}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { state?: ControlState }>(
  function Select({ className, children, state, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cx(
          controlClasses(state),
          'h-9 ps-3 pe-8 text-[13px] appearance-none bg-no-repeat',
          'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23737c94\' stroke-width=\'2\' stroke-linecap=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")]',
          'bg-[position:right_0.6rem_center] rtl:bg-[position:left_0.6rem_center]',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
  state,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  state?: ControlState;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
      <input
        id={id}
        value={value}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(controlClasses(state), 'h-9 ps-8.5 pe-8 text-[13px]')}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
  className,
  indeterminate,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
  indeterminate?: boolean;
}) {
  return (
    <label className={cx('inline-flex items-center gap-2 cursor-pointer select-none', disabled && 'cursor-not-allowed opacity-60', className)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        ref={(el) => {
          if (el) el.indeterminate = Boolean(indeterminate) && !checked;
        }}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded-[4px] border-ink-300 text-brand-800 accent-[#2a0944] focus:ring-brand-500/30"
      />
      {label && <span className="text-[13px] text-ink-700">{label}</span>}
    </label>
  );
}

export function Radio({
  checked,
  onChange,
  label,
  hint,
  disabled,
  name,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  label?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  name?: string;
  className?: string;
}) {
  return (
    <label
      className={cx(
        'inline-flex items-start gap-2 cursor-pointer select-none',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 border-ink-300 text-brand-800 accent-[#2a0944] focus:ring-brand-500/30"
      />
      {(label || hint) && (
        <span className="min-w-0">
          {label && <span className="block text-[13px] text-ink-700">{label}</span>}
          {hint && <span className="block text-[12px] text-ink-500">{hint}</span>}
        </span>
      )}
    </label>
  );
}

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  name,
  orientation = 'vertical',
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; hint?: ReactNode; disabled?: boolean }[];
  name: string;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      className={cx(orientation === 'horizontal' ? 'flex flex-wrap items-start gap-x-5 gap-y-2' : 'flex flex-col gap-2', className)}
    >
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          checked={option.value === value}
          disabled={option.disabled}
          label={option.label}
          hint={option.hint}
          onChange={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-150',
          checked ? 'bg-brand-800' : 'bg-ink-300',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-150',
            checked ? 'start-4.5' : 'start-0.5',
          )}
        />
      </button>
      {(label || hint) && (
        <div className="min-w-0">
          {label && <div className="text-[13px] font-medium text-ink-800">{label}</div>}
          {hint && <div className="text-[12px] text-ink-500">{hint}</div>}
        </div>
      )}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div className={cx('inline-flex rounded-[8px] bg-ink-100 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-[6px] font-medium transition-colors duration-100',
            size === 'sm' ? 'px-2.5 h-7 text-[12px]' : 'px-3 h-8 text-[13px]',
            value === o.value ? 'bg-white text-ink-900 shadow-[0_1px_2px_rgba(25,30,46,0.08)]' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
