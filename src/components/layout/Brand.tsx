import type { CSSProperties } from 'react';
import { cx } from '@/lib/utils';

/**
 * EV Gate lockup. The SVG is applied as a CSS mask so the mark inherits
 * `currentColor` — the brand allows the logo in purple, saffron or white only.
 */
export function EvGateLogo({
  variant = 'full',
  height = 26,
  className,
  style,
}: {
  variant?: 'full' | 'mark';
  height?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ratio = variant === 'full' ? 1000 / 500 : 838 / 334;
  return (
    <span
      role="img"
      aria-label="EV Gate"
      className={cx('eg-logo', className)}
      style={{
        ['--eg-logo-url' as string]: `url("/evgate-${variant === 'full' ? 'logo' : 'mark'}.svg")`,
        height,
        width: height * ratio,
        ...style,
      }}
    />
  );
}

/**
 * The lockup used in the sidebar and the application header.
 *
 * `suffix` is the product name that sits after the rule — EV Gate CPMS passes
 * "CPMS". It is a prop rather than a constant so the foundation carries no
 * product identity; omit it and the mark stands alone.
 */
export function BrandLockup({
  compact,
  suffix,
  className,
}: {
  compact?: boolean;
  suffix?: string;
  className?: string;
}) {
  return (
    <span className={cx('flex items-center gap-2.5', className)}>
      <EvGateLogo variant={compact ? 'mark' : 'full'} height={compact ? 16 : 22} className="text-brand-900" />
      {!compact && suffix && (
        <span className="hidden border-s border-ink-200 ps-2.5 text-[11px] font-medium uppercase leading-tight tracking-wider text-ink-400 lg:inline-block">
          {suffix}
        </span>
      )}
    </span>
  );
}
