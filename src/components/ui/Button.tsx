import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'subtle';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/** Visual state a specimen can be pinned to (Design System only). */
export type ForcedState = 'hover' | 'active';

type Variant = ButtonVariant;
type Size = ButtonSize;

/**
 * Each variant carries three literal class strings:
 *  - `base`        always applied
 *  - `interactive` the real `hover:` / `active:` behaviour
 *  - `forced`      the *same* colours without the pseudo-class prefix, so the
 *                  Design System can render a hover/active specimen statically.
 *
 * They are written out literally (rather than derived) because Tailwind
 * extracts class names from source text — a runtime-built `hover:` string
 * would never be compiled.
 */
const VARIANTS: Record<Variant, { base: string; interactive: string; forced: Record<ForcedState, string> }> = {
  primary: {
    base: 'bg-brand-900 text-white border border-transparent shadow-[0_1px_2px_rgba(25,30,46,0.08)] disabled:bg-ink-300',
    interactive: 'hover:bg-brand-800 active:bg-brand-950',
    forced: { hover: 'bg-brand-800', active: 'bg-brand-950' },
  },
  secondary: {
    base: 'bg-white text-ink-800 border border-ink-300 disabled:text-ink-400',
    interactive: 'hover:bg-ink-50 hover:border-ink-400 active:bg-ink-100',
    forced: { hover: 'bg-ink-50 border-ink-400', active: 'bg-ink-100 border-ink-400' },
  },
  ghost: {
    base: 'bg-transparent text-ink-600 border border-transparent disabled:text-ink-400',
    interactive: 'hover:bg-ink-100 hover:text-ink-900',
    forced: { hover: 'bg-ink-100 text-ink-900', active: 'bg-ink-200 text-ink-900' },
  },
  subtle: {
    base: 'bg-brand-50 text-brand-800 border border-brand-100 disabled:text-ink-400',
    interactive: 'hover:bg-brand-100',
    forced: { hover: 'bg-brand-100', active: 'bg-brand-200' },
  },
  danger: {
    base: 'bg-danger-500 text-white border border-transparent disabled:bg-ink-300',
    interactive: 'hover:bg-danger-700 active:bg-danger-700',
    forced: { hover: 'bg-danger-700', active: 'bg-danger-700' },
  },
  accent: {
    base: 'bg-accent-400 text-brand-900 border border-accent-500/40 disabled:bg-ink-200',
    interactive: 'hover:bg-accent-300 active:bg-accent-500',
    forced: { hover: 'bg-accent-300', active: 'bg-accent-500' },
  },
};

const SIZES: Record<Size, string> = {
  xs: 'h-7 px-2 text-[12px] gap-1 rounded-[6px]',
  sm: 'h-8 px-2.5 text-[13px] gap-1.5 rounded-[6px]',
  md: 'h-9 px-3.5 text-[13px] gap-2 rounded-[7px]',
  lg: 'h-11 px-5 text-[14px] gap-2 rounded-[8px]',
};

/** Focus ring painted by the global `:focus-visible` rule, mirrored for specimens. */
export const FORCED_FOCUS_RING = 'outline outline-2 outline-offset-2 outline-brand-500';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
  className?: string;
  /**
   * Pin the button to a visual state instead of waiting for the pointer.
   * Used by the Design System so states are visible in a static capture.
   */
  state?: ForcedState;
}

export type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

function classes({ variant = 'secondary', size = 'md', fullWidth, className, state }: BaseProps) {
  const v = VARIANTS[variant];
  return cx(
    'inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors duration-100',
    'disabled:cursor-not-allowed disabled:opacity-70 select-none',
    v.base,
    state ? v.forced[state] : v.interactive,
    SIZES[size],
    fullWidth && 'w-full',
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, icon, iconEnd, loading, fullWidth, className, children, disabled, state, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={classes({ variant, size, fullWidth, className, state })}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
      {iconEnd}
    </button>
  );
});

export function LinkButton({
  to,
  variant,
  size,
  icon,
  iconEnd,
  fullWidth,
  className,
  children,
  state,
}: BaseProps & { to: string }) {
  return (
    <Link to={to} className={classes({ variant, size, fullWidth, className, state })}>
      {icon}
      {children}
      {iconEnd}
    </Link>
  );
}

export function IconButton({
  label,
  size = 'md',
  variant = 'ghost',
  className,
  children,
  state,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: Size; variant?: Variant; state?: ForcedState }) {
  const dims = size === 'xs' ? 'h-6 w-6' : size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const v = VARIANTS[variant];
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex items-center justify-center rounded-[7px] transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed',
        v.base,
        state ? v.forced[state] : v.interactive,
        dims,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cx('animate-spin h-3.5 w-3.5', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
